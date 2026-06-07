import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDfM_NNxmZav2yCMoE1BJy8eX_Ja1P_7Dg",
  authDomain: "stratheats-51dca.firebaseapp.com",
  databaseURL: "https://stratheats-51dca-default-rtdb.firebaseio.com",
  projectId: "stratheats-51dca",
  storageBucket: "stratheats-51dca.firebasestorage.app",
  messagingSenderId: "710694863448",
  appId: "1:710694863448:web:4b19788d7c2845e998002d",
  measurementId: "G-5FWSNE89YT",
}

const app  = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db   = getFirestore(app)
export default app