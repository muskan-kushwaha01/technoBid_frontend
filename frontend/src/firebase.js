import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyArsp-IQgfXJWS_53CC2Tmf9TPVfptofcU",
  authDomain: "technobid-b4f64.firebaseapp.com",
  projectId: "technobid-b4f64",
  storageBucket: "technobid-b4f64.firebasestorage.app",
  messagingSenderId: "76775701498",
  appId: "1:76775701498:web:bd75bc2f1a192ce7b1c243",
  measurementId: "G-C9JQM13ZHB"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);