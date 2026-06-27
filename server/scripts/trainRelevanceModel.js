/**
 * Trains the small scheme-relevance model used by routes/schemes.js.
 *
 * The hard eligibility fields (age/gender/income/applicable_states) are handled by a
 * deterministic filter (lib/schemeMatch.js#violatesHardFilter) — once a scheme survives
 * that filter those fields are always a "pass" and add no ranking signal. So this model's
 * only job is RANKING the survivors: how well does the citizen's occupation/category
 * textually fit the scheme (tags/occupation_keywords/category)? Self-supervised: for each
 * scheme we detect which of the app's fixed occupation/category vocab actually appears in
 * its own text, sample matching ("relevant") and non-matching ("irrelevant") profiles from
 * that, and fit a small 2-feature logistic regression on the labels.
 *
 * Run: `npm run train:schemes` (run import:schemes first).
 * Outputs: server/data/tfidf.json, server/data/relevanceModel.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import {
  CATEGORIES, OCCUPATIONS, tokenize, buildSchemeCorpusText, extractFeatures, sigmoid, predict,
} from '../lib/schemeMatch.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Step 1: load schemes, build TF-IDF (vocabulary + IDF) over the scheme corpus ──

function buildTfidf(schemes) {
  const df = {}; // document frequency per term
  const docsTokens = schemes.map(s => tokenize(buildSchemeCorpusText(s)));
  for (const tokens of docsTokens) {
    const seen = new Set(tokens);
    for (const t of seen) df[t] = (df[t] || 0) + 1;
  }
  const N = schemes.length;
  const idf = {};
  for (const [term, count] of Object.entries(df)) {
    // Drop near-useless terms (in almost every doc, or appears only once — noise)
    if (count < 2 || count > N * 0.5) continue;
    idf[term] = Math.log(N / count);
  }
  return idf;
}

// ── Step 2: which of the app's fixed occupation/category options actually fit a scheme ──

function matchingOccupations(scheme) {
  const occ = (scheme.occupation_keywords || '').toLowerCase();
  const tags = (scheme.tags || '').toLowerCase();
  const text = `${occ} ${tags}`;
  return OCCUPATIONS.filter(o => text.includes(o.replace('-', ' ')) || text.includes(o));
}

function matchingCategories(scheme) {
  const sc = (scheme.social_category || '').toLowerCase();
  if (!sc || sc.includes('all')) return CATEGORIES; // unrestricted — any category is "relevant"
  return CATEGORIES.filter(c => sc.includes(c));
}

// ── Step 3: synthetic relevant/irrelevant profile generation per scheme ──

function relevantProfile(scheme, trueOccs, trueCats) {
  return {
    occupation: trueOccs.length ? pick(trueOccs) : pick(OCCUPATIONS),
    category: trueCats.length ? pick(trueCats) : pick(CATEGORIES),
  };
}

function irrelevantProfile(scheme, trueOccs, trueCats) {
  const otherOccs = OCCUPATIONS.filter(o => !trueOccs.includes(o));
  const otherCats = CATEGORIES.filter(c => !trueCats.includes(c));
  return {
    occupation: otherOccs.length ? pick(otherOccs) : pick(OCCUPATIONS),
    category: otherCats.length ? pick(otherCats) : pick(CATEGORIES),
  };
}

// ── Step 4: plain-JS logistic regression (batch gradient descent + L2) ──

function trainLogisticRegression(X, y, { epochs = 400, lr = 0.5, l2 = 0.001 } = {}) {
  const nFeatures = X[0].length;
  let weights = new Array(nFeatures).fill(0);
  let bias = 0;
  const n = X.length;

  for (let epoch = 0; epoch < epochs; epoch++) {
    const gradW = new Array(nFeatures).fill(0);
    let gradB = 0;
    for (let i = 0; i < n; i++) {
      let z = bias;
      for (let j = 0; j < nFeatures; j++) z += weights[j] * X[i][j];
      const pred = sigmoid(z);
      const err = pred - y[i];
      for (let j = 0; j < nFeatures; j++) gradW[j] += err * X[i][j];
      gradB += err;
    }
    for (let j = 0; j < nFeatures; j++) {
      weights[j] -= lr * (gradW[j] / n + l2 * weights[j]);
    }
    bias -= lr * (gradB / n);
  }
  return { weights, bias };
}

function accuracy(X, y, model) {
  let correct = 0;
  for (let i = 0; i < X.length; i++) {
    const pred = predict(X[i], model) >= 0.5 ? 1 : 0;
    if (pred === y[i]) correct++;
  }
  return correct / X.length;
}

function computeStats(X) {
  const n = X.length, d = X[0].length;
  const means = new Array(d).fill(0);
  for (const row of X) for (let j = 0; j < d; j++) means[j] += row[j] / n;
  const stds = new Array(d).fill(0);
  for (const row of X) for (let j = 0; j < d; j++) stds[j] += (row[j] - means[j]) ** 2 / n;
  for (let j = 0; j < d; j++) stds[j] = Math.sqrt(stds[j]) || 1;
  return { means, stds };
}

function standardizeAll(X, means, stds) {
  return X.map(row => row.map((v, j) => (v - means[j]) / stds[j]));
}

// ── Main ──

const db = new Database(path.join(__dirname, '..', 'suvidha.db'));
const schemes = db.prepare("SELECT * FROM schemes WHERE status = 'Active'").all();
console.log(`Loaded ${schemes.length} schemes.`);

const idf = buildTfidf(schemes);
console.log(`Built TF-IDF vocabulary: ${Object.keys(idf).length} terms.`);

const X = [], y = [];
const POS_PER_SCHEME = 5, NEG_PER_SCHEME = 5;
for (const scheme of schemes) {
  const trueOccs = matchingOccupations(scheme);
  const trueCats = matchingCategories(scheme);
  for (let i = 0; i < POS_PER_SCHEME; i++) {
    const profile = relevantProfile(scheme, trueOccs, trueCats);
    X.push(extractFeatures(profile, scheme, idf));
    y.push(1);
  }
  for (let i = 0; i < NEG_PER_SCHEME; i++) {
    const profile = irrelevantProfile(scheme, trueOccs, trueCats);
    X.push(extractFeatures(profile, scheme, idf));
    y.push(0);
  }
}
console.log(`Generated ${X.length} synthetic (profile, scheme) training pairs.`);

// 80/20 shuffle split
const idx = [...X.keys()];
for (let i = idx.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [idx[i], idx[j]] = [idx[j], idx[i]];
}
const splitAt = Math.floor(idx.length * 0.8);
const trainIdx = idx.slice(0, splitAt), valIdx = idx.slice(splitAt);
const Xtrain = trainIdx.map(i => X[i]), ytrain = trainIdx.map(i => y[i]);
const Xval = valIdx.map(i => X[i]), yval = valIdx.map(i => y[i]);

const { means, stds } = computeStats(Xtrain);
const XtrainStd = standardizeAll(Xtrain, means, stds);

const fitted = trainLogisticRegression(XtrainStd, ytrain);
const model = { weights: fitted.weights, bias: fitted.bias, featureMeans: means, featureStds: stds };

console.log('Trained logistic regression weights:', model.weights.map(w => w.toFixed(3)), 'bias:', model.bias.toFixed(3));
console.log('Train accuracy:', (accuracy(Xtrain, ytrain, model) * 100).toFixed(1) + '%');
console.log('Val accuracy:  ', (accuracy(Xval, yval, model) * 100).toFixed(1) + '%');

fs.writeFileSync(path.join(__dirname, '..', 'data', 'tfidf.json'), JSON.stringify({ idf }));
fs.writeFileSync(path.join(__dirname, '..', 'data', 'relevanceModel.json'), JSON.stringify(model));
console.log('Saved server/data/tfidf.json and server/data/relevanceModel.json');

db.close();
