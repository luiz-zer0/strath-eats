import {
  collection, getDocs, doc, getDoc,
  onSnapshot, query, orderBy,
} from 'firebase/firestore'
import { db } from './firebase'

// ── Get all stalls (one-time fetch) ──────────────────────────────
export async function getStalls() {
  const snap = await getDocs(collection(db, 'stalls'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ── Get single stall ─────────────────────────────────────────────
export async function getStall(stallId) {
  const snap = await getDoc(doc(db, 'stalls', stallId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// ── Live listener for all stalls ─────────────────────────────────
// Returns an unsubscribe function — call it on component unmount
export function subscribeToStalls(callback) {
  const q = query(collection(db, 'stalls'), orderBy('name'))
  return onSnapshot(q, snap => {
    const stalls = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(stalls)
  })
}

// ── Get menu for a specific stall ────────────────────────────────
export async function getMenu(stallId) {
  const snap = await getDocs(collection(db, 'stalls', stallId, 'menu'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}