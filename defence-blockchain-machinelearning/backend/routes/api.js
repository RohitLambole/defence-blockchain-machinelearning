const express = require("express");
const { ethers } = require("ethers");
const Batch = require("../models/Batch");
const { ammunitionContract } = require("../services/blockchain");

const router = express.Router();

// 1. MINT BATCH: Called by the Manufacturer/Supplier's local scanner
router.post("/mint", async (req, res) => {
    try {
        const { batchId, supplierName, materialType, weightKg, classifiedSpecs, supplierRole } = req.body;

        // Step A: We combine the highly classified specs into a single string
        const secretString = `${supplierName}-${materialType}-${weightKg}-${classifiedSpecs}`;
        
        // Step B: Cryptographic Hash Generation
        const secretHash = ethers.keccak256(ethers.toUtf8Bytes(secretString));

        // Step C: Save readable data ONLY to the secure Off-Chain Database
        const newBatch = new Batch({
            batchId,
            supplierName,
            materialType,
            weightKg,
            classifiedSpecs,
            secretHash
        });
        await newBatch.save();

        // Step D: Send the transaction to the Polygon Blockchain!
        // Notice we only send the Hash, NOT the classified data.
        const tx = await ammunitionContract.mintBatch(batchId, secretHash, supplierRole);
        
        // Wait for Polygon to officially confirm the block
        const receipt = await tx.wait();

        res.status(201).json({
            message: "Batch successfully minted and secured!",
            databaseRecord: "Created",
            blockchainTransactionHash: receipt.hash
        });

    } catch (error) {
        console.error("Mint Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 2. INITIATE TRANSFER: Called when the crate is loaded onto the truck
router.post("/transfer", async (req, res) => {
    try {
        const { batchId, nextRole } = req.body;
        
        // Directly ping the blockchain
        const tx = await ammunitionContract.initiateTransfer(batchId, nextRole);
        const receipt = await tx.wait();

        res.status(200).json({
            message: "Transfer initiated successfully. Crate is now In-Transit.",
            blockchainTransactionHash: receipt.hash
        });
    } catch (error) {
        console.error("Transfer Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 3. AUDITOR VERIFICATION: Called by the Border Inspector's offline scanner
router.post("/audit", async (req, res) => {
    try {
        const { batchId, scannedSecretString } = req.body;

        // The auditor scans the physical physical crate features and the software 
        // generates the hash locally.
        const auditorComputedHash = ethers.keccak256(ethers.toUtf8Bytes(scannedSecretString));

        // Submit the hash to the smart contract for the ultimate test!
        const tx = await ammunitionContract.auditorVerifyTransfer(batchId, auditorComputedHash);
        const receipt = await tx.wait();

        res.status(200).json({
            message: "Audit submitted successfully to Polygon. Please check Blockchain logs for success or Flagged Ambiguity.",
            blockchainTransactionHash: receipt.hash
        });
    } catch (error) {
        console.error("Audit Error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
