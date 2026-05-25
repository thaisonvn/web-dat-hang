import fs from 'fs';
const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

async function check(dbName) {
  const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${dbName}/documents/products?key=${config.apiKey}`;
  const res = await fetch(url);
  const json = await res.json();
  console.log(dbName, json.error ? json.error.message : 'SUCCESS!');
}

await check('(default)');
await check('sakura-mart-db');
await check('sakura-mart-db-2');


