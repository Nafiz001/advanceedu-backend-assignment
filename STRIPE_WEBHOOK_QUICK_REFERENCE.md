# Stripe Webhook Quick Reference

## 🚨 THE MAIN ISSUE - FIXED

**Problem:** Duplicate function declaration in webhook controller
```javascript
// ❌ WRONG (what you had)
exports.handleStripeWebhook = async (req, res) => {
  console.log("🔥 Stripe webhook hit");  // This gets overridden!

const stripe = require("../config/stripe");
exports.handleStripeWebhook = async (req, res) => {  // This one wins
  // ... actual logic
}
```

**Fix:** Remove the first declaration - keep only one ✅

---

## 🎯 Quick Test Commands

### Terminal 1: Stripe Listener
```bash
stripe listen --forward-to http://localhost:5000/api/webhook
```
Copy the `whsec_` secret to your `.env`

### Terminal 2: Your Server
```bash
npm run dev
```

### Terminal 3: Test Flow
```bash
# 1. Create order (creates PaymentIntent, saves to DB)
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"productId": "YOUR_PRODUCT_ID"}'

# Response: { "orderId": "...", "clientSecret": "pi_XXX_secret_YYY" }
# Extract PaymentIntent ID: pi_XXX (before _secret_)

# 2. Confirm the SAME PaymentIntent
stripe payment_intents confirm pi_XXX --payment-method pm_card_visa

# 3. Check logs - you should see:
# 🔥 Stripe webhook endpoint hit
# ✅ Webhook signature verified successfully
# 📨 Event type received: payment_intent.succeeded
# ✅ Order updated successfully
```

---

## ❓ Why Questions Answered

### Q1: Why doesn't my webhook fire again?
**A:** PaymentIntents are **state machines**. Once `succeeded`, they're terminal. No more events will fire.

**Solution:** Always test with fresh orders: create → confirm in ONE flow.

---

### Q2: Why doesn't `stripe trigger payment_intent.succeeded` update my order?
**A:** It creates a **NEW fake PaymentIntent** with a random ID, not your real one.

**Example:**
- Your order has: `paymentIntentId: "pi_YOUR_REAL_ID"`
- `stripe trigger` creates: `pi_FAKE_RANDOM_ID`
- Query `{ paymentIntentId: "pi_FAKE_RANDOM_ID" }` → **not found**

**Solution:** Use the correct testing flow (create → confirm).

---

### Q3: Why must express.raw() come before express.json()?
**A:** Stripe computes signatures from the **raw body bytes**. If you parse as JSON first, verification fails.

```javascript
// ✅ CORRECT
app.use("/api/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use("/api/webhook", webhookRoutes);

// ❌ WRONG
app.use(express.json());
app.use("/api/webhook", express.raw({ type: "application/json" }));
```

---

## 🔍 Debugging Quick Checks

### Webhook not triggered?
```bash
# Check stripe listener is running
stripe listen --forward-to http://localhost:5000/api/webhook

# Check server is running
curl http://localhost:5000/api/webhook -X POST
```

### Webhook returns 400?
```bash
# Verify webhook secret in .env
echo $STRIPE_WEBHOOK_SECRET  # Should start with whsec_

# Restart server after changing .env
npm run dev
```

### Order not found?
```bash
# Check if order exists in DB
mongosh "YOUR_MONGODB_URI"
use your_database_name
db.orders.find({ paymentIntentId: "pi_XXX" })

# Should return your order with status "pending"
```

### Order not updating?
```bash
# Check server logs for:
# ✅ Order updated successfully: <order_id>
# or
# ⚠️ No order found with paymentIntentId: <id>

# If "not found", verify PaymentIntent ID matches
```

---

## 📝 Test Cards

```bash
# Success
--payment-method pm_card_visa

# Decline
--payment-method pm_card_chargeDeclined

# Insufficient funds
--payment-method pm_card_chargeDeclinedInsufficientFunds

# Authentication required
--payment-method pm_card_authenticationRequired
```

---

## 🎓 Remember

1. **One flow, one PaymentIntent**: create order → confirm same PI
2. **Webhooks fire once per event**: succeeded PI = no more events
3. **stripe trigger = testing infrastructure**, not real data
4. **Always check logs**: webhook hit → signature ok → order found → updated
5. **Use fresh orders for each test**: don't reuse succeeded PaymentIntents

---

## ✅ What to Check After Fix

1. Restart your server (to load new webhook code)
2. Start stripe listener (copy new webhook secret if needed)
3. Create a NEW order
4. Confirm the PaymentIntent from that order
5. Check logs → should see "✅ Order updated successfully"
6. Query MongoDB → status should be "paid"

---

## 🆘 Still Not Working?

Run this diagnostic:
```bash
# 1. Check webhook endpoint is reachable
curl -X POST http://localhost:5000/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Expected: 400 error (no signature) - means endpoint works

# 2. Check environment variables
node -e "console.log(process.env.STRIPE_WEBHOOK_SECRET)"

# Expected: whsec_... (not undefined)

# 3. Check database connection
node -e "require('./src/config/db'); setTimeout(() => {}, 2000)"

# Expected: "MongoDB connected" or similar
```

Read the full guide in: [STRIPE_WEBHOOK_TESTING_GUIDE.md](STRIPE_WEBHOOK_TESTING_GUIDE.md)
