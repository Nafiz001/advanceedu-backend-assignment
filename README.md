# AdvanceEdu Backend Developer Technical Assignment

A complete REST API backend built with **Node.js**, **Express**, **MongoDB**, and **Stripe** payment integration.

## 🚀 Live Demo

- **API Base URL**: `https://advanceedu-backend.onrender.com`
- **Webhook Endpoint**: `https://advanceedu-backend.onrender.com/api/webhook`
- **Health Check**: [https://advanceedu-backend.onrender.com/](https://advanceedu-backend.onrender.com/)

## 📋 Features

- ✅ User authentication with JWT
- ✅ User registration and login
- ✅ Get logged-in user profile
- ✅ Product/course management
- ✅ Order creation with Stripe payment
- ✅ Webhook handling for payment status
- ✅ Centralized error handling
- ✅ CORS enabled
- ✅ Environment variable configuration

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT (jsonwebtoken)
- **Payment Gateway**: Stripe
- **Password Hashing**: bcryptjs
- **Deployment**: Render.com

## 📁 Project Structure

```
advanceedu-backend-assignment/
├── src/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── stripe.js          # Stripe configuration
│   ├── controllers/
│   │   ├── auth.controller.js    # Registration & login
│   │   ├── user.controller.js    # User profile
│   │   ├── product.controller.js # Product CRUD
│   │   ├── order.controller.js   # Order & payment
│   │   └── webhook.controller.js # Stripe webhooks
│   ├── middlewares/
│   │   └── auth.middleware.js    # JWT verification
│   ├── models/
│   │   ├── User.js            # User schema
│   │   ├── Product.js         # Product schema
│   │   └── Order.js           # Order schema
│   ├── routes/
│   │   ├── auth.routes.js     # /api/auth
│   │   ├── user.routes.js     # /api/users
│   │   ├── product.routes.js  # /api/products
│   │   ├── order.routes.js    # /api/orders
│   │   └── webhook.routes.js  # /api/webhook
│   ├── app.js                 # Express app setup
│   └── server.js              # Server entry point
├── .env.example               # Environment variables template
├── .gitignore
├── package.json
├── render.yaml                # Render deployment config
└── README.md
```

## 🔧 Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- Stripe account (test mode)
- Stripe CLI (for webhook testing)

### 1. Clone Repository

```bash
git clone https://github.com/Nafiz001/advanceedu-backend-assignment.git
cd advanceedu-backend-assignment
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/advanceedu?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_min_32_characters
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Start MongoDB

Make sure MongoDB is running or use MongoDB Atlas connection string.

### 5. Run Development Server

```bash
npm run dev
```

Server will start on `http://localhost:5000`

## 🔐 API Endpoints

### Health Check
```
GET /
```

### Authentication
```
POST /api/auth/register    # Register new user
POST /api/auth/login       # Login user
```

### User Profile (Protected)
```
GET /api/users/me          # Get logged-in user profile
```

### Products
```
POST /api/products         # Create product
GET  /api/products         # Get all products
```

### Orders & Payment (Protected)
```
POST /api/orders           # Create order & initiate payment
```

### Webhook (Stripe Only)
```
POST /api/webhook          # Handle Stripe webhooks
```

## 💳 Payment Flow

### Step-by-Step Payment Process

1. **User Registration/Login**
   ```bash
   POST /api/auth/register
   # Returns JWT token
   ```

2. **Create Product** (if needed)
   ```bash
   POST /api/products
   {
     "name": "Premium Course",
     "description": "Complete backend course",
     "price": 4999
   }
   # Note: Price is in cents (4999 = $49.99)
   ```

3. **Create Order** (Authenticated)
   ```bash
   POST /api/orders
   Headers: Authorization: Bearer <jwt_token>
   {
     "productId": "product_id_here"
   }
   
   # Response:
   {
     "orderId": "order_id",
     "clientSecret": "pi_xxx_secret_yyy"
   }
   ```

4. **Order Created in MongoDB**
   - Status: `pending`
   - PaymentIntent ID stored
   - User and product linked

5. **Confirm Payment** (Using Stripe CLI)
   ```bash
   # Extract PaymentIntent ID from clientSecret (before _secret_)
   stripe payment_intents confirm pi_xxx --payment-method pm_card_visa
   ```

6. **Stripe Webhook Triggered**
   - Event: `payment_intent.succeeded`
   - Webhook endpoint receives event
   - Signature verified
   - Order status updated to `paid`

7. **Payment Complete**
   - Order status in MongoDB: `paid`
   - User can access purchased product

### Payment Flow Diagram

```
User → Register/Login → Get JWT Token
  ↓
Select Product → Create Order → PaymentIntent Created
  ↓
Order Saved (status: pending, paymentIntentId: pi_xxx)
  ↓
Confirm Payment (Stripe CLI or Frontend)
  ↓
Stripe → Webhook → payment_intent.succeeded
  ↓
Backend → Verify Signature → Update Order (status: paid)
  ↓
Payment Complete ✅
```

## 🧪 Testing with Postman

### Import Collection

1. Open Postman
2. Click **Import**
3. Select `AdvanceEdu_Backend_API.postman_collection.json`
4. Collection imported with all endpoints

### Set Base URL

In Postman collection variables:
```
base_url = http://localhost:5000
```

For production:
```
base_url = https://advanceedu-backend.onrender.com
```

### Testing Flow

1. **Register User** → JWT token saved automatically
2. **Get My Profile** → Verify authentication works
3. **Create Product** → Product ID saved automatically
4. **Create Order** → PaymentIntent ID saved automatically
5. **Confirm Payment** (use Stripe CLI):
   ```bash
   stripe payment_intents confirm <payment_intent_id> --payment-method pm_card_visa
   ```
6. **Check Logs** → Order status updated to "paid"

## 🔍 Webhook Testing

### Local Development

1. **Start Stripe CLI Listener**
   ```bash
   stripe listen --forward-to http://localhost:5000/api/webhook
   ```

2. **Copy Webhook Secret**
   ```
   > Ready! Your webhook signing secret is whsec_xxx...
   ```

3. **Update .env**
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   ```

4. **Restart Server**
   ```bash
   npm run dev
   ```

5. **Create Order & Confirm Payment**
   ```bash
   # Create order via Postman
   # Get PaymentIntent ID from response
   
   # Confirm payment
   stripe payment_intents confirm pi_xxx --payment-method pm_card_visa
   ```

6. **Check Logs**
   ```
   🔥 Stripe webhook endpoint hit
   ✅ Webhook signature verified successfully
   📨 Event type received: payment_intent.succeeded
   💳 PaymentIntent succeeded: pi_xxx
   ✅ Order updated successfully
   ```

### Test Cards

```
Success: pm_card_visa
Decline: pm_card_chargeDeclined
Insufficient Funds: pm_card_chargeDeclinedInsufficientFunds
```

## 🚀 Deployment (Render.com)

### Quick Deploy

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

3. **Create Web Service**
   - New → Web Service
   - Connect repository
   - Configure:
     - Name: `advanceedu-backend`
     - Build: `npm install`
     - Start: `npm start`

4. **Add Environment Variables**
   ```
   NODE_ENV=production
   PORT=5000
   MONGO_URI=<your_mongodb_atlas_uri>
   JWT_SECRET=<generated_secret>
   STRIPE_SECRET_KEY=sk_live_xxx (or sk_test_xxx)
   STRIPE_WEBHOOK_SECRET=<leave blank initially>
   ```

5. **Deploy**
   - Wait 2-3 minutes
   - Get URL: `https://advanceedu-backend.onrender.com`

6. **Configure Stripe Webhook**
   - Stripe Dashboard → Webhooks → Add endpoint
   - URL: `https://advanceedu-backend.onrender.com/api/webhook`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy webhook secret
   - Add to Render environment variables

7. **Test Production**
   ```bash
   curl https://advanceedu-backend.onrender.com/
   ```

**Detailed Guide**: See sections below for complete setup and testing instructions.

## 📚 Documentation

- **[README.md](README.md)** - Complete project documentation
- **[Postman Collection](AdvanceEdu_Backend_API.postman_collection.json)** - API documentation with examples
- **[.env.example](.env.example)** - Environment variables template

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ Password hashing with bcryptjs
- ✅ Stripe webhook signature verification
- ✅ Environment variables for sensitive data
- ✅ CORS enabled
- ✅ Centralized error handling
- ✅ Protected routes with middleware

## 📝 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` or `production` |
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | JWT signing secret | 32+ character string |
| `STRIPE_SECRET_KEY` | Stripe API key | `sk_test_xxx` or `sk_live_xxx` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | `whsec_xxx` |

## 🐛 Troubleshooting

### MongoDB Connection Failed
- Verify `MONGO_URI` in `.env`
- Check MongoDB Atlas IP whitelist (allow 0.0.0.0/0)
- Ensure database name is included in URI

### JWT Authentication Failed
- Check `Authorization` header: `Bearer <token>`
- Verify `JWT_SECRET` is set
- Token might be expired (default 7 days)

### Stripe Webhook Not Working
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Check webhook signature verification
- Ensure `express.raw()` middleware is before `express.json()`
- Use Stripe CLI for local testing:
  ```bash
  stripe listen --forward-to http://localhost:5000/api/webhook
  ```

### Order Status Not Updating
- Verify webhook is being triggered (check Stripe Dashboard)
- Check server logs for webhook processing
- Ensure PaymentIntent ID matches order in database
- Create a new order for each test (PaymentIntents are idempotent)

## 📊 API Response Format

### Success Response
```json
{
  "status": "success",
  "data": { ... }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error description"
}
```

## 🧪 Running Tests

```bash
# Manual testing with Postman
# Import collection and follow testing flow
```

## 📦 Dependencies

```json
{
  "bcryptjs": "^3.0.3",
  "cors": "^2.8.5",
  "dotenv": "^17.2.3",
  "express": "^5.2.1",
  "express-async-handler": "^1.2.0",
  "jsonwebtoken": "^9.0.3",
  "mongoose": "^9.1.3",
  "stripe": "^20.1.2"
}
```

## 🤝 Contributing

This is a technical assignment project. For production use, consider:
- Adding input validation (express-validator)
- Implementing rate limiting
- Adding request logging (morgan)
- Adding unit & integration tests
- Implementing pagination for product listing
- Adding order history endpoint
- Implementing refund functionality

## 📄 License

ISC

## 👤 Author

**Nafiz**
- GitHub: [@Nafiz001](https://github.com/Nafiz001)
- Repository: [advanceedu-backend-assignment](https://github.com/Nafiz001/advanceedu-backend-assignment)

## 📞 Supthe troubleshooting section above
2. Review the Postman collection examples
3. Check Render deployment logs
4. Verify environment variables are correctly setG_GUIDE.md](STRIPE_WEBHOOK_TESTING_GUIDE.md)
2. Review [FIX_SUMMARY.md](FIX_SUMMARY.md)
3. Check Render deployment logs
4. Verify environment variables

---

**Built with ❤️ for AdvanceEdu Backend Developer Technical Assignment**
