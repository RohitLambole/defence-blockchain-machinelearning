const { ethers } = require("ethers");
require("dotenv").config();
const fs = require("fs");

async function main() {
    console.log("🔓 Granting ROLE_CHEMICAL_SUPPLIER to Server Wallet...");

    const rpcUrl = "http://127.0.0.1:7545";
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Using the same private key as the server/deployer
    const privateKey = "0xe857755c126d53e5b94895f1a806f8c628f388b3e290728913b2e361bc09bca5";
    const wallet = new ethers.Wallet(privateKey, provider);
    const serverAddress = await wallet.getAddress();

    console.log(`Server Address: ${serverAddress}`);

    // Addresses from the Truffle migration
    const rbacAddress = "0x2A76D48ad403B76C9D1Aa9B92b6506603F75163b";

    const rbacArtifact = JSON.parse(fs.readFileSync("./build/contracts/RBAC.json", "utf8"));
    const rbacContract = new ethers.Contract(rbacAddress, rbacArtifact.abi, wallet);

    const ROLE_CHEMICAL_SUPPLIER = ethers.keccak256(ethers.toUtf8Bytes("ROLE_CHEMICAL_SUPPLIER"));

    console.log(`Granting ${ROLE_CHEMICAL_SUPPLIER} to ${serverAddress}...`);

    const tx = await rbacContract.assignRole(serverAddress, ROLE_CHEMICAL_SUPPLIER);
    await tx.wait();

    console.log("✅ Role granted successfully!");
}

main().catch((error) => {
    console.error("❌ Failed to grant role:", error);
});
