# 🖨️ PrintZone — Full Stack Shop Website

A complete professional website for a digital services & printing shop.  
**Frontend** (HTML/CSS/JS) + **Backend** (Node.js + Express + MongoDB)

---

## 📁 Project Structure

```
printzone/
├── index.html          ← Customer-facing website (open in browser)
├── admin.html          ← Admin dashboard (manage orders, products)
│
└── printzone-backend/  ← Node.js API Server
    ├── server.js
    ├── .env.example    ← Copy to .env and fill values
    ├── config/
    │   ├── database.js
    │   └── cloudinary.js
    ├── models/         User, Product, Service, Order, Contact
    ├── controllers/    auth, order, product, payment, admin
    ├── routes/         auth, orders, products, services, payments, uploads, admin, contact
    ├── middleware/     auth, errorHandler, notFound
    └── utils/          email.js, seed.js
```

---

## ⚡ Quick Setup (Step by Step)

### Step 1 — Install Node.js
Download from: https://nodejs.org (install v18 or higher)

### Step 2 — Set up MongoDB Atlas (Free)
1. Go to https://cloud.mongodb.com → Sign up free
2. Create a cluster (free tier)
3. Click "Connect" → "Connect your application"
4. Copy the connection string (looks like `mongodb+srv://...`)

### Step 3 — Set up Cloudinary (Free — for file uploads)
1. Go to https://cloudinary.com → Sign up free
2. From your dashboard, copy:
   - Cloud Name
   - API Key
   - API Secret

### Step 4 — Set up Razorpay (for payments)
1. Go to https://razorpay.com → Sign up
2. Go to Settings → API Keys → Generate Test Key
3. Copy Key ID and Key Secret

### Step 5 — Configure the Backend
```bash
cd printzone-backend
cp .env.example .env
```
Open `.env` and fill in ALL the values:
- `MONGODB_URI` — your MongoDB connection string
- `CLOUDINARY_*` — your Cloudinary credentials
- `RAZORPAY_*` — your Razorpay keys
- `EMAIL_USER` and `EMAIL_PASS` — your Gmail + App Password
- `JWT_SECRET` — any long random string (min 32 characters)

### Step 6 — Install & Run Backend
```bash
cd printzone-backend
npm install
npm run seed     # Creates admin account + sample data
npm run dev      # Start server (uses nodemon for auto-restart)
```

You'll see:
```
✅ MongoDB connected: cluster0.xxxxx.mongodb.net
🚀 PrintZone API running on port 5000
```

### Step 7 — Open the Website
- **Customer site**: open `index.html` in your browser
- **Admin panel**: open `admin.html` in your browser

Admin login (from seed):
- Email: `admin@printzone.com`
- Password: `Admin@12345`

> ⚠️ Change the admin password after first login!

---

## 🌐 API Endpoints Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register customer |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/auth/me` | Get my profile |
| PUT | `/api/v1/auth/me` | Update profile |
| PUT | `/api/v1/auth/password` | Change password |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/orders` | Place order (guest or logged in) |
| GET | `/api/v1/orders/track/:phone` | Track orders by phone |
| GET | `/api/v1/orders/my` | My orders (logged in) |
| GET | `/api/v1/orders` | All orders (admin) |
| GET | `/api/v1/orders/:id` | Single order |
| PATCH | `/api/v1/orders/:id/status` | Update status (admin) |
| PATCH | `/api/v1/orders/:id/payment` | Update payment (admin) |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/products` | List products |
| GET | `/api/v1/products/:id` | Single product |
| POST | `/api/v1/products` | Add product (admin) |
| PUT | `/api/v1/products/:id` | Update product (admin) |
| DELETE | `/api/v1/products/:id` | Delete product (admin) |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/payments/razorpay/create` | Create Razorpay order |
| POST | `/api/v1/payments/razorpay/verify` | Verify payment |
| POST | `/api/v1/payments/manual/confirm` | Confirm cash/UPI (admin) |

### Contact
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/contact` | Send message |

---

## 🚀 Deployment (Make it Live)

### Backend → Render.com (Free)
1. Push your `printzone-backend` folder to GitHub
2. Go to https://render.com → New Web Service
3. Connect your GitHub repo
4. Set:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add all your `.env` variables in the "Environment" tab
6. Deploy!
7. Copy your Render URL (e.g. `https://printzone-api.onrender.com`)

### Frontend → Netlify (Free)
1. Update `API_BASE` in `index.html` and `admin.html`:
   ```js
   const API_BASE = 'https://printzone-api.onrender.com/api/v1';
   ```
2. Go to https://netlify.com → Drag & drop your HTML files
3. Your site is live!

---

## 📱 Features Summary

### Customer Website (`index.html`)
- ✅ Beautiful hero section with animated cards
- ✅ Services section with pricing
- ✅ Products section with order buttons
- ✅ Online order form with file upload
- ✅ Quick order modal
- ✅ Contact form
- ✅ Testimonials
- ✅ Smooth animations & custom cursor
- ✅ Fully mobile responsive
- ✅ Connected to backend API (orders + contact)

### Admin Dashboard (`admin.html`)
- ✅ Secure login (JWT)
- ✅ Dashboard with stats & revenue chart
- ✅ Orders management (view, update status, mark paid)
- ✅ Products CRUD (add/edit/delete)
- ✅ Services CRUD
- ✅ Customer management
- ✅ Contact messages inbox
- ✅ Order timeline & detail view

### Backend API
- ✅ User authentication (JWT + bcrypt)
- ✅ Role-based access (customer / admin)
- ✅ Order management with status history
- ✅ Razorpay payment integration
- ✅ Cloudinary file uploads
- ✅ Email notifications (order confirmation, status updates)
- ✅ Rate limiting & security headers (Helmet)
- ✅ Input validation
- ✅ Admin dashboard analytics

---

## 🔧 Customization

### Change shop name
Search & replace `PrintZone` with your shop's name in both HTML files.

### Change phone/address
In `index.html`, search for `+91 98765 43210` and the address and replace them.

### Add real product images
In `index.html`, replace the emoji `product-thumb` divs with `<img>` tags.

### Set prices
Either edit the HTML directly, or use the Admin Dashboard → Products/Services.

---

## 📞 Need Help?

If you get stuck anywhere, share the error message and I'll help you fix it!
