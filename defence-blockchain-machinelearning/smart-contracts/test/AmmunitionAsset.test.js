const RBAC = artifacts.require("RBAC");
const AmmunitionAsset = artifacts.require("AmmunitionAsset");

// Truffle spins up a local blockchain with 10 fake accounts for us to use.
// We map these accounts to specific roles to act out the supply chain.
contract("AmmunitionAsset", (accounts) => {
    let rbac;
    let asset;

    // Renaming the raw addresses to human-readable actors
    const [admin, supplier, manufacturer, auditor] = accounts;

    let ROLE_CHEMICAL_SUPPLIER;
    let ROLE_MANUFACTURER;
    let ROLE_AUDITOR;

    before(async () => {
        // 1. Deploy the contracts to the local test network
        rbac = await RBAC.new({ from: admin });
        asset = await AmmunitionAsset.new(rbac.address, { from: admin });

        // 2. Fetch the cryptographic role IDs from the contract
        ROLE_CHEMICAL_SUPPLIER = await rbac.ROLE_CHEMICAL_SUPPLIER();
        ROLE_MANUFACTURER = await rbac.ROLE_MANUFACTURER();
        ROLE_AUDITOR = await rbac.ROLE_AUDITOR();

        // 3. The Admin hands out the clearance badges to the test accounts
        await rbac.assignRole(supplier, ROLE_CHEMICAL_SUPPLIER, { from: admin });
        await rbac.assignRole(manufacturer, ROLE_MANUFACTURER, { from: admin });
        await rbac.assignRole(auditor, ROLE_AUDITOR, { from: admin });
    });

    it("Test 1: A Chemical Supplier should be able to mine and mint a batch of raw gunpowder", async () => {
        const batchId = 404;
        const secretPhysicalSpecs = "Gunpowder Grade A - Weight 500kg";
        const secretHash = web3.utils.keccak256(secretPhysicalSpecs); // This simulates the offline software generating the hash

        // The supplier calls the mint function!
        await asset.mintBatch(batchId, secretHash, ROLE_CHEMICAL_SUPPLIER, { from: supplier });
        
        // We fetch the data from the blockchain to verify it worked
        const batchData = await asset.batches(batchId);
        
        assert.equal(batchData.batchId.toNumber(), 404, "Batch ID was not recorded correctly.");
        assert.equal(batchData.currentLocation, ROLE_CHEMICAL_SUPPLIER, "Custody did not start at the Supplier.");
        assert.equal(batchData.isAmbiguous, false, "Batch should not start out as ambiguous/frozen.");
    });

    it("Test 2: A malicious actor without clearance should NOT be able to mint", async () => {
        const fakeBatchId = 999;
        const fakeHash = web3.utils.keccak256("Fake Dirt");
        
        // Let's force the Manufacturer to try and pretend they are a Chemical Supplier
        try {
            await asset.mintBatch(fakeBatchId, fakeHash, ROLE_CHEMICAL_SUPPLIER, { from: manufacturer });
            assert.fail("The transaction should have crashed, but it succeeded!");
        } catch (error) {
            assert.include(error.message, "Access Denied", "It crashed, but for the wrong reason.");
        }
    });
    it("Test 3: A batch should successfully transfer when the Auditor's physical hash matches", async () => {
        const batchId = 404; // We use the batch minted in Test 1
        
        // 1. Supplier initiates transfer to Manufacturer
        await asset.initiateTransfer(batchId, ROLE_MANUFACTURER, { from: supplier });
        
        // Verify it is locked in transit
        let batchData = await asset.batches(batchId);
        assert.equal(batchData.pendingLocation, ROLE_MANUFACTURER, "Pending location not set correctly");

        // 2. Auditor arrives, checks the physical specs, and computes the hash offline
        const secretPhysicalSpecs = "Gunpowder Grade A - Weight 500kg";
        const auditorHash = web3.utils.keccak256(secretPhysicalSpecs);
        
        // 3. Auditor submits the hash to the contract
        await asset.auditorVerifyTransfer(batchId, auditorHash, { from: auditor });

        // Verify successful handover
        batchData = await asset.batches(batchId);
        assert.equal(batchData.currentLocation, ROLE_MANUFACTURER, "Custody did not transfer to Manufacturer");
        assert.equal(batchData.pendingLocation, "0x0000000000000000000000000000000000000000000000000000000000000000", "Pending location lock was not cleared");
        assert.equal(batchData.isAmbiguous, false, "Batch should not be flagged");
    });

    it("Test 4: The system should freeze the batch if an Auditor detects tampering", async () => {
        const batchId = 404; // Currently sitting with the Manufacturer after Test 3
        
        // Manufacturer initiates transfer back to the Supplier (just for simulation purposes)
        await asset.initiateTransfer(batchId, ROLE_CHEMICAL_SUPPLIER, { from: manufacturer });
        
        // A bad actor tampered with the crate in transit! (e.g., swapped powder for sand)
        // The Auditor inspects the tampered crate and generates a new hash based on the fake sand.
        const tamperedSpecs = "Gunpowder Grade FAKE - Weight 400kg";
        const badAuditorHash = web3.utils.keccak256(tamperedSpecs);
        
        // Auditor submits the bad hash to the contract
        await asset.auditorVerifyTransfer(batchId, badAuditorHash, { from: auditor });

        // Verify the system successfully caught the fraud and froze the crate
        let batchData = await asset.batches(batchId);
        assert.equal(batchData.isAmbiguous, true, "THE SYSTEM FAILED TO DETECT FRAUD! The batch should be flagged.");
        
        // Prove that the frozen crate cannot be moved anymore
        try {
            await asset.initiateTransfer(batchId, ROLE_MANUFACTURER, { from: manufacturer });
            assert.fail("A frozen batch was allowed to be transferred!");
        } catch (error) {
            assert.include(error.message, "Transfer Frozen", "Transaction failed for the wrong reason.");
        }
    });
});
