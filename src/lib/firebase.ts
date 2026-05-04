import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
// Use the firestoreDatabaseId from the config
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || '(default)');
export const auth = getAuth(app);

// Connectivity check
async function testConnection() {
  try {
    // Attempt to read a dummy doc to verify connectivity
    await getDocFromServer(doc(db, 'system', 'connection_test'));
    console.log("Firebase connection established successfully.");
  } catch (error: any) {
    if (error.message?.includes('offline')) {
      console.error("Firebase connection failed: Client is offline.");
    } else {
      console.warn("Firebase initialized (Connectivity check result: " + error.message + ")");
    }
  }
}

testConnection();
