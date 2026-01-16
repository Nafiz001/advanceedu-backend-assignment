# ✅ Render Deployment Checklist

## Files Created/Updated
- [x] `render.yaml` - Render deployment configuration
- [x] `.env.example` - Environment variables template  
- [x] `src/server.js` - Enhanced logging
- [x] `src/app.js` - Health check endpoint
- [x] `DEPLOYMENT_GUIDE.md` - Complete deployment instructions
- [x] `DEPLOY_COMMANDS.md` - Quick command reference

## Before Pushing to GitHub
- [ ] Verify `.env` is in `.gitignore` ✅ (already configured)
- [ ] Test health endpoint locally: `curl http://localhost:5000/`
- [ ] Verify all environment variables in `.env` are correct
- [ ] Generate production JWT secret (see DEPLOY_COMMANDS.md)

## GitHub
- [ ] Push to GitHub:
  ```bash
  git add .
  git commit -m "Add Render deployment configuration"
  git push origin main
  ```

## MongoDB Atlas Setup
- [ ] Login to MongoDB Atlas
- [ ] Network Access → Add IP → Allow 0.0.0.0/0
- [ ] Get connection string with database name `/advanceedu`
- [ ] Test connection locally if possible

## Render.com Setup
- [ ] Create account at render.com
- [ ] Create new Web Service
- [ ] Connect GitHub repository: `Nafiz001/advanceedu-backend-assignment`
- [ ] Configure service:
  - Name: `advanceedu-backend`
  - Region: Oregon (or closest)
  - Branch: `main`
  - Runtime: Node
  - Build: `npm install`
  - Start: `npm start`
  - Plan: Free

## Environment Variables on Render
Add these in Render Dashboard → Environment:

- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `5000`
- [ ] `MONGO_URI` = `mongodb+srv://...` (from Atlas)
- [ ] `JWT_SECRET` = `<generated-secret>`
- [ ] `STRIPE_SECRET_KEY` = `sk_test_...` (or `sk_live_...`)
- [ ] `STRIPE_WEBHOOK_SECRET` = (leave blank initially)

## Deploy
- [ ] Click "Create Web Service" on Render
- [ ] Wait 2-3 minutes for deployment
- [ ] Check logs for success messages
- [ ] Note your URL: `https://YOUR_APP_NAME.onrender.com`

## Stripe Webhook Configuration
- [ ] Go to Stripe Dashboard → Developers → Webhooks
- [ ] Add endpoint: `https://YOUR_APP_NAME.onrender.com/api/webhook`
- [ ] Select events:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
- [ ] Copy webhook signing secret (starts with `whsec_`)
- [ ] Add to Render:
  - Environment → Add `STRIPE_WEBHOOK_SECRET`
  - Paste the webhook secret
  - Save (triggers redeploy)

## Post-Deployment Testing
- [ ] Health check: `curl https://YOUR_APP_NAME.onrender.com/`
- [ ] Register user: See DEPLOY_COMMANDS.md
- [ ] Login user: See DEPLOY_COMMANDS.md
- [ ] Create order and test Stripe payment
- [ ] Verify webhook processes correctly (check Render logs)

## Monitoring
- [ ] Check Render Dashboard → Logs regularly
- [ ] Check Stripe Dashboard → Webhooks for delivery status
- [ ] Monitor MongoDB Atlas for connections

---

## Generated JWT Secret for Production

```
db1c1f5f0a1246a435d6aafddc9bc1bc0675f5e55f0aabbf0c124acb242ded2f
```

**⚠️ Use this for production or generate a new one with:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Quick Start

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Add Render deployment configuration"
   git push origin main
   ```

2. **Go to render.com** and follow DEPLOYMENT_GUIDE.md

3. **Your API will be live at:** `https://YOUR_APP_NAME.onrender.com`

---

## Important Notes

⚠️ **Free Tier Limitations:**
- Service sleeps after 15 min inactivity
- First request takes ~30s to wake up
- 750 hours/month free (enough for one service)

💡 **Upgrade to $7/month for:**
- 24/7 uptime (no sleeping)
- Faster response times
- Custom domain support

---

**Everything is ready! Follow the checklist and your API will be deployed in ~10 minutes.** 🚀
