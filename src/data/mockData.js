export const stallsDB = [
  {
    id: 1,
    name: 'Mama Grace Kitchen',
    cat: 'Local meals & stews',
    emoji: '🍛',
    color: 'rgba(37,99,235,.18)',
    hrs: '08:00–16:00',
    vendor: 'Grace W.',
    menu: [
      {
        id: 1, nm: 'Ugali', pr: 40, av: true, cat: 'Side dish',
        portions: null // can't half ugali
      },
      {
        id: 2, nm: 'Pilau', pr: 120, av: true, cat: 'Main dish',
        portions: { half: 60, full: 120 }
      },
      {
        id: 3, nm: 'Sukuma Wiki', pr: 50, av: true, cat: 'Vegetable',
        portions: { half: 25, full: 50 }
      },
      {
        id: 4, nm: 'Chicken stew', pr: 130, av: true, cat: 'Protein',
        portions: { half: 70, full: 130 }
      },
      {
        id: 5, nm: 'Beef stew', pr: 120, av: true, cat: 'Protein',
        portions: { half: 65, full: 120 }
      },
      {
        id: 6, nm: 'Chapati', pr: 30, av: true, cat: 'Side dish',
        portions: null // sold per piece
      },
      {
        id: 7, nm: 'Rice', pr: 50, av: true, cat: 'Side dish',
        portions: { half: 25, full: 50 }
      },
    ],
  },
  {
    id: 2,
    name: 'Deli Corner',
    cat: 'Wraps, sandwiches & salads',
    emoji: '🥪',
    color: 'rgba(240,180,41,.18)',
    hrs: '08:00–17:00',
    vendor: 'James K.',
    menu: [
      { id: 10, nm: 'Club sandwich', pr: 160, av: true, cat: 'Main dish', portions: null },
      { id: 11, nm: 'Chicken wrap', pr: 140, av: true, cat: 'Main dish', portions: null },
      { id: 12, nm: 'Caesar salad', pr: 130, av: true, cat: 'Main dish',
        portions: { half: 70, full: 130 }
      },
      { id: 13, nm: 'Tuna sandwich', pr: 150, av: true, cat: 'Main dish', portions: null },
    ],
  },
  {
    id: 3,
    name: 'Java Spot',
    cat: 'Beverages & snacks',
    emoji: '☕',
    color: 'rgba(6,182,212,.15)',
    hrs: '07:00–18:00',
    vendor: 'Amina M.',
    menu: [
      { id: 15, nm: 'Cappuccino', pr: 80, av: true, cat: 'Beverage', portions: null },
      { id: 16, nm: 'Black coffee', pr: 50, av: true, cat: 'Beverage', portions: null },
      { id: 17, nm: 'Masala chai', pr: 50, av: true, cat: 'Beverage', portions: null },
      { id: 18, nm: 'Mandazi', pr: 20, av: true, cat: 'Snack', portions: null },
      { id: 19, nm: 'Mango smoothie', pr: 120, av: true, cat: 'Beverage', portions: null },
    ],
  },
]

export const mockVendorOrders = [
  { id: 'ORD-8800', user: 'Louis N.', items: ['Pilau (Full)', 'Chicken stew (Half)'], tot: 250, mode: 'Dine-in', pu: '12:00', st: 'paid', rm: false },
  { id: 'ORD-8801', user: 'Alex M.', items: ['Pilau (Half)', 'Sukuma Wiki (Full)'], tot: 120, mode: 'Dine-in', pu: '12:15', st: 'paid', rm: false },
  { id: 'ORD-8803', user: 'Dr. Ochieng', items: ['Beef stew (Full)', 'Chapati'], tot: 150, mode: 'Takeaway', pu: '12:30', st: 'accepted', rm: true },
]

export const adminStats = {
  totalOrders: 127,
  totalRevenue: 19840,
  activeUsers: 341,
  activeStalls: 3,
}

export const allOrders = [
  { id: 'ORD-8800', stu: 'Louis N.', stall: 'Mama Grace Kitchen', itms: 'Pilau (Full), Chicken stew (Half)', tot: 250, type: 'Dine-in', st: 'Picked up' },
  { id: 'ORD-8801', stu: 'Alex M.', stall: 'Mama Grace Kitchen', itms: 'Pilau (Half), Sukuma Wiki', tot: 120, type: 'Dine-in', st: 'Paid — awaiting vendor' },
  { id: 'ORD-8810', stu: 'Faith W.', stall: 'Deli Corner', itms: 'Club sandwich', tot: 160, type: 'Dine-in', st: 'Picked up' },
  { id: 'ORD-8820', stu: 'Amina H.', stall: 'Java Spot', itms: 'Cappuccino, Mandazi', tot: 100, type: 'Dine-in', st: 'Picked up' },
]