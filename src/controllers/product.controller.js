const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");

// @desc    Create product
// @route   POST /api/products
// @access  Public (can be protected later)
exports.createProduct = asyncHandler(async (req, res) => {
  const { name, description, price } = req.body;

  if (!name || !price) {
    res.status(400);
    throw new Error("Name and price are required");
  }

  const product = await Product.create({
    name,
    description,
    price
  });

  res.status(201).json(product);
});

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
});
