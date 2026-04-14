const { ethers } = require("ethers");
require("dotenv").config();
const fs = require("fs");

async function main() {
    console.log("🚀 Starting Ethers.js Custom Deployment to Polygon Amoy...");

    // 1. Setup Provider
    const rpcUrl = process.env.POLYGON_URL || "https://polygon-amoy.g.alchemy.com/v2/GO8xDFimiK5AH7PJ1VRKK";
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // 2. Setup Wallet
    let wallet;
    if (process.env.PRIVATE_KEY) {
        wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    } else if (process.env.MNEMONIC) {
        wallet = ethers.Wallet.fromPhrase(process.env.MNEMONIC).connect(provider);
    } else {
        throw new Error("❌ You must provide either PRIVATE_KEY or MNEMONIC in your .env file!");
    }

    console.log(`🔐 Deploying from wallet address: ${await wallet.getAddress()}`);

    // 3. Load Compiled Artifacts (Which Truffle Compile successfully generated)
    const rbacArtifact = JSON.parse(fs.readFileSync("./build/contracts/RBAC.json", "utf8"));
    const ammoArtifact = JSON.parse(fs.readFileSync("./build/contracts/AmmunitionAsset.json", "utf8"));

    // 4. Deploy RBAC Contract
    console.log("⏳ Deploying RBAC...");
    const RBACFactory = new ethers.ContractFactory(rbacArtifact.abi, rbacArtifact.bytecode, wallet);
    const rbacContract = await RBACFactory.deploy();
    await rbacContract.waitForDeployment();
    const rbacAddress = await rbacContract.getAddress();
    console.log(`✅ RBAC deployed to: ${rbacAddress}`);

    // 5. Deploy AmmunitionAsset Contract
    console.log("⏳ Deploying AmmunitionAsset...");
    const AmmoFactory = new ethers.ContractFactory(ammoArtifact.abi, ammoArtifact.bytecode, wallet);
    const ammoContract = await AmmoFactory.deploy(rbacAddress); // Constructor takes RBAC address!
    await ammoContract.waitForDeployment();
    const ammoAddress = await ammoContract.getAddress();
    console.log(`✅ AmmunitionAsset deployed to: ${ammoAddress}`);

    console.log("\n🎉 DEPLOYMENT COMPLETE 🎉");
    console.log("-----------------------------------------");
    console.log("👉 Now complete STEP 4: Copy the AmmunitionAsset address below into your backend/.env file:");
    console.log(`CONTRACT_ADDRESS="${ammoAddress}"`);
    console.log("-----------------------------------------");
}

main().catch((error) => {
    console.error("❌ Deployment failed:", error);
});
