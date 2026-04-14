require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Initialize our highly secure off-chain server
const app = express();
app.use(cors());
app.use(express.json()); // Allows us to read JSON payloads from physical scanners

// --- 1. DATABASE CONNECTION ---
// We connect exactly to your local MongoDB deployment as requested
mongoose.connect("mongodb://127.0.0.1:27017/defenceDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ Off-Chain Database Connected Securely to defenceDB"))
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
