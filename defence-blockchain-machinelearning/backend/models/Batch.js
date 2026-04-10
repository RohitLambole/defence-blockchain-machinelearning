const mongoose = require("mongoose");

// This schema defines how we store the HIGHLY CLASSIFIED physical specifications 
// of our ammunition components. This data NEVER goes on the public blockchain.
const BatchSchema = new mongoose.Schema({
    // The vital link to the blockchain ERC-721 Token ID
    batchId: {
        type: Number,
        required: true,
        unique: true,
        index: true // Indexed for extremely fast queries by the ML model later
    },

    // --- The Classified Physical Data ---
    supplierName: {
        type: String,
        required: true
    },
    materialType: {
        type: String,
        enum: ['CHEMICAL_POWDER', 'CHEMICAL_EXPLOSIVE', 'METALLURGY_BRASS', 'METALLURGY_STEEL', 'COMPLETED_AMMUNITION'],
        required: true
    },
    weightKg: {
        type: Number,
        required: true
    },
    classifiedSpecs: {
        type: String,
        required: true // e.g., Exact chemical breakdown, burn-rate of powder
    },

    // --- The Cryptographic Anchor ---
    // This is the EXACT hash generated from the classified data above.
    // When the Auditor inspects the physical crate, their offline scanner looks at this data
    // and must regenerate THIS exact hash to prove the crate matches the database perfectly.
    secretHash: {
        type: String,
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Batch", BatchSchema);
