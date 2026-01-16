const stripe = require("../config/stripe");
const Order = require("../models/Order");

// @desc    Handle Stripe webhook events
// @route   POST /api/webhook
// @access  Public (verified by Stripe signature)
exports.handleStripeWebhook = async (req, res) => {
  console.log("🔥 Stripe webhook endpoint hit");
  
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    console.error("❌ Missing stripe-signature header");
    return res.status(400).send("Webhook Error: Missing signature");
  }

  let event;

  try {
    // Construct event from raw body and signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log("✅ Webhook signature verified successfully");
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`📨 Event type received: ${event.type}`);

  // Handle event types
  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;

      console.log("💳 PaymentIntent succeeded:");
      console.log(`   - PaymentIntent ID: ${paymentIntent.id}`);
      console.log(`   - Amount: ${paymentIntent.amount / 100} ${paymentIntent.currency.toUpperCase()}`);
      console.log(`   - Status: ${paymentIntent.status}`);

      try {
        // Find and update the order
        const updatedOrder = await Order.findOneAndUpdate(
          { paymentIntentId: paymentIntent.id },
          { status: "paid" },
          { new: true }
        );

        if (updatedOrder) {
          console.log(`✅ Order updated successfully:`);
          console.log(`   - Order ID: ${updatedOrder._id}`);
          console.log(`   - User ID: ${updatedOrder.user}`);
          console.log(`   - Product ID: ${updatedOrder.product}`);
          console.log(`   - Amount: ${updatedOrder.amount}`);
          console.log(`   - Status: ${updatedOrder.status}`);
        } else {
          console.warn(`⚠️ No order found with paymentIntentId: ${paymentIntent.id}`);
          console.warn("   Possible reasons:");
          console.warn("   - Order was not created in the database");
          console.warn("   - PaymentIntent ID mismatch");
          console.warn("   - Order was deleted");
        }
      } catch (dbError) {
        console.error("❌ Database error while updating order:", dbError);
        // Still return 200 to Stripe to prevent retries for DB issues
      }

      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;

      console.log("❌ PaymentIntent failed:");
      console.log(`   - PaymentIntent ID: ${paymentIntent.id}`);
      console.log(`   - Status: ${paymentIntent.status}`);

      try {
        const updatedOrder = await Order.findOneAndUpdate(
          { paymentIntentId: paymentIntent.id },
          { status: "failed" },
          { new: true }
        );

        if (updatedOrder) {
          console.log(`✅ Order marked as failed: ${updatedOrder._id}`);
        } else {
          console.warn(`⚠️ No order found with paymentIntentId: ${paymentIntent.id}`);
        }
      } catch (dbError) {
        console.error("❌ Database error while updating order:", dbError);
      }

      break;
    }

    case "payment_intent.created":
      console.log(`ℹ️ PaymentIntent created: ${event.data.object.id}`);
      break;

    case "payment_intent.canceled":
      console.log(`ℹ️ PaymentIntent canceled: ${event.data.object.id}`);
      break;

    default:
      console.log(`ℹ️ Unhandled event type: ${event.type}`);
  }

  // Always return 200 to acknowledge receipt
  res.json({ received: true });
};
