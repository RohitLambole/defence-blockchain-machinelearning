const { ethers } = require("ethers");
const fs = require("fs");

async function verify() {
    // 1. Connect to local Ganache
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
    
    // 2. The address we deployed earlier
    const contractAddress = "0xbf3eB5e13b9B793Bc89FF0F7CB623A7e86F2B87C";
    
    // 3. Load the ABI
    const artifact = JSON.parse(fs.readFileSync("./build/contracts/AmmunitionAsset.json", "utf8"));
    const contract = new ethers.Contract(contractAddress, artifact.abi, provider);

    console.log("🔍 Querying Blockchain for Batch 777...");
    
    try {
        // Check if code exists at address
        const code = await provider.getCode(contractAddress);
        if (code === "0x") {
            console.error(`❌ ERROR: No contract found at address ${contractAddress}. Did you restart Ganache recently?`);
            return;
        }

        const data = await contract.getBatch(777);
        console.log("\n✅ BLOCKCHAIN DATA FOUND:");
        console.log("-----------------------------------------");
        console.log(`🆔 Batch ID: ${777}`);
        console.log(`🔒 Secure Hash: ${data.secretHash}`);
        console.log(`📍 Current Location: ${data.currentLocation}`);
        console.log(`⏳ Status: ${data.isPending ? "IN-TRANSIT (Awaiting Audit)" : "AT REST (Factory/Storage)"}`);
        console.log(`⚠️  Ambiguity Status: ${data.isAmbiguous ? "❌ FRAUD DETECTED" : "✅ VALID"}`);
        console.log("-----------------------------------------");
    } catch (e) {
        console.error("❌ ERROR during query:", e.message);
        console.log("\n💡 Troubleshooting Tip: If you restarted Ganache Desktop, your old contract was deleted. You must run 'npx truffle migrate --network development' and 'node grantRoles.js' again to get a fresh contract address.");
    }
}

verify();
