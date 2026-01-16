const dotenv = require("dotenv");
dotenv.config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Connect to database
connectDB();

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📊 Environment: ${NODE_ENV}`);
  console.log(`🗄️  Database: ${process.env.MONGO_URI ? "Configured" : "⚠️  Missing MONGO_URI"}`);
  console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? "Configured" : "⚠️  Missing JWT_SECRET"}`);
  console.log(`💳 Stripe Key: ${process.env.STRIPE_SECRET_KEY ? "Configured" : "⚠️  Missing STRIPE_SECRET_KEY"}`);
  console.log(`🔔 Webhook Secret: ${process.env.STRIPE_WEBHOOK_SECRET ? "Configured" : "⚠️  Missing STRIPE_WEBHOOK_SECRET"}`);
  console.log(`\n🚀 Server ready to accept requests`);
});
