import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp, collection, onSnapshot } from 'firebase/firestore'
import { auth, db } from './firebase'

const STRATHMORE_DOMAIN = '@strathmore.edu'
const googleProvider = new GoogleAuthProvider()

function buildActionCodeSettings() {
  return {
    url: `${window.location.origin}/verify-email`,
    handleCodeInApp: false,
  }
}

function assertStrathmoreEmail(email, role) {
  if (role === 'vendor'|| role === 'admin') return
  if (!email || !email.toLowerCase().endsWith(STRATHMORE_DOMAIN)) {
    const error = new Error('Only @strathmore.edu accounts can register or sign in.')
    error.code = 'auth/invalid-email-domain'
    throw error
  }
}

// â”€â”€ Sign up â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function signUp({ firstName, lastName, email, password, mpesa, studentId, staffId, role, stallName }) {
  assertStrathmoreEmail(email, role)

  const cred = await createUserWithEmailAndPassword(auth, email, password)
  const uid  = cred.user.uid

  await sendEmailVerification(cred.user, buildActionCodeSettings())

  const displayName = role === 'vendor'
    ? (stallName || `${firstName} ${lastName}`.trim())
    : `${firstName} ${lastName}`.trim()

  await updateProfile(cred.user, {
    displayName,
  })

  const userData = {
    uid,
    firstName,
    lastName,
    email,
    stallName: role === 'vendor' ? (stallName || displayName) : '',
    stallId:   role === 'vendor' ? uid : '',
    mpesa:     mpesa     || '',
    studentId: studentId || '',
    staffId:   staffId   || '',
    role,
    createdAt: serverTimestamp(),
  }

  await setDoc(doc(db, 'users', uid), userData)

  if (role === 'vendor') {
    await setDoc(doc(db, 'stalls', uid), {
      id: uid,
      name: userData.stallName,
      cat: 'Campus vendor',
      color: 'rgba(240,180,41,.18)',
      hrs: '08:00â€“16:00',
      vendor: displayName,
      mpesa: mpesa || '',
      menu: [],
      online: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  return { ...userData, uid }
}

export async function signIn(email, password, role) {
  assertStrathmoreEmail(email, role)

  const cred = await signInWithEmailAndPassword(auth, email, password)
  if (!cred.user.emailVerified) {
    const error = new Error('Please verify your Strathmore email before signing in.')
    error.code = 'auth/email-not-verified'
    throw error
  }

  const uid  = cred.user.uid

  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) {
    const fallbackProfile = {
      uid,
      firstName: cred.user.displayName?.split(' ')[0] || email.split('@')[0],
      lastName: cred.user.displayName?.split(' ').slice(1).join(' ') || '',
      email,
      stallName: role === 'vendor' ? (cred.user.displayName || email.split('@')[0]) : '',
      stallId: role === 'vendor' ? uid : '',
      mpesa: '',
      studentId: '',
      staffId: '',
      role: role || 'student',
      createdAt: serverTimestamp(),
      recoveredAt: serverTimestamp(),
    }

    await setDoc(doc(db, 'users', uid), fallbackProfile, { merge: true })

    if ((role || 'student') === 'vendor') {
      await setDoc(doc(db, 'stalls', uid), {
        id: uid,
        name: fallbackProfile.stallName,
        cat: 'Campus vendor',
        color: 'rgba(240,180,41,.18)',
        hrs: '08:00â€“16:00',
        vendor: fallbackProfile.firstName,
        mpesa: '',
        menu: [],
        online: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true })
    }
    return fallbackProfile
  }
  return { uid, ...snap.data() }
}

// â”€â”€ Resend with credentials â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function resendVerification(roleHint) {
  const currentUser = auth.currentUser
  if (!currentUser) {
    const error = new Error('No signed-in account found. Please sign up or sign in again.')
    error.code = 'auth/no-current-user'
    throw error
  }

  const profile = await getUserProfile(currentUser.uid)
  const effectiveRole = roleHint || profile?.role || null

  assertStrathmoreEmail(currentUser.email, effectiveRole)

  if (currentUser.emailVerified) {
    const error = new Error('This email is already verified. You can sign in normally.')
    error.code = 'auth/already-verified'
    throw error
  }

  await sendEmailVerification(currentUser, buildActionCodeSettings())
  return true
}

// â”€â”€ Sign out â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function logOut() {
  await signOut(auth)
}

// â”€â”€ Get current user profile from Firestore â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? { uid, ...snap.data() } : null
}

export function subscribeToUsers(callback) {
  return onSnapshot(collection(db, 'users'), snap => {
    const users = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(users)
  })
}

export async function signInWithGoogle(role = 'student') {
  const result = await signInWithPopup(auth, googleProvider)
  const user = result.user
  const email = user.email || ''

  assertStrathmoreEmail(email, role)

  if (!user.emailVerified) {
    const error = new Error('Please use a Strathmore email with a verified Google account.')
    error.code = 'auth/email-not-verified'
    throw error
  }

  const uid = user.uid
  const snap = await getDoc(doc(db, 'users', uid))

  if (!snap.exists()) {
    const names = (user.displayName || email.split('@')[0]).split(' ')
    const profile = {
      uid,
      firstName: names[0] || email.split('@')[0],
      lastName: names.slice(1).join(' ') || '',
      email,
      stallName: '',
      stallId: '',
      mpesa: '',
      studentId: role === 'student' ? 'GOOGLE' : '',
      staffId: role === 'staff' ? 'GOOGLE' : '',
      role,
      createdAt: serverTimestamp(),
    }
    await setDoc(doc(db, 'users', uid), profile)
    return profile
  }

  return { uid, ...snap.data() }
}
