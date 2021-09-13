import {FirebaseApp, initializeApp} from "firebase/app";
import {connectFirestoreEmulator, getFirestore,} from "firebase/firestore"
import {connectStorageEmulator, getStorage,} from "firebase/storage"
import {connectAuthEmulator, getAuth,} from "firebase/auth"

const config = {
  apiKey:           process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:       process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL:      process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId:        process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:    process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:            process.env.REACT_APP_FIREBASE_APP_ID
};

export function firebaseInit() {
  if (!firebaseApp) {
    console.log("++++ Firebase firebaseInit config", config)
    firebaseApp = initializeApp(config)

    const port_firestore = parseInt(process.env.REACT_APP_FIREBASE_EMULATOR_FIRESTORE || "")
    if (!isNaN(port_firestore)) {
      console.log("++++ Firebase emulating Firestore on port", port_firestore)
      connectFirestoreEmulator(getFirestore(), 'localhost', port_firestore)
    }

    const port_storage = parseInt(process.env.REACT_APP_FIREBASE_EMULATOR_STORAGE || "")
    if (!isNaN(port_storage)) {
      console.log("++++ Firebase emulating Storage on port", port_storage)
      connectStorageEmulator(getStorage(), 'localhost', port_storage)
    }

    const port_auth = parseInt(process.env.REACT_APP_FIREBASE_EMULATOR_AUTH || "")
    if (!isNaN(port_auth)) {
      console.log("++++ Firebase emulating Authentication on port", port_auth)
      connectAuthEmulator(getAuth(), `http://localhost:${port_auth}`)
    }
  }

}

export var firebaseApp: FirebaseApp|null


