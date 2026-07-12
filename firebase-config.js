/* =====================================================
   VEDANSH VISUALS — firebase-config.js
   Firebase v9 modular SDK (compat layer via CDN)

   ⚠️  REPLACE every placeholder below with your actual
       Firebase project values from:
       Firebase Console → Project Settings → Your Apps → SDK setup
   ===================================================== */

const firebaseConfig = {
  apiKey:            "AIzaSyCYB0LjE_beVTdQjmBNxR5wyfSqwesKMUo",
  authDomain:        "vedansh-visuals.firebaseapp.com",
  projectId:         "vedansh-visuals",
  storageBucket:     "vedansh-visuals.firebasestorage.app",
  messagingSenderId: "303603585338",
  appId:             "1:303603585338:web:41e351f653a89b50af0003",
  measurementId:     "G-PBVHFXXNFP"
};

/* Initialise Firebase (compat SDK — loaded via CDN in index.html) */
firebase.initializeApp(firebaseConfig);

/* Export Firestore, Auth and Storage instances */
const db      = firebase.firestore();
