// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// We import the standard ERC721 token blueprint. This ensures our contract follows 
// the universal rules for Non-Fungible Tokens, making it secure and compatible.
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

// We import the RBAC contract you already wrote. We need this to verify 
// if the person trying to interact with an asset actually has the required clearance.
import "./RBAC.sol";

contract AmmunitionAsset is ERC721 {

    // We store a reference to your RBAC contract.
    // This allows us to call `rbac.hasRole(...)` inside our asset functions.
    RBAC public rbac;

    // This is the core structure holding all classified data for a single physical batch.
    struct BatchData {
        uint256 batchId;          // A unique identifier for this specific crate of ammo.
        uint256 manufactureDate;  // The Unix timestamp of when the batch was completed.
        bytes32 secretHash;       // The cryptographic key generated off-chain by the manufacturer.
        bytes32 currentLocation;  // The current RBAC role that holds custody (e.g., ROLE_INVENTORY).
        bytes32 pendingLocation;  // The destination role this crate is currently traveling to.
        bool isAmbiguous;         // A red-flag toggle. If true, the batch is frozen pending investigation.
    }

    // A mapping (dictionary/lookup-table) that connects a unique Token ID directly to its Batch Data.
    mapping(uint256 => BatchData) public batches;

    // A nested mapping specifically for tracking the exact timeline.
    // It maps a Token ID -> to an RBAC Role -> to the exact timestamp it entered that node.
    mapping(uint256 => mapping(bytes32 => uint256)) public nodeTimestamps;

    event TransferInitiated(uint256 indexed batchId, bytes32 fromRole, bytes32 toRole, uint256 timestamp);
    event TransferVerified(uint256 indexed batchId, bytes32 newLocation, address auditor, uint256 timestamp);
    event AmbiguityFlagged(uint256 indexed batchId, address auditor, uint256 timestamp);
    event AmbiguityResolved(uint256 indexed batchId, bool destroyed, bytes32 newLocation, uint256 timestamp);

    // An event is like a public announcement on the blockchain. 
    // It's incredibly cheap to log, and your off-chain ML models will listen to these!
    event BatchMinted(uint256 indexed batchId, address indexed minter, bytes32 secretHash, uint256 timestamp);
    // The Constructor runs exactly ONCE when this contract is first deployed.
    // We pass it the address of our already-deployed RBAC contract so they can talk.
    constructor(address _rbacAddress) ERC721("DefenseAmmunition", "AMMO") {
        rbac = RBAC(_rbacAddress);
    }
    // This modifier acts like a security checkpoint. 
    // Before any code inside a function runs, this checks if the person has the right clearance.
    modifier onlyRole(bytes32 role) {
        require(rbac.hasRole(role, msg.sender), "Access Denied: You do not have the required RBAC clearance.");
        _;
    }

    // The Mint Function: Creating the Raw Material Batch
    // We pass in the specific _supplierRole (Chemical or Metallurgy) so we know EXACTLY what raw material this is.
    function mintBatch(uint256 _batchId, bytes32 _secretHash, bytes32 _supplierRole) public {
        
        // Ensure they passed in a valid starting role
        require(_supplierRole == rbac.ROLE_CHEMICAL_SUPPLIER() || _supplierRole == rbac.ROLE_METALLURGY_SUPPLIER(), "Origin Error: Must originate from a raw supplier");
        
        // Security Check: Does this person actually hold that role?
        require(rbac.hasRole(_supplierRole, msg.sender), "Access Denied: You do not have the declared supplier clearance.");

        // 1. Security Check: Make sure this Batch ID hasn't been used before.
        require(batches[_batchId].manufactureDate == 0, "Security Alert: This Batch ID already exists!");
        
        // 2. We use OpenZeppelin's standard _mint to actually create the ERC721 Token.
        _mint(msg.sender, _batchId);
        
        // 3. We record the classified physical data into our Ledger (the Struct).
        batches[_batchId] = BatchData({
            batchId: _batchId,
            manufactureDate: block.timestamp, // The blockchain automatically grabs the exact current Unix time.
            secretHash: _secretHash,          
            currentLocation: _supplierRole,   // Custody starts precisely at the specific raw material Supplier.
            pendingLocation: bytes32(0),      // Not moving anywhere yet.
            isAmbiguous: false // It starts clean.
        });
        
        // 4. We log the exact arrival time into our ML logistics tracker.
        nodeTimestamps[_batchId][_supplierRole] = block.timestamp;
        
        // 5. We trigger the public announcement for off-chain servers to hear.
        emit BatchMinted(_batchId, msg.sender, _secretHash, block.timestamp);
    }

    // Step 1 of Transfer: The current holder dispatches the shipment.
    function initiateTransfer(uint256 _batchId, bytes32 _nextRole) public {
        BatchData storage batch = batches[_batchId];

        // Ensure you actually hold it and it's not frozen
        require(rbac.hasRole(batch.currentLocation, msg.sender), "Access Denied: You do not have custody of this batch.");
        require(batch.isAmbiguous == false, "Transfer Frozen: This batch is under investigation.");
        require(batch.pendingLocation == bytes32(0), "Transfer Error: A transfer is already in progress.");

        // We lock in the destination
        batch.pendingLocation = _nextRole;

        emit TransferInitiated(_batchId, batch.currentLocation, _nextRole, block.timestamp);
    }

    // Step 2 of Transfer: The border checkpoint. The Auditor checks if the physical specs match the digital record.
    function auditorVerifyTransfer(uint256 _batchId, bytes32 _auditorComputedHash) public onlyRole(rbac.ROLE_AUDITOR()) {
        BatchData storage batch = batches[_batchId];
        
        // Ensure there's actually a transfer waiting to be verified
        require(batch.pendingLocation != bytes32(0), "Verification Error: No transfer in progress.");
        require(batch.isAmbiguous == false, "Transfer Frozen: Already flagged for ambiguity.");

        // The Ultimate Security Check: Does the hash generated at the border match the original Manufacturer's hash?
        if (batch.secretHash == _auditorComputedHash) {
            // SUCCESS! The physical crate is untouched.
            batch.currentLocation = batch.pendingLocation; // Move it to the new Owner.
            batch.pendingLocation = bytes32(0);            // Clear the lock.
            
            // Log the new timestamp for ML Latency tracking.
            nodeTimestamps[_batchId][batch.currentLocation] = block.timestamp;
            
            emit TransferVerified(_batchId, batch.currentLocation, msg.sender, block.timestamp);
        } else {
            // ALERT! The hashes don't match. The physical crate was tampered with!
            batch.isAmbiguous = true;
            emit AmbiguityFlagged(_batchId, msg.sender, block.timestamp);
        }
    }

    // Step 3 (Emergency): Dispute Resolution for Fraud/Tampering
    function resolveAmbiguity(uint256 _batchId, bool _destroyBatch, bytes32 _overrideLocation) public onlyRole(rbac.ROLE_COMMAND()) {
        BatchData storage batch = batches[_batchId];
        
        // Ensure the batch is currently frozen under investigation
        require(batch.isAmbiguous == true, "Resolution Error: This batch is not currently flagged.");

        if (_destroyBatch) {
            // The tampering was confirmed. The batch is destroyed/burned.
            _burn(_batchId); // OpenZeppelin's built-in function permanently destroys the token.
            delete batches[_batchId]; // Wipe the struct data to secure the ledger.
            
            emit AmbiguityResolved(_batchId, true, bytes32(0), block.timestamp);
        } else {
            // False alarm or clerical error. The Commander unfreezes it to a specific location.
            require(_overrideLocation != bytes32(0), "Resolution Error: Must provide a valid location to send the unfrozen batch.");
            
            batch.isAmbiguous = false;
            batch.currentLocation = _overrideLocation;
            batch.pendingLocation = bytes32(0); // Clear any old pending locks
            
            nodeTimestamps[_batchId][_overrideLocation] = block.timestamp;
            
            emit AmbiguityResolved(_batchId, false, _overrideLocation, block.timestamp);
        }
    }
}
