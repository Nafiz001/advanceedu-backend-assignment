# Stripe Webhook Testing Guide

## 🔍 Problem Diagnosis

### What Was Wrong

1. **Duplicate Function Declaration**: Your webhook controller had two `exports.handleStripeWebhook` declarations, causing the first one (with logging) to be overridden by the second.

2. **Insufficient Logging**: The webhook handler didn't log enough information to diagnose whether:
   - The webhook was being triggered
   - The order was found in the database
   - The update operation succeeded

### Middleware Order ✅

Your middleware order is **CORRECT**:

```javascript
// ✅ CORRECT ORDER in app.js
app.use("/api/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use("/api/webhook", webhookRoutes);
```

**Why this matters:**
- Stripe signatures are computed from the **raw request body**
- If you parse the body as JSON first, the signature verification will fail
- The raw middleware MUST come before `express.json()`

---

## 🚫 Why Webhooks Don't Fire Again

### Critical Understanding: PaymentIntents Are Idempotent

**Once a PaymentIntent reaches "succeeded" status, it NEVER fires another webhook.**

**Why?**
1. A PaymentIntent goes through state transitions: `requires_payment_method` → `requires_confirmation` → `processing` → `succeeded`
2. Each transition fires a webhook event
3. Once in `succeeded` state, **it's terminal** - no further events will fire
4. Stripe's event system is **event-driven**, not **poll-driven**

