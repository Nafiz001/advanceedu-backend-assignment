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

// 404 Handler - must come after all routes
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  
  const statusCode = err.statusCode || res.statusCode || 500;
  
  res.status(statusCode).json({
    status: "error",
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
});

module.exports = app;
