require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Initialize our highly secure off-chain server
const app = express();
app.use(cors());
app.use(express.json()); // Allows us to read JSON payloads from physical scanners

// --- 1. DATABASE CONNECTION ---
// We will connect to MongoDB. This database will hold the readable, classified
// physical specifications (chemical formulas, exact weights).
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/defense_supply";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ Off-Chain Database Connected Securely"))
  .catch((err) => console.error("❌ Database Connection Error:", err));


// --- 2. THE API ENDPOINTS ---
const apiRoutes = require("./routes/api");
app.use("/api/chain", apiRoutes);

app.get("/api/health", (req, res) => {
    res.json({ status: "ONLINE", system: "Defense Supply Chain Secure Backend" });
});


// --- 3. START ML EVENT LISTENER ---
const { startListening } = require("./services/eventListener");
startListening();

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Defense Server running on port ${PORT}`);
});
