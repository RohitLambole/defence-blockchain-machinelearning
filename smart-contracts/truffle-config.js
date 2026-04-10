require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

// Load env variables
const { MNEMONIC, PROJECT_ID } = process.env;

module.exports = {
  networks: {
    // Local Ganache
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"
    },

    // Truffle Dashboard (recommended)
    dashboard: {
      host: "localhost",
      port: 24012,
      network_id: "*"
    },

    // Sepolia Testnet via Infura
    sepolia: {
      provider: () =>
        new HDWalletProvider(
          MNEMONIC,
          `https://sepolia.infura.io/v3/${PROJECT_ID}`
        ),
      network_id: 11155111,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    }
  },

  mocha: {},

  compilers: {
    solc: {
      version: "0.8.21"
    }
  }
};
