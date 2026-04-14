require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

// Load env variables
const { MNEMONIC, PROJECT_ID } = process.env;

module.exports = {
  networks: {
    // Local Ganache Desktop Application
    development: {
      host: "127.0.0.1",
      port: 7545, // Ganache Desktop defaults to 7545
      network_id: "*"
    },

    // Truffle Dashboard (recommended)
    dashboard: {
      host: "localhost",
      port: 24012,
      network_id: "*"
    },

    // Polygon Amoy Testnet (For testing with Fake MATIC)
    polygon_amoy: {
      provider: () =>
        new HDWalletProvider(
          MNEMONIC,
          `https://polygon-amoy.infura.io/v3/${PROJECT_ID}` // Or Alchemy/QuickNode URL
        ),
      network_id: 80002,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },

    // Polygon Mainnet (For production with Real MATIC)
    polygon_mainnet: {
      provider: () =>
        new HDWalletProvider(
          MNEMONIC,
          `https://polygon-mainnet.infura.io/v3/${PROJECT_ID}`
        ),
      network_id: 137,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    }
  },

  mocha: {},

  compilers: {
    solc: {
      version: "0.8.24",
      settings: {
        evmVersion: "paris"
      }
    }
  }
};
