import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js';
import { getFirestore, doc } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: 'AIzaSyBzkmeMET5yqJ0xyGq55vKwKq5NCR0wF4g',
    authDomain: 'aciaequifax.firebaseapp.com',
    projectId: 'aciaequifax',
    storageBucket: 'aciaequifax.firebasestorage.app',
    messagingSenderId: '591342597581',
    appId: '1:591342597581:web:e40d784d9f15e64dd30084',
    measurementId: 'G-PW413V81Y4'
};

export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firestoreDb = getFirestore(firebaseApp);
export const planosDocRef = doc(firestoreDb, 'configuracoes', 'planos');
export const consultasDocRef = doc(firestoreDb, 'configuracoes', 'consultas');
