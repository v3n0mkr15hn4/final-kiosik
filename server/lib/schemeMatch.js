/**
 * Shared feature extraction for scheme relevance scoring.
 * Used identically by scripts/trainRelevanceModel.js (training) and
 * routes/schemes.js (inference) so features never drift between the two.
 */

const AGE_GROUP_RANGES = {
  '18-25': [18, 25],
  '26-35': [26, 35],
  '36-45': [36, 45],
  '46-60': [46, 60],
  '60+': [60, 120],
};
export const AGE_GROUPS = Object.keys(AGE_GROUP_RANGES);

// Representative (lower-bound-ish) numeric value used to test against a scheme's max_income ceiling.
const INCOME_BUCKET_VALUE = {
  'below-1L': 50000,
  '1L-3L': 200000,
  '3L-6L': 450000,
  '6L-10L': 800000,
  'above-10L': 1500000,
};
export const INCOME_BUCKETS = Object.keys(INCOME_BUCKET_VALUE);

export const GENDERS = ['male', 'female', 'other'];
export const CATEGORIES = ['general', 'obc', 'sc', 'st', 'ews'];
export const OCCUPATIONS = [
  'farmer', 'student', 'salaried', 'self-employed', 'daily-wage',
  'street-vendor', 'homemaker', 'unemployed', 'retired',
];

// The kiosk's reference state list (server/routes/reference.js) — small subset of all
// India states/UTs. CSV applicable_states uses full state names; map id -> name here.
export const STATE_ID_TO_NAME = {
  MH: 'Maharashtra', DL: 'Delhi', KA: 'Karnataka', TN: 'Tamil Nadu',
  UP: 'Uttar Pradesh', GJ: 'Gujarat', RJ: 'Rajasthan', WB: 'West Bengal',
};

function norm(s) {
  return (s || '').toString().toLowerCase().trim();
}

export function ageGroupRange(ageGroup) {
  return AGE_GROUP_RANGES[ageGroup] || null;
}

export function incomeBucketValue(income) {
  return INCOME_BUCKET_VALUE[income] ?? null;
}

// ── Hard-filter checks: true = violates a non-blank scheme constraint ──

export function violatesGender(profileGender, schemeGender) {
  const g = norm(schemeGender);
  if (!g || g === 'all') return false;
  return norm(profileGender) !== g;
}

export function violatesAge(ageGroup, minAge, maxAge) {
  if (minAge == null && maxAge == null) return false;
  const range = ageGroupRange(ageGroup);
  if (!range) return false;
  const lo = minAge ?? 0;
  const hi = maxAge ?? 150;
  // No overlap between [range] and [lo,hi] => violation
  return range[1] < lo || range[0] > hi;
}

export function violatesIncome(income, maxIncome) {
  if (maxIncome == null) return false;
  const val = incomeBucketValue(income);
  if (val == null) return false;
  return val > maxIncome;
}

export function violatesState(stateId, applicableStates) {
  const s = norm(applicableStates);
  if (!s || s.includes('all india') || s.includes('pan-india') || s.includes('pan india')) return false;
  const stateName = norm(STATE_ID_TO_NAME[stateId]);
  if (!stateName) return false; // unknown state id — don't hard-exclude on missing data
  return !s.includes(stateName);
}

// ── Soft feature scores (0/0.5/1), blank scheme field => 1 (no requirement) ──

export function ageMatch(ageGroup, minAge, maxAge) {
  if (minAge == null && maxAge == null) return 1;
  return violatesAge(ageGroup, minAge, maxAge) ? 0 : 1;
}

export function genderMatch(profileGender, schemeGender) {
  const g = norm(schemeGender);
  if (!g || g === 'all') return 1;
  return violatesGender(profileGender, schemeGender) ? 0 : 1;
}

export function incomeMatch(income, maxIncome) {
  if (maxIncome == null) return 1;
  return violatesIncome(income, maxIncome) ? 0 : 1;
}

export function categoryMatch(profileCategory, socialCategory) {
  const sc = norm(socialCategory);
  if (!sc || sc.includes('all')) return 1;
  const cat = norm(profileCategory);
  if (!cat) return 0.5;
  return sc.includes(cat) ? 1 : 0;
}

export function stateMatch(stateId, applicableStates) {
  const s = norm(applicableStates);
  if (!s || s.includes('all india') || s.includes('pan-india') || s.includes('pan india')) return 1;
  const stateName = norm(STATE_ID_TO_NAME[stateId]);
  if (!stateName) return 0.5; // unknown — neutral, don't penalize
  return s.includes(stateName) ? 1 : 0;
}

// ── TF-IDF text similarity (occupation/category keyword vs scheme corpus) ──

export function tokenize(text) {
  return norm(text).split(/[^a-z0-9]+/).filter(t => t.length > 1);
}

export function buildSchemeCorpusText(scheme) {
  return [scheme.tags, scheme.occupation_keywords, scheme.category]
    .filter(Boolean)
    .join(' ');
}

export function buildTfidfVector(tokens, idf) {
  const tf = {};
  for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
  const vec = {};
  for (const [term, count] of Object.entries(tf)) {
    if (idf[term]) vec[term] = count * idf[term];
  }
  return vec;
}

export function cosineSim(vecA, vecB) {
  let dot = 0, normA = 0, normB = 0;
  for (const v of Object.values(vecA)) normA += v * v;
  for (const v of Object.values(vecB)) normB += v * v;
  for (const [term, weight] of Object.entries(vecA)) {
    if (vecB[term]) dot += weight * vecB[term];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function occupationTextSim(profile, scheme, idf) {
  const queryText = [profile.occupation, profile.category].filter(Boolean).join(' ');
  const queryTokens = tokenize(queryText);
  if (queryTokens.length === 0) return 0;
  const queryVec = buildTfidfVector(queryTokens, idf);
  const schemeVec = buildTfidfVector(tokenize(buildSchemeCorpusText(scheme)), idf);
  return cosineSim(queryVec, schemeVec);
}

// The hard-eligibility fields (age/gender/income/state) are handled entirely by
// violatesHardFilter below — once a scheme survives that filter those fields are always a
// "pass" and carry no ranking signal. The trained relevance model therefore only ranks on
// the two fields that are never hard-filtered: how well the citizen's category/occupation
// textually fits the scheme.
export const FEATURE_NAMES = ['occupationTextSim', 'categoryMatch'];

export function extractFeatures(profile, scheme, idf) {
  return [
    occupationTextSim(profile, scheme, idf),
    categoryMatch(profile.category, scheme.social_category),
  ];
}

export function violatesHardFilter(profile, scheme) {
  return (
    violatesGender(profile.gender, scheme.gender) ||
    violatesAge(profile.ageGroup, scheme.min_age, scheme.max_age) ||
    violatesIncome(profile.income, scheme.max_income) ||
    violatesState(profile.state, scheme.applicable_states)
  );
}

export function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

// Features are z-score standardized using stats captured at training time so that the
// continuous occupationTextSim feature (small cosine values) trains/predicts on the same
// scale as the binary 0/1/0.5 features instead of being drowned out.
export function standardize(features, model) {
  return features.map((f, i) => (f - model.featureMeans[i]) / (model.featureStds[i] || 1));
}

export function predict(features, model) {
  const std = standardize(features, model);
  let z = model.bias;
  for (let i = 0; i < std.length; i++) z += std[i] * model.weights[i];
  return sigmoid(z);
}
