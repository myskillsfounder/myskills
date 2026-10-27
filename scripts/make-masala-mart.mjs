// Masala Mart: the fictional practice dataset for AI-Powered Data Analytics.
// A D2C spice brand that sells online across India. Every module's tasks use
// these files, so each module adds a step on the same data.
//
//   node scripts/make-masala-mart.mjs
//
// Writes public/practice-data/masala-mart/ (served at
// myskills.org.in/practice-data/masala-mart/). The numbers are seeded, so
// running it again gives the same files, and the checks quoted in the
// programme's task hints stay true. Change the seed or the rules and you must
// re-check those hints.
import fs from 'node:fs'
import path from 'node:path'

const OUT = path.join(process.cwd(), 'public', 'practice-data', 'masala-mart')

// A small seeded random number generator (mulberry32).
let seed = 20261027
const rand = () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const pick = (xs) => xs[Math.floor(rand() * xs.length)]
const weighted = (pairs) => {
  const total = pairs.reduce((n, [, w]) => n + w, 0)
  let r = rand() * total
  for (const [x, w] of pairs) if ((r -= w) <= 0) return x
  return pairs[pairs.length - 1][0]
}
const pad = (n, w = 2) => String(n).padStart(w, '0')
const iso = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
const dmy = (d) => `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`
const day = (y, m, d) => new Date(Date.UTC(y, m - 1, d))
const addDays = (d, n) => new Date(d.getTime() + n * 86400000)

// Products: the price list. Two SKUs sold from September 2026 are not on it
// yet, so a lookup shows "Not found" for them.
const products = [
  ['MM-WS-01', 'Whole black pepper', 'Whole spices', 100, 180],
  ['MM-WS-02', 'Green cardamom', 'Whole spices', 50, 260],
  ['MM-WS-03', 'Cloves', 'Whole spices', 50, 140],
  ['MM-WS-04', 'Cinnamon sticks', 'Whole spices', 100, 120],
  ['MM-WS-05', 'Cumin seeds', 'Whole spices', 200, 150],
  ['MM-GS-01', 'Turmeric powder', 'Ground spices', 200, 110],
  ['MM-GS-02', 'Kashmiri chilli powder', 'Ground spices', 200, 190],
  ['MM-GS-03', 'Coriander powder', 'Ground spices', 200, 95],
  ['MM-GS-04', 'Black pepper powder', 'Ground spices', 100, 170],
  ['MM-GS-05', 'Dry ginger powder', 'Ground spices', 100, 130],
  ['MM-BL-01', 'Garam masala', 'Masala blends', 100, 160],
  ['MM-BL-02', 'Chole masala', 'Masala blends', 100, 120],
  ['MM-BL-03', 'Sambar powder', 'Masala blends', 200, 150],
  ['MM-BL-04', 'Biryani masala', 'Masala blends', 100, 175],
  ['MM-BL-05', 'Chai masala', 'Masala blends', 50, 140],
  ['MM-BL-06', 'Pav bhaji masala', 'Masala blends', 100, 110],
  ['MM-GB-01', 'Festive spice box', 'Gift boxes', 600, 899],
  ['MM-GB-02', 'Kerala spice trail box', 'Gift boxes', 450, 749],
  ['MM-GB-03', 'Chai lovers box', 'Gift boxes', 300, 549],
]
const notOnList = [
  ['MM-BL-07', 'Kolkata biryani masala', 'Masala blends', 100, 185],
  ['MM-GB-04', 'Diwali mini box', 'Gift boxes', 250, 399],
]
const allProducts = [...products, ...notOnList]

const cities = [
  ['Mumbai', 18], ['Bengaluru', 17], ['Delhi', 15], ['Pune', 10], ['Hyderabad', 10],
  ['Chennai', 9], ['Kolkata', 7], ['Jaipur', 5], ['Kochi', 5], ['Lucknow', 4],
]
const channels = [['Instagram', 40], ['Google', 25], ['Referral', 15], ['Marketplace', 20]]

// Customers: 800, signed up from July 2025 to September 2026.
const start = day(2025, 7, 1)
const end = day(2026, 9, 30)
const span = Math.round((end - start) / 86400000)
const customers = []
for (let i = 1; i <= 800; i++) {
  const signed = addDays(start, Math.floor(rand() * (span + 1)))
  customers.push({ id: `C${pad(i, 4)}`, city: weighted(cities), signed, channel: weighted(channels), never: rand() < 0.17, appetite: 0.3 + rand() * rand() * 6 })
}
customers.sort((a, b) => a.signed - b.signed || a.id.localeCompare(b.id))
customers.forEach((c, i) => (c.id = `C${pad(i + 1, 4)}`))

