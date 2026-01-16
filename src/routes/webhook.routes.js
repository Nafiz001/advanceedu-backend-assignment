const express = require("express");
const { handleStripeWebhook } = require("../controllers/webhook.controller");

const router = express.Router();

router.post("/", handleStripeWebhook);

module.exports = router;