**This means:**
- ❌ Confirming an already-succeeded PaymentIntent = NO new webhook
- ❌ Using `stripe trigger payment_intent.succeeded` = Creates NEW fake PaymentIntent (doesn't update existing)
- ✅ You must test with the SAME PaymentIntent in ONE flow: create → confirm

---

## 🎯 Why `stripe trigger` Doesn't Update Existing Orders

### The `stripe trigger` Command

```bash
stripe trigger payment_intent.succeeded
```

**What it does:**
- Creates a **NEW, fake PaymentIntent** with a random ID like `pi_1234567890abcdef`
- Sends a webhook event for this fake PaymentIntent
- **DOES NOT** interact with any real PaymentIntent in your system

**Why your order isn't updated:**
- Your order has `paymentIntentId: "pi_YOUR_REAL_ID"`
- The triggered event has `paymentIntentId: "pi_FAKE_RANDOM_ID"`
- Your database query: `{ paymentIntentId: "pi_FAKE_RANDOM_ID" }` finds **nothing**

**When to use `stripe trigger`:**
- ✅ Testing that your webhook endpoint is reachable
- ✅ Testing that signature verification works
- ✅ Testing event parsing logic
- ❌ Testing real order updates (use the correct flow below)

---

## ✅ Correct Testing Flow

### Step 1: Start Stripe Webhook Listener

In Terminal 1:
```bash
stripe listen --forward-to http://localhost:5000/api/webhook
```

**Copy the webhook signing secret** (starts with `whsec_`):
```
> Ready! Your webhook signing secret is whsec_1234567890abcdef...
```

Add it to your `.env`:
```env
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

---

### Step 2: Start Your Server

In Terminal 2:
```bash
npm run dev
```

---

### Step 3: Create an Order (Creates PaymentIntent)

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "productId": "YOUR_PRODUCT_ID"
  }'
```

**Response:**
```json
{
  "orderId": "67890abcdef12345",
  "clientSecret": "pi_3Sq8LlEHD097Q7Ty0ezuSgfd_secret_XXXX"
}
```

**Extract the PaymentIntent ID** from the client secret:
- Client secret format: `pi_XXXXX_secret_YYYY`
- PaymentIntent ID: `pi_3Sq8LlEHD097Q7Ty0ezuSgfd` (everything before `_secret_`)

---

### Step 4: Confirm the PaymentIntent

In Terminal 3 (PowerShell):
```bash
stripe payment_intents confirm pi_3Sq8LlEHD097Q7Ty0ezuSgfd --payment-method pm_card_visa
```

**Expected output:**
```
PaymentIntent ID: pi_3Sq8LlEHD097Q7Ty0ezuSgfd
Status: succeeded
Amount: 4900 usd
```

---

### Step 5: Verify Webhook Logs

**In Terminal 1 (Stripe listener):**
```
[200] POST http://localhost:5000/api/webhook [evt_1234567890]
```

**In Terminal 2 (Your server):**
```
🔥 Stripe webhook endpoint hit
✅ Webhook signature verified successfully
📨 Event type received: payment_intent.succeeded
💳 PaymentIntent succeeded:
   - PaymentIntent ID: pi_3Sq8LlEHD097Q7Ty0ezuSgfd
   - Amount: 49 USD
   - Status: succeeded
✅ Order updated successfully:
   - Order ID: 67890abcdef12345
   - User ID: 123456789
   - Product ID: 987654321
   - Amount: 49
   - Status: paid
```

**If you see:**
```
⚠️ No order found with paymentIntentId: pi_3Sq8LlEHD097Q7Ty0ezuSgfd
```

**Possible reasons:**
1. PaymentIntent ID mismatch (check your database)
2. Order wasn't created successfully
3. Wrong database/collection being queried
4. PaymentIntent ID stored incorrectly

---

### Step 6: Verify in MongoDB

```bash
# Connect to MongoDB
mongosh "YOUR_MONGODB_URI"

# Switch to your database
use your_database_name

# Find the order
db.orders.findOne({ paymentIntentId: "pi_3Sq8LlEHD097Q7Ty0ezuSgfd" })
```

**Expected result:**
```javascript
{
  _id: ObjectId("..."),
  user: ObjectId("..."),
  product: ObjectId("..."),
  amount: 49,
  paymentIntentId: "pi_3Sq8LlEHD097Q7Ty0ezuSgfd",
  status: "paid",  // ← Should be "paid"
  createdAt: ISODate("2026-01-16T..."),
  updatedAt: ISODate("2026-01-16T...")
}
```

---

## 🧪 Complete Test Script

Save this as `test-stripe-flow.sh`:

```bash
#!/bin/bash

echo "🚀 Starting Stripe Payment Flow Test..."
echo ""

# 1. Login and get token
echo "📝 Step 1: Login to get JWT token"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
echo "✅ Token obtained: ${TOKEN:0:20}..."
echo ""

# 2. Get a product
echo "📦 Step 2: Get product ID"
PRODUCT_RESPONSE=$(curl -s http://localhost:5000/api/products)
PRODUCT_ID=$(echo $PRODUCT_RESPONSE | jq -r '.[0]._id')
echo "✅ Product ID: $PRODUCT_ID"
echo ""

# 3. Create order
echo "💰 Step 3: Create order and PaymentIntent"
ORDER_RESPONSE=$(curl -s -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"productId\": \"$PRODUCT_ID\"
  }")

ORDER_ID=$(echo $ORDER_RESPONSE | jq -r '.orderId')
CLIENT_SECRET=$(echo $ORDER_RESPONSE | jq -r '.clientSecret')
PAYMENT_INTENT_ID=$(echo $CLIENT_SECRET | cut -d'_' -f1-3)

echo "✅ Order created:"
echo "   Order ID: $ORDER_ID"
echo "   PaymentIntent ID: $PAYMENT_INTENT_ID"
echo "   Client Secret: ${CLIENT_SECRET:0:30}..."
echo ""

# 4. Wait a moment
echo "⏳ Waiting 2 seconds..."
sleep 2
echo ""

# 5. Confirm payment
echo "💳 Step 4: Confirming PaymentIntent with test card..."
stripe payment_intents confirm $PAYMENT_INTENT_ID --payment-method pm_card_visa
echo ""

# 6. Wait for webhook
echo "⏳ Waiting 3 seconds for webhook processing..."
sleep 3
echo ""

# 7. Verify order status
echo "🔍 Step 5: Verifying order status in database..."
UPDATED_ORDER=$(curl -s http://localhost:5000/api/orders/$ORDER_ID \
  -H "Authorization: Bearer $TOKEN")

STATUS=$(echo $UPDATED_ORDER | jq -r '.status')
echo "📊 Order Status: $STATUS"

if [ "$STATUS" == "paid" ]; then
    echo "✅ SUCCESS! Order status updated to 'paid'"
else
    echo "❌ FAILED! Order status is still '$STATUS'"
    echo "   Check webhook logs for errors"
fi
```

Make it executable:
```bash
chmod +x test-stripe-flow.sh
```

Run it:
```bash
./test-stripe-flow.sh
```

---

## 🐛 Debugging Checklist

### If webhook is not triggered:

- [ ] Is `stripe listen` running?
- [ ] Did you copy the correct `whsec_` secret to `.env`?
- [ ] Is your server running on the correct port (5000)?
- [ ] Does the webhook URL match: `http://localhost:5000/api/webhook`?

### If webhook returns 400:

- [ ] Check: "Webhook signature verification failed"
  - Verify `STRIPE_WEBHOOK_SECRET` in `.env`
  - Ensure `express.raw()` is applied BEFORE the route
  - Restart your server after updating `.env`

### If order is not found:

- [ ] Verify the order was created: Check MongoDB
- [ ] Verify `paymentIntentId` was stored correctly
- [ ] Ensure you're using the SAME PaymentIntent ID (not from `stripe trigger`)
- [ ] Check database connection (correct DB name in URI)

### If order found but not updating:

- [ ] Check for database errors in logs
- [ ] Verify Mongoose connection is active
- [ ] Check user permissions on the database

---

## 🏭 Production Configuration

### Environment Variables

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Use LIVE webhook secret from Stripe Dashboard
# Dashboard → Developers → Webhooks → Add endpoint
# URL: https://yourdomain.com/api/webhook
# Events: payment_intent.succeeded, payment_intent.payment_failed
```

### Security Best Practices

1. **Always verify webhook signatures** ✅ (You're doing this)
2. **Use raw body parser only for webhook route** ✅ (You're doing this)
3. **Return 200 even for errors** to prevent Stripe retries
4. **Log all webhook events** for audit trail
5. **Handle idempotency** - Stripe may send duplicate events
6. **Use database transactions** for critical updates

### Production-Safe Webhook Handler

Your fixed webhook handler is already production-safe:

- ✅ Signature verification
- ✅ Comprehensive error handling
- ✅ Detailed logging
- ✅ Always returns 200
- ✅ Try-catch for database operations
- ✅ Informative error messages

---

## 📊 Testing Checklist

- [ ] Create order → verify order in DB with status "pending"
- [ ] Confirm PaymentIntent → webhook triggered
- [ ] Check logs → see "✅ Order updated successfully"
- [ ] Verify in DB → order status is "paid"
- [ ] Test failed payment → use `pm_card_chargeDeclined`
- [ ] Test canceled PaymentIntent
- [ ] Test duplicate webhook (idempotency)

---

## 🎓 Key Takeaways

1. **Webhooks are event-driven**: They fire once per event, not on-demand
2. **PaymentIntents are stateful**: Once succeeded, no more events
3. **Test with real flow**: create order → confirm same PaymentIntent
4. **`stripe trigger` is for testing infrastructure**, not real data
5. **Always log everything** when debugging webhooks
6. **Middleware order matters** for raw body parsing

---

## Need More Help?

Check these logs in order:
1. Stripe listener terminal: Is the webhook received?
2. Your server terminal: Is signature verified? Is order found?
3. MongoDB: Does the order exist with correct PaymentIntent ID?

**Common mistake**: Using an old PaymentIntent ID that already succeeded. Always create a fresh order for each test.
