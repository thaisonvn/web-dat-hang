import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const configArr = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(configArr);
const db = getFirestore(app, configArr.firestoreDatabaseId);

async function run() {
  try {
    const snap1 = await getDocs(collection(db, 'products'));
    console.log('Products fetched:', snap1.size);
  } catch (e) {
    console.error('Error:', e);
  }
}
run();
