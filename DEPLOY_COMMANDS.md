# 🚀 Quick Deploy Commands

## Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Test Locally Before Deploy
```bash
npm run dev
curl http://localhost:5000/
```

## Git Commands
```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

## Test Deployed API
```bash
# Replace YOUR_APP_NAME with your Render service name
export API_URL="https://YOUR_APP_NAME.onrender.com"

# Health check
curl $API_URL/

# Register user
curl -X POST $API_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'

# Login
curl -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## Environment Variables Needed on Render

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster0.xxx.mongodb.net/advanceedu?retryWrites=true&w=majority
JWT_SECRET=<generate with command above>
STRIPE_SECRET_KEY=sk_live_... (or sk_test_...)
STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe Dashboard after adding webhook)
```

## Stripe Webhook URL
```
https://YOUR_APP_NAME.onrender.com/api/webhook
```

## MongoDB Atlas Setup
1. Network Access → Add IP → Allow 0.0.0.0/0
2. Get connection string with database name: `/advanceedu`

---

**Read full guide:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
