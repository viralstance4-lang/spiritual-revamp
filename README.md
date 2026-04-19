# spiritual-revamp — Premium Spiritual Bracelet Brand

A full-stack D2C e-commerce platform built for maximum conversion.

## Tech Stack

| Layer    | Technology                                      |
|----------|-------------------------------------------------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion     |
| Backend  | Node.js, Express.js, MongoDB (Mongoose)         |
| Admin    | React 18, Vite, Tailwind CSS, Recharts          |
| Payments | Razorpay                                        |
| Images   | Cloudinary                                      |
| Auth     | JWT + bcrypt                                    |

## Folder Structure

```
spiritual-revamp/
├── frontend/     → Customer-facing storefront
├── backend/      → REST API server
├── admin/        → Admin dashboard
└── README.md
```

## Quick Start

See setup instructions at the bottom of this file or follow per-folder READMEs.

### 1. Backend
```bash
cd backend
cp .env.example .env   # fill in your keys
npm install
npm run dev
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Admin
```bash
cd admin
npm install
npm run dev
```

## Environment Variables

See `backend/.env.example` for full list.

## Deployment

- Frontend + Admin → Vercel / Netlify
- Backend → Railway / Render / EC2
- DB → MongoDB Atlas
