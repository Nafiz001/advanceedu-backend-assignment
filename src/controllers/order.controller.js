const asyncHandler = require("express-async-handler");
const stripe = require("../config/stripe");
const Order = require("../models/Order");
const Product = require("../models/Product");

// @desc    Create order and initiate payment
// @route   POST /api/orders
// @access  Private
exports.createOrder = asyncHandler(async (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    res.status(400);
    throw new Error("Product ID is required");
  }

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Create Stripe PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: product.price * 100, // cents
    currency: "usd",
    metadata: {
      productId: product._id.toString(),
      userId: req.user._id.toString()
    }
  });

  // Save order in DB
  const order = await Order.create({
    user: req.user._id,
    product: product._id,
    amount: product.price,
    paymentIntentId: paymentIntent.id,
    status: "pending"
  });

  res.status(201).json({
    orderId: order._id,
    clientSecret: paymentIntent.client_secret
  });
});
