// Merge dot-notation translations into nested locale JSON, without touching existing keys.
const fs = require('fs');
const lang = process.argv[2];
if (!lang) { console.error('usage: node merge_locale.js <lang>'); process.exit(1); }

const localePath = `src/i18n/locales/${lang}.json`;
const transPath = `trans_${lang}.json`;

const locale = JSON.parse(fs.readFileSync(localePath, 'utf8'));
const trans = JSON.parse(fs.readFileSync(transPath, 'utf8'));

let added = 0, skipped = 0;
for (const dotKey of Object.keys(trans)) {
  const parts = dotKey.split('.');
  let node = locale.translation;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!(p in node) || typeof node[p] !== 'object' || node[p] === null) {
      node[p] = {};
    }
    node = node[p];
  }
  const leaf = parts[parts.length - 1];
  if (Object.prototype.hasOwnProperty.call(node, leaf)) {
    console.log('SKIP existing key (not overwritten):', dotKey);
    skipped++;
    continue;
  }
  node[leaf] = trans[dotKey];
  added++;
}

fs.writeFileSync(localePath, JSON.stringify(locale, null, 2) + '\n', 'utf8');
console.log(lang, 'added:', added, 'skipped:', skipped);

// verify leaf count
function flatten(obj, prefix='', out={}) {
  for (const k in obj) {
    const val = obj[k];
    const key = prefix ? prefix+'.'+k : k;
    if (val && typeof val === 'object' && !Array.isArray(val)) flatten(val, key, out);
    else out[key] = val;
  }
  return out;
}
const flat = flatten(locale.translation);
console.log(lang, 'final leaf count:', Object.keys(flat).length);
