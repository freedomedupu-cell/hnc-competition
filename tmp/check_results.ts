import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function checkResults() {
  console.log('Querying results collection in Firestore...');
  const resultsSnap = await getDocs(collection(db, 'results'));
  console.log(`Found ${resultsSnap.size} documents in results collection:`);
  resultsSnap.forEach(doc => {
    const data = doc.data();
    console.log(`Doc ID: ${doc.id}, studentId: ${data.studentId}, studentName: ${data.studentName}, compTitle: ${data.competitionTitle}, score: ${data.score}`);
  });
}

checkResults().catch(console.error);
