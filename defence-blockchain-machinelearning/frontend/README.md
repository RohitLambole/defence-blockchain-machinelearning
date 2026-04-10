# Defence Supply Chain — React UI

## Quick Start (Fresh System)

### 1. Prerequisites
- Node.js v18+ (https://nodejs.org)
- MetaMask browser extension
- Backend running at localhost:5000
- Ganache running at localhost:8545

### 2. Configure contract addresses
Open `src/config.js` and paste your deployed addresses:
```js
RBAC_ADDRESS: '0xYOUR_RBAC_ADDRESS',
AMMO_ADDRESS: '0xYOUR_AMMO_ADDRESS',
```
Find these by running: `truffle migrate --network development`

### 3. Install & Run
```bash
cd defence-ui
npm install
npm run dev
```
Open http://localhost:3000

### 4. Connect MetaMask to Ganache
- Open MetaMask → Add Network → Custom RPC
- RPC URL: http://127.0.0.1:8545
- Chain ID: 1337
- Import a Ganache private key via MetaMask → Import Account

## Role Routing
| Role | Dashboard |
|------|-----------|
| CHEMICAL_SUPPLIER | /dashboard/supplier |
| METALLURGY_SUPPLIER | /dashboard/supplier |
| MANUFACTURER | /dashboard/manufacturer |
| ASSEMBLER | /dashboard/assembler |
| QUALITY_CONTROL | /dashboard/auditor |
| AUDITOR | /dashboard/auditor |
| INVENTORY | /dashboard/manufacturer |
| COMMAND | /dashboard/command |
