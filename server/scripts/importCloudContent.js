// Preview: node server/scripts/importCloudContent.js
// Import:  node server/scripts/importCloudContent.js --apply
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const mongoose = require('mongoose');
const { collections, validateConnections, planContent } = require('../utils/contentImport');
const EJSON = mongoose.mongo.BSON.EJSON;

async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--apply')) throw new Error('Use no arguments for preview, or --apply to import.');
  const sourceUri = process.env.MONGO_URI_ATLAS;
  const destinationUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/language-lms';
  validateConnections(sourceUri, destinationUri);
  const source = mongoose.createConnection(sourceUri, { serverSelectionTimeoutMS: 15000 });
  const destination = mongoose.createConnection(destinationUri, { serverSelectionTimeoutMS: 15000 });
  try {
    await Promise.all([source.asPromise(), destination.asPromise()]);
    const read = async connection => Object.fromEntries(await Promise.all(collections.map(async ([name, fields]) => [name, await connection.collection(name).find({}).project(Object.fromEntries(['_id', 'createdAt', 'updatedAt', ...fields].map(field => [field, 1]))).toArray()])));
    const [cloud, local] = await Promise.all([read(source), read(destination)]);
    if (!cloud.courses.length) throw new Error('No courses found in the cloud source. Check its database name before importing.');
    const plans = planContent(cloud, local);
    console.log(JSON.stringify({ mode: args.includes('--apply') ? 'apply' : 'preview', collections: plans.map(plan => ({ name: plan.name, cloud: cloud[plan.name].length, insert: plan.insert.length, existingPreserved: plan.skipped })) }, null, 2));
    if (!args.includes('--apply')) return;
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'bhasahub-content-backup-'));
    fs.chmodSync(directory, 0o700);
    const file = path.join(directory, 'local-content-before.ejson');
    fs.writeFileSync(file, EJSON.stringify(local), { mode: 0o600 });
    console.log(JSON.stringify({ backup: file }));
    let inserted = 0;
    for (const plan of plans) {
      // Insert-only upserts preserve concurrent local edits and repeated imports.
      for (const doc of plan.insert) {
        const result = await destination.collection(plan.name).updateOne({ _id: doc._id }, { $setOnInsert: doc }, { upsert: true });
        inserted += result.upsertedCount;
      }
      const actual = await destination.collection(plan.name).find({ _id: { $in: plan.before.map(doc => doc._id) } }).project(Object.fromEntries(['_id', 'createdAt', 'updatedAt', ...collections.find(([name]) => name === plan.name)[1]].map(field => [field, 1]))).toArray();
      const canonical = doc => EJSON.stringify(Object.fromEntries(Object.entries(doc).sort(([a], [b]) => a.localeCompare(b))));
      const byId = new Map(actual.map(doc => [String(doc._id), canonical(doc)]));
      if (plan.before.some(doc => byId.get(String(doc._id)) !== canonical(doc))) throw new Error(`Existing local ${plan.name} content changed during import. Backup is available.`);
      if (await destination.collection(plan.name).countDocuments({ _id: { $in: plan.insert.map(doc => doc._id) } }) !== plan.insert.length) throw new Error(`Could not verify all imported ${plan.name}.`);
    }
    console.log(JSON.stringify({ inserted, localContentPreserved: true, accountsAndProgressUntouched: true, cloudUnchanged: true }));
  } finally {
    await Promise.allSettled([source.close(), destination.close()]);
  }
}
main().catch(error => {
  console.error(`${error.name}: ${String(error.message).replace(/mongodb(?:\+srv)?:\/\/\S+/g, '[database connection]')}`);
  process.exitCode = 1;
});
