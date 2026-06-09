import {
  collection, addDoc, getDocs, query,
  where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

// ── Place a new order ────────────────────────────────────────────
export async function placeOrder(orderData) {
  const docRef = await addDoc(collection(db, 'orders'), {
    ...orderData,
    st:        'paid',
    createdAt: serverTimestamp(),
  })
  return { id: docRef.id, ...orderData, st: 'paid' }
}

// ── Update order status ──────────────────────────────────────────
export async function updateOrderStatus(orderId, status) {
  await updateDoc(doc(db, 'orders', orderId), {
    st:        status,
    updatedAt: serverTimestamp(),
  })
}

// ── Get orders for a user (one-time) ────────────────────────────
export async function getUserOrders(userId) {
  const q    = query(
    collection(db, 'orders'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ── Live listener for user orders ───────────────────────────────
export function subscribeToUserOrders(userId, callback, onError) {
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, snap => {
    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(orders)
  }, onError)
}

// ── Live listener for vendor orders ─────────────────────────────
export function subscribeToVendorOrders(stallId, callback, onError) {
  const q = query(
    collection(db, 'orders'),
    where('stallId', '==', stallId),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, snap => {
    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(orders)
  }, onError)
}

// ── Get all orders (admin) ───────────────────────────────────────
export function subscribeToAllOrders(callback) {
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, snap => {
    const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(orders)
  })
}

// ── Trigger M-Pesa STK Push (Django Backend) ─────────────────────
export async function triggerMpesaStkPush(orderData) {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://strath-eats.onrender.com"; 

  const response = await fetch(`${BACKEND_URL}/api/stk-push/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error('Could not reach payment server');
  }

  return await response.json();
}