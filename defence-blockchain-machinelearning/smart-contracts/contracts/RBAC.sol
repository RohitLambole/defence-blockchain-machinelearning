// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/*
 * RBAC Contract for Defense Ammunition System
 * Handles:
 * - Role creation
 * - Role assignment
 * - Role revocation
 * - Enforces hierarchy
 */

contract RBAC {
    // Define all roles
    // --- Manufacturing Supply Chain ---
    bytes32 public constant ROLE_CHEMICAL_SUPPLIER = keccak256("ROLE_CHEMICAL_SUPPLIER");     // Raw Gunpowder/Explosives
    bytes32 public constant ROLE_METALLURGY_SUPPLIER = keccak256("ROLE_METALLURGY_SUPPLIER"); // Raw Brass/Lead/Steel
    bytes32 public constant ROLE_MANUFACTURER = keccak256("ROLE_MANUFACTURER");               // Component Creation (Casings/Primers)
    bytes32 public constant ROLE_ASSEMBLER = keccak256("ROLE_ASSEMBLER");                     // Final Cartridge Assembly
    bytes32 public constant ROLE_QUALITY_CONTROL = keccak256("ROLE_QUALITY_CONTROL");         // Factory Integrity Inspector
    
    // --- Military Deployment Chain ---
    bytes32 public constant ROLE_COMPANY = keccak256("ROLE_COMPANY");
    bytes32 public constant ROLE_REGIMENT = keccak256("ROLE_REGIMENT");
    bytes32 public constant ROLE_DIVISION = keccak256("ROLE_DIVISION");
    bytes32 public constant ROLE_CORPS = keccak256("ROLE_CORPS");
    bytes32 public constant ROLE_COMMAND = keccak256("ROLE_COMMAND");
    bytes32 public constant ROLE_INVENTORY = keccak256("ROLE_INVENTORY");
    bytes32 public constant ROLE_AUDITOR = keccak256("ROLE_AUDITOR");
    // role => address => bool
    mapping(bytes32 => mapping(address => bool)) public roles;

    // Events
    event RoleAssigned(address indexed account, bytes32 role);
    event RoleRevoked(address indexed account, bytes32 role);

    address public systemAdmin; // Command Head or root authority

    constructor() {
        systemAdmin = msg.sender;
        roles[ROLE_COMMAND][msg.sender] = true; // Root privilege
    }

    // Modifier to restrict functions to admin
    modifier onlyAdmin() {
        require(roles[ROLE_COMMAND][msg.sender], "Not authorized");
        _;
    }

    // Assign role
    function assignRole(address account, bytes32 role) public onlyAdmin {
        roles[role][account] = true;
        emit RoleAssigned(account, role);
    }

    // Revoke role
    function revokeRole(address account, bytes32 role) public onlyAdmin {
        roles[role][account] = false;
        emit RoleRevoked(account, role);
    }

    // Check if address has role
    function hasRole(bytes32 role, address account) public view returns(bool) {
        return roles[role][account];
    }
}
