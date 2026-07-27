import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

let dbInstance: Firestore | null = null;

export function getDb(): Firestore {
  if (!dbInstance) {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    const dbId = firebaseConfigJson.firestoreDatabaseId;
    if (dbId && dbId !== '(default)') {
      dbInstance = getFirestore(app, dbId);
    } else {
      dbInstance = getFirestore(app);
    }
  }
  return dbInstance;
}
