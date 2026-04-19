# spiritual-revamp — Complete Setup Guide

## Prerequisites

- Node.js v18+
- MongoDB Atlas account (free tier works)
- Razorpay account (test mode)
- Cloudinary account (free tier)

---

## Step 1 — Clone & Install

```bash
# Install all three apps
cd backend   && npm install
cd ../frontend && npm install
cd ../admin    && npm install
```

---

## Step 2 — Configure Backend

```bash
cd backend
cp .env.example .env
```

Open `.env` and fill in:

| Variable | Where to get it |
|---|---|
| `MONGO_URI` | MongoDB Atlas → Connect → Drivers |
| `JWT_SECRET` | Any random 32+ char string |
| `RAZORPAY_KEY_ID` | Razorpay Dashboard → Settings → API Keys |
| `RAZORPAY_KEY_SECRET` | Same as above |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Dashboard |
| `CLOUDINARY_API_KEY` | Cloudinary Dashboard → API Keys |
| `CLOUDINARY_API_SECRET` | Cloudinary Dashboard → API Keys |
| `ADMIN_EMAIL` | Your admin email |
| `ADMIN_PASSWORD` | Your admin password |

---

## Step 3 — Seed the Database

```bash
cd backend
npm run seed
```

This will:
- Create 4 products (Money, Protection, Love, Energy)
- Link upsells between products
- Create your admin user

---

## Step 4 — Start All Servers

Open 3 terminal windows:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

**Terminal 3 — Admin:**
```bash
cd admin
npm run dev
# Runs on http://localhost:5174
```

---

## Step 5 — Access the App

| App | URL | Credentials |
|---|---|---|
| Store | http://localhost:5173 | — |
| Admin | http://localhost:5174 | admin@spiritual-revamp.in / Admin@123 |
| API | http://localhost:5000/api | — |

---

## Razorpay Test Mode

Use these test card details on checkout:
- Card: `4111 1111 1111 1111`
- Expiry: Any future date
- CVV: Any 3 digits
- OTP: `123456`

---

## Production Deployment

### Frontend + Admin → Vercel

```bash
# Frontend
cd frontend
npm run build
# Deploy dist/ to Vercel

# Admin
cd admin
npm run build
# Deploy dist/ to Vercel (separate project)
```

Set environment variable in Vercel:
```
VITE_API_URL=https://your-backend.railway.app/api
```

### Backend → Railway / Render

1. Push backend to GitHub
2. Connect repo to Railway or Render
3. Add all environment variables from `.env`
4. Deploy

### Database → MongoDB Atlas

1. Create free M0 cluster
2. Whitelist IP: `0.0.0.0/0` (all IPs)
3. Create database user
4. Get connection string → paste in `MONGO_URI`

---

## Folder Structure

```
spiritual-revamp/
│
├── backend/
│   ├── server.js                 # Entry point
│   ├── .env.example              # Environment template
│   └── src/
│       ├── config/
│       │   ├── db.js             # MongoDB connection
│       │   └── cloudinary.js     # Image upload config
│       ├── models/
│       │   ├── User.js           # User + auth
│       │   ├── Product.js        # Product catalog
│       │   ├── Order.js          # Orders + tracking
│       │   └── Review.js         # Customer reviews
│       ├── controllers/          # Business logic
│       ├── routes/               # API routes
│       ├── middleware/
│       │   └── auth.js           # JWT + admin guard
│       └── scripts/
│           └── seed.js           # Database seeder
│
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Home.jsx          # Landing page
│       │   ├── Collection.jsx    # Category/shop page
│       │   ├── ProductDetail.jsx # Product page
│       │   ├── Cart.jsx          # Cart with upsells
│       │   ├── Checkout.jsx      # Multi-step checkout
│       │   ├── OrderConfirmation.jsx
│       │   ├── About.jsx
│       │   ├── Contact.jsx
│       │   └── Login.jsx
│       ├── components/
│       │   ├── layout/           # Navbar, Footer, etc.
│       │   ├── home/             # Hero, Testimonials, etc.
│       │   ├── product/          # ProductCard, etc.
│       │   └── ui/               # Timer, Stars, etc.
│       ├── context/              # Cart + Auth state
│       ├── services/             # API calls
│       └── data/                 # Static fallback data
│
└── admin/
    └── src/
        ├── pages/
        │   ├── Dashboard.jsx     # Analytics + charts
        │   ├── Products.jsx      # Product list
        │   ├── AddProduct.jsx    # Add/edit form
        │   ├── Orders.jsx        # Order management
        │   ├── Customers.jsx     # Customer list
        │   └── Reviews.jsx       # Approve reviews
        └── components/
            └── AdminLayout.jsx   # Sidebar layout
```

---

## Key Conversion Features

| Feature | Location | Purpose |
|---|---|---|
| Countdown timer | Product page, Cart | Urgency |
| Stock counter | Product card | Scarcity |
| Free shipping bar | Cart | Increase AOV |
| Upsell grid | Cart | Cross-sell |
| Sticky mobile CTA | Product page | Never lose the buy |
| Before/After section | Product page | Transformation copy |
| Verified review badges | Reviews | Social proof |
| Affirmation cards | Product page | Emotional connection |
| COD available | Checkout | Reduce friction |
| Coupon codes | Cart | Capture fence-sitters |

---

## Coupon Codes (Pre-configured)

| Code | Discount |
|---|---|
| `WELCOME10` | 10% off |
| `SOULSTONE20` | 20% off |

To add more, edit `backend/src/controllers/orderController.js` → `createOrder` function.

---

## Customization

### Change brand name
Search and replace `spiritual-revamp` → `YourBrand` across all files.

### Change colors
Edit `frontend/tailwind.config.js` → `colors.gold` values.

### Add products
Use the Admin panel → Products → Add Product, or edit `backend/src/scripts/seed.js`.

### Add payment gateway
Razorpay is pre-integrated. For Stripe, replace `paymentController.js` and the checkout Razorpay script.
