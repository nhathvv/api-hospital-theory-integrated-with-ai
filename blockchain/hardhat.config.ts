import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY || '';
const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || '';
const MUMBAI_RPC_URL = process.env.POLYGON_TESTNET_RPC_URL || '';
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || '';

const isValidPrivateKey = (key: string): boolean => {
  if (!key) return false;
  const cleanKey = key.startsWith('0x') ? key.slice(2) : key;
  return cleanKey.length === 64 && /^[0-9a-fA-F]+$/.test(cleanKey);
};

const getAccounts = (): string[] => {
  if (isValidPrivateKey(PRIVATE_KEY)) {
    return [PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : `0x${PRIVATE_KEY}`];
  }
  return [];
};

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
    localhost: {
      url: 'http://127.0.0.1:8545',
    },
    amoy: {
      url: MUMBAI_RPC_URL || 'https://rpc-amoy.polygon.technology',
      accounts: getAccounts(),
      chainId: 80002,
    },
    polygon: {
      url: POLYGON_RPC_URL || 'https://polygon-rpc.com',
      accounts: getAccounts(),
      chainId: 137,
    },
  },
  etherscan: {
    apiKey: {
      polygon: POLYGONSCAN_API_KEY,
      polygonAmoy: POLYGONSCAN_API_KEY,
    },
  },
  gasReporter: {
    enabled: true,
    currency: 'USD',
  },
};

export default config;