// Orders: October 2025 to September 2026. Diwali (20 October 2025) lifts
// October and November; gift boxes sell mostly then.
const monthly = { '2025-10': 230, '2025-11': 190, '2025-12': 150, '2026-01': 140, '2026-02': 135, '2026-03': 150, '2026-04': 165, '2026-05': 175, '2026-06': 170, '2026-07': 160, '2026-08': 170, '2026-09': 195 }
const orders = []
let n = 10001
for (const [ym, count] of Object.entries(monthly)) {
  const [y, m] = ym.split('-').map(Number)
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const festive = ym === '2025-10' || ym === '2025-11' || ym === '2026-09'
  for (let k = 0; k < count; k++) {
    const date = day(y, m, 1 + Math.floor(rand() * days))
    const able = customers.filter((c) => !c.never && c.signed <= date)
    const c = weighted(able.map((x) => [x, x.appetite]))
    let list = festive ? [[0, 0], ...allProducts.map((p) => [p, p[2] === 'Gift boxes' ? 4 : 2])] : products.map((p) => [p, p[2] === 'Gift boxes' ? 0.4 : 2])
    if (ym === '2026-09') list = [...list, ...notOnList.map((p) => [p, 6])]
    else list = list.filter(([p]) => p && !notOnList.includes(p))
    const p = weighted(list.filter(([x]) => x))
    const qty = p[2] === 'Gift boxes' ? weighted([[1, 85], [2, 12], [3, 3]]) : weighted([[1, 40], [2, 30], [3, 18], [4, 8], [6, 4]])
    const pay = weighted([['UPI', 60], ['Card', 15], ['COD', 25]])
    const returnRate = { UPI: 0.05, Card: 0.04, COD: 0.17 }[pay]
    const value = p[4] * qty + (pay === 'COD' ? 40 : 0)
    orders.push({ id: `MM${n++}`, date, customer: c.id, city: c.city, sku: p[0], qty, value, pay, returned: rand() < returnRate ? 1 : 0 })
  }
}
orders.sort((a, b) => a.date - b.date || a.id.localeCompare(b.id))
orders.forEach((o, i) => (o.id = `MM${10001 + i}`))

// The messy export: the same orders as a warehouse system sends them, with
// dd/mm/yyyy dates, cities typed different ways, "₹" amounts, blank cities
// and rows sent twice.
const variants = {
  Bengaluru: ['Bangalore', 'BLR', 'bengaluru', 'Bengaluru '],
  Mumbai: ['Bombay', 'mumbai', 'Mumbai '],
  Delhi: ['New Delhi', 'delhi', 'DELHI'],
  Kolkata: ['Calcutta'],
  Kochi: ['Cochin'],
}
const rupees = (v) => `₹${v.toLocaleString('en-IN')}`
const raw = []
for (const o of orders) {
  let city = o.city
  if (variants[city] && rand() < 0.22) city = pick(variants[city])
  if (rand() < 0.006) city = ''
  const value = rand() < 0.5 ? rupees(o.value) : String(o.value)
  const row = { order_id: o.id, order_date: dmy(o.date), customer_id: o.customer, city, sku: o.sku, quantity: o.qty, order_value: value, payment_method: o.pay, returned: o.returned }
  raw.push(row)
  if (rand() < 0.02) raw.push({ ...row })
}

const csv = (header, rows) => [header.join(','), ...rows.map((r) => r.map((v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v)).join(','))].join('\n') + '\n'

fs.mkdirSync(OUT, { recursive: true })
fs.writeFileSync(path.join(OUT, 'products.csv'), csv(['sku', 'product_name', 'category', 'pack_grams', 'price'], products))
fs.writeFileSync(path.join(OUT, 'customers.csv'), csv(['customer_id', 'city', 'signed_up', 'channel'], customers.map((c) => [c.id, c.city, iso(c.signed), c.channel])))
fs.writeFileSync(path.join(OUT, 'orders.csv'), csv(['order_id', 'order_date', 'customer_id', 'city', 'sku', 'quantity', 'order_value', 'payment_method', 'returned'], orders.map((o) => [o.id, iso(o.date), o.customer, o.city, o.sku, o.qty, o.value, o.pay, o.returned])))
fs.writeFileSync(path.join(OUT, 'orders_raw.csv'), csv(Object.keys(raw[0]), raw.map((r) => Object.values(r))))
console.log(`products ${products.length}, customers ${customers.length}, orders ${orders.length}, orders_raw ${raw.length} rows`)
