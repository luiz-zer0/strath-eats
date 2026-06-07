// â”€â”€ Run this ONCE to populate Firestore with stall data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// From your project root: node scripts/seedFirestore.js

import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, collection, addDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDfM_NNxmZav2yCMoE1BJy8eX_Ja1P_7Dg",
  authDomain: "stratheats-51dca.firebaseapp.com",
  projectId: "stratheats-51dca",
  storageBucket: "stratheats-51dca.firebasestorage.app",
  messagingSenderId: "710694863448",
  appId: "1:710694863448:web:4b19788d7c2845e998002d",
}

const app = initializeApp(firebaseConfig)
const db  = getFirestore(app)

const stalls = [
  {
    id: 'mama-grace',
    name: 'Mama Grace Kitchen',
    cat: 'Local meals & stews',
    color: 'rgba(37,99,235,.18)',
    hrs: '08:00â€“16:00',
    openTime: '08:00',
    closeTime: '16:00',
    vendor: 'Grace W.',
    vendorEmail: 'grace@strathmore.edu',
    active: true,
    menu: [
      { nm: 'Ugali',        pr: 40,  av: true, cat: 'Side dish', portions: null },
      { nm: 'Pilau',        pr: 120, av: true, cat: 'Main dish', portions: { half: 60,  full: 120 } },
      { nm: 'Sukuma Wiki',  pr: 50,  av: true, cat: 'Vegetable', portions: { half: 25,  full: 50  } },
      { nm: 'Chicken stew', pr: 130, av: true, cat: 'Protein',   portions: { half: 70,  full: 130 } },
      { nm: 'Beef stew',    pr: 120, av: true, cat: 'Protein',   portions: { half: 65,  full: 120 } },
      { nm: 'Chapati',      pr: 30,  av: true, cat: 'Side dish', portions: null },
      { nm: 'Rice',         pr: 50,  av: true, cat: 'Side dish', portions: { half: 25,  full: 50  } },
    ],
  },
  {
    id: 'deli-corner',
    name: 'Deli Corner',
    cat: 'Wraps, sandwiches & salads',
    color: 'rgba(240,180,41,.18)',
    hrs: '08:00â€“17:00',
    openTime: '08:00',
    closeTime: '17:00',
    vendor: 'James K.',
    vendorEmail: 'james@strathmore.edu',
    active: true,
    menu: [
      { nm: 'Club sandwich', pr: 160, av: true, cat: 'Main dish', portions: null },
      { nm: 'Chicken wrap',  pr: 140, av: true, cat: 'Main dish', portions: null },
      { nm: 'Caesar salad',  pr: 130, av: true, cat: 'Main dish', portions: { half: 70, full: 130 } },
      { nm: 'Tuna sandwich', pr: 150, av: true, cat: 'Main dish', portions: null },
    ],
  },
  {
    id: 'java-spot',
    name: 'Java Spot',
    cat: 'Beverages & snacks',
    color: 'rgba(6,182,212,.15)',
    hrs: '07:00â€“18:00',
    openTime: '07:00',
    closeTime: '18:00',
    vendor: 'Amina M.',
    vendorEmail: 'amina@strathmore.edu',
    active: true,
    menu: [
      { nm: 'Cappuccino',     pr: 80,  av: true, cat: 'Beverage', portions: null },
      { nm: 'Black coffee',   pr: 50,  av: true, cat: 'Beverage', portions: null },
      { nm: 'Masala chai',    pr: 50,  av: true, cat: 'Beverage', portions: null },
      { nm: 'Mandazi',        pr: 20,  av: true, cat: 'Snack',    portions: null },
      { nm: 'Mango smoothie', pr: 120, av: true, cat: 'Beverage', portions: null },
    ],
  },
]

async function seed() {
  console.log('Seeding Firestore...')
  for (const stall of stalls) {
    const { menu, id, ...stallData } = stall

    // Write stall document
    await setDoc(doc(db, 'stalls', id), stallData)
    console.log(` Stall created: ${stallData.name}`)

    // Write each menu item as a subcollection
    for (const item of menu) {
      await addDoc(collection(db, 'stalls', id, 'menu'), item)
    }
    console.log(`    ${menu.length} menu items added`)
  }
  console.log('\n Seeding complete! Your Firestore is ready.')
  process.exit(0)
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
