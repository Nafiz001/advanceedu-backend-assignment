const express = require("express");
const { createOrder } = require("../controllers/order.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", protect, createOrder);

module.exports = router;
