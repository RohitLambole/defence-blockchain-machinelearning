// backend/services/eventListener.js
const { ammunitionContract } = require("./blockchain");
const Batch = require("../models/Batch"); // We will update the batch or another ML logging collection

const startListening = () => {
    console.log("📡 Starting Blockchain Event Listener for ML Pipeline...");

    // 1. Listen for Transfer Initiated (Starts the Latency Stopwatch)
    ammunitionContract.on("TransferInitiated", async (batchId, fromRole, toRole, timestamp, event) => {
        console.log(`[ML LOG] Transfer Initiated: Batch ${batchId} from ${fromRole} to ${toRole}`);
        // In a full production setup, we would save this to an ML_Latency_Log collection
        // Here we just log it to the console for demonstration.
    });

    // 2. Listen for Transfer Verified (Stops the Latency Stopwatch)
    ammunitionContract.on("TransferVerified", async (batchId, newLocation, auditor, timestamp, event) => {
        console.log(`[ML LOG] Transfer Successful: Batch ${batchId} securely arrived at ${newLocation}`);
        // The ML model compares this timestamp to the TransferInitiated timestamp 
        // to detect Latency Anomalies (e.g., Did the truck take 3 days for a 5 hour drive?)
    });

    // 3. Listen for Ambiguity/Fraud Flags (High Priority Alerts)
    ammunitionContract.on("AmbiguityFlagged", async (batchId, auditor, timestamp, event) => {
        console.error(`🚨 [ML ALERT] FRAUD DETECTED on Batch ${batchId} by Auditor ${auditor}`);
        
        // This is where Augmented Intelligence shines:
        // We find the Batch in the off-chain secure database to see exactly WHICH supplier made it.
        try {
            const batchRecord = await Batch.findOne({ batchId: Number(batchId) });
            if (batchRecord) {
                console.error(`🚨 Warning! This tampered batch originated from SUPPLIER: ${batchRecord.supplierName}`);
                // The ML model can now detect pattern recognition: "Supplier X has 5 flagged batches this month."
            }
        } catch(error) {
            console.error("Error fetching db record for fraud flag", error);
        }
    });
};

module.exports = { startListening };
