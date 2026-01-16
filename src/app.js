const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const productRoutes = require("./routes/product.routes");
const orderRoutes = require("./routes/order.routes");
const webhookRoutes = require("./routes/webhook.routes");

const app = express();

app.use(cors());

// Health check endpoint for Render
app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "AdvanceEdu Backend API is running",
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      products: "/api/products",
      orders: "/api/orders",
      webhook: "/api/webhook"
    }
  });
});

// ❌ DO NOT apply express.json() globally before webhook
app.use("/api/webhook", express.raw({ type: "application/json" }));

// ✅ JSON parser for all other routes
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/webhook", webhookRoutes);

module.exports = app;
