# 🚀 Deployment Guide - Render.com

## 📋 Pre-Deployment Checklist

- [x] `render.yaml` configuration created
- [x] `.env.example` updated with all required variables
- [x] Health check endpoint added (`/`)
- [x] Enhanced server logging
- [x] `.gitignore` configured

---

## 🔧 Step 1: Prepare Your Code

```bash
# Verify everything works locally
npm run dev

# Check if health endpoint works
curl http://localhost:5000/

# Expected response:
# {
#   "status": "success",
#   "message": "AdvanceEdu Backend API is running",
#   ...
# }
```

---

## 📤 Step 2: Push to GitHub

```bash
# Add all changes
git add .

# Commit
git commit -m "Add Render deployment configuration"

# Push to GitHub
git push origin main
```

---

## 🌐 Step 3: Deploy on Render

### 3.1 Create Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub (recommended)

### 3.2 Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `Nafiz001/advanceedu-backend-assignment`
3. Configure:
   - **Name**: `advanceedu-backend` (or your choice)
   - **Region**: Choose closest to you (e.g., Oregon)
   - **Branch**: `main`
   - **Root Directory**: Leave blank
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

### 3.3 Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these variables one by one:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | |
| `PORT` | `5000` | |
| `MONGO_URI` | Your MongoDB Atlas URI | See Step 4 below |
| `JWT_SECRET` | Strong random string (32+ chars) | Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `STRIPE_SECRET_KEY` | `sk_live_...` or `sk_test_...` | From Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | Leave blank for now | Will add after Step 5 |

### 3.4 Deploy
1. Click **"Create Web Service"**
2. Wait 2-3 minutes for deployment
3. Once deployed, you'll get a URL like: `https://advanceedu-backend.onrender.com`

---

## 🗄️ Step 4: Configure MongoDB Atlas

### 4.1 Whitelist Render IPs
1. Go to MongoDB Atlas Dashboard
2. **Network Access** → **Add IP Address**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - Or add Render's IP ranges if you prefer stricter security

### 4.2 Get Connection String
1. **Database** → **Connect** → **Connect your application**
2. Copy the connection string
3. Replace `<username>` and `<password>` with your DB credentials
4. Add database name: `/advanceedu` before the `?`

Example:
```
mongodb+srv://username:password@cluster0.rcvljwd.mongodb.net/advanceedu?retryWrites=true&w=majority
```

### 4.3 Update Render Environment Variable
1. Go to Render Dashboard → Your service
2. **Environment** → Edit `MONGO_URI`
3. Paste the connection string
4. Click **"Save Changes"** (triggers auto-redeploy)

---

## 💳 Step 5: Configure Stripe Webhook

### 5.1 Add Webhook Endpoint in Stripe Dashboard
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. **Developers** → **Webhooks** → **Add endpoint**
3. **Endpoint URL**: `https://your-app.onrender.com/api/webhook`
   - Replace `your-app` with your actual Render URL
4. **Events to listen for**:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Click **"Add endpoint"**

### 5.2 Get Webhook Signing Secret
1. Click on the newly created webhook
2. **Signing secret** → Click **"Reveal"**
3. Copy the secret (starts with `whsec_`)

### 5.3 Add to Render
1. Go to Render Dashboard → Your service
2. **Environment** → Add new variable:
   - **Key**: `STRIPE_WEBHOOK_SECRET`
   - **Value**: Paste the `whsec_...` secret
3. Click **"Save Changes"** (triggers auto-redeploy)

---

## ✅ Step 6: Verify Deployment

### 6.1 Check Health Endpoint
```bash
curl https://your-app.onrender.com/

# Expected response:
# {
#   "status": "success",
#   "message": "AdvanceEdu Backend API is running",
#   ...
# }
```

### 6.2 Check Logs
1. Render Dashboard → Your service → **Logs**
2. Look for:
```
✅ Server running on port 5000
📊 Environment: production
🗄️  Database: Configured
🔑 JWT Secret: Configured
💳 Stripe Key: Configured
🔔 Webhook Secret: Configured
🚀 Server ready to accept requests
```

### 6.3 Test Authentication
```bash
# Register a test user
curl -X POST https://your-app.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 6.4 Test Stripe Webhook
1. Create an order through your API
2. Use Stripe Dashboard → **Events** → **Send test event**
3. Select `payment_intent.succeeded`
4. Check Render logs for webhook processing

---

## 🔍 Troubleshooting

### Deployment Failed
```bash
# Check Render logs for errors
# Common issues:
# - Missing dependencies: Check package.json
# - Build errors: Check Node version compatibility
```

### Database Connection Error
```bash
# Verify MongoDB Atlas:
# - IP whitelist includes 0.0.0.0/0
# - Connection string includes database name
# - Username/password are correct
```

### Webhook Not Working
```bash
# Check Stripe Dashboard → Webhooks → Your endpoint
# Look for:
# - Recent requests (should show 200 status)
# - If 400/500, check Render logs for errors
```

### App Sleeping (Free Tier)
- Free tier sleeps after 15 minutes of inactivity
- First request takes ~30 seconds to wake up
- Solution: Upgrade to $7/month for 24/7 uptime

---

## 🔒 Security Checklist

- [x] `.env` file not committed to Git
- [x] Strong JWT secret (32+ characters)
- [x] MongoDB Atlas IP whitelist configured
- [x] Stripe webhook signature verification enabled
- [ ] Consider upgrading to paid plan for custom domain
- [ ] Consider adding rate limiting for production
- [ ] Consider adding request logging/monitoring

---

## 📊 Monitor Your Deployment

### Render Dashboard
- **Logs**: Real-time server logs
- **Metrics**: CPU, memory, request count
- **Deploys**: Deployment history

### Stripe Dashboard
- **Webhooks**: Monitor webhook delivery
- **Events**: See all payment events
- **Logs**: API request logs

---

## 🚀 Post-Deployment

### Update Your Frontend (if any)
```javascript
// Update API base URL
const API_URL = "https://your-app.onrender.com/api";
```

### Test All Endpoints
- [ ] POST `/api/auth/register`
- [ ] POST `/api/auth/login`
- [ ] GET `/api/products`
- [ ] POST `/api/orders` (requires auth)
- [ ] Stripe webhook processing

### Share Your API
Your API is now live at:
```
https://your-app.onrender.com
```

**Endpoints:**
- Auth: `/api/auth/*`
- Users: `/api/users/*`
- Products: `/api/products/*`
- Orders: `/api/orders/*`
- Webhook: `/api/webhook` (Stripe only)

---

## 🎯 Quick Deploy Checklist

```bash
# 1. Local verification
npm run dev
curl http://localhost:5000/

# 2. Commit and push
git add .
git commit -m "Add Render deployment configuration"
git push origin main

# 3. Render.com
# - Create web service
# - Connect GitHub repo
# - Add environment variables
# - Deploy

# 4. MongoDB Atlas
# - Whitelist IPs (0.0.0.0/0)
# - Get connection string
# - Update MONGO_URI in Render

# 5. Stripe Dashboard
# - Add webhook endpoint
# - Copy webhook secret
# - Update STRIPE_WEBHOOK_SECRET in Render

# 6. Test
curl https://your-app.onrender.com/
```

---

## 🆘 Need Help?

- **Render Docs**: https://render.com/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com
- **Stripe Webhooks**: https://stripe.com/docs/webhooks

**Your deployment is ready! Follow the steps above and your API will be live in ~10 minutes.** 🎉
