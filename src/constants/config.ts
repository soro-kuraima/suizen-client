import { NetworkConfig } from '../types/wallet';

// Network configurations
export const NETWORKS: Record<string, NetworkConfig> = {
  mainnet: {
    name: 'Sui Mainnet',
    rpcUrl: 'https://fullnode.mainnet.sui.io:443',
    packageAddress: '0x...', // Replace with your deployed package address
    explorerUrl: 'https://explorer.sui.io',
  },
  testnet: {
    name: 'Sui Testnet',
    rpcUrl: 'https://fullnode.testnet.sui.io:443',
    packageAddress: '0x...', // Replace with your deployed package address
    explorerUrl: 'https://explorer.sui.io/?network=testnet',
  },
  devnet: {
    name: 'Sui Devnet',
    rpcUrl: 'https://fullnode.devnet.sui.io:443',
    packageAddress: '0xa67113039262a42b86071d4b5cac0c92c92e7e0dcd24051a2ab239387ab9dc33', // Replace with your deployed package address
    explorerUrl: 'https://explorer.sui.io/?network=devnet',
  },
  localnet: {
    name: 'Local Network',
    rpcUrl: 'http://127.0.0.1:9000',
    packageAddress: '0x...', // Replace with your local package address
    explorerUrl: 'http://localhost:3000',
  },
};

// Default network
export const DEFAULT_NETWORK = 'devnet';

// Contract function names
export const CONTRACT_FUNCTIONS = {
  // Multi-owner wallet functions
  CREATE_WALLET: 'create_wallet',
  DEPOSIT: 'deposit',
  WITHDRAW: 'withdraw',
  CREATE_PROPOSAL: 'create_proposal',
  APPROVE_PROPOSAL: 'approve_proposal',
  EXECUTE_PROPOSAL: 'execute_proposal',
  ADD_OWNER: 'add_owner',
  UPDATE_SPENDING_LIMIT: 'update_spending_limit',
} as const;

// Coin types
export const COIN_TYPES = {
  SUI: '0x2::sui::SUI',
} as const;

// Default spending limits and reset periods
export const DEFAULT_CONFIG = {
  SPENDING_LIMIT: '1000000000', // 1 SUI in MIST
  RESET_PERIOD_MS: 24 * 60 * 60 * 1000, // 24 hours
  MIN_REQUIRED_APPROVALS: 1,
  MAX_OWNERS: 10,
} as const;

// Transaction limits
export const TRANSACTION_LIMITS = {
  MIN_AMOUNT: '1000', // 0.000001 SUI
  MAX_AMOUNT: '1000000000000', // 1000 SUI
  GAS_BUDGET: '20000000', // 0.02 SUI
} as const;

// UI Constants
export const UI_CONFIG = {
  ITEMS_PER_PAGE: 20,
  REFRESH_INTERVAL: 30000, // 30 seconds
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet first',
  INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction',
  INVALID_ADDRESS: 'Invalid Sui address format',
  INVALID_AMOUNT: 'Invalid amount specified',
  TRANSACTION_FAILED: 'Transaction failed to execute',
  NETWORK_ERROR: 'Network connection error',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  EXPIRED_PROPOSAL: 'This proposal has expired',
  ALREADY_APPROVED: 'You have already approved this proposal',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  WALLET_CREATED: 'Multi-owner wallet created successfully',
  TRANSACTION_SENT: 'Transaction sent successfully',
  PROPOSAL_CREATED: 'Transaction proposal created successfully',
  PROPOSAL_APPROVED: 'Proposal approved successfully',
  PROPOSAL_EXECUTED: 'Proposal executed successfully',
  OWNER_ADDED: 'New owner added successfully',
  LIMIT_UPDATED: 'Spending limit updated successfully',
} as const;

// Time formats
export const TIME_FORMATS = {
  SHORT_DATE: 'MMM dd, yyyy',
  LONG_DATE: 'MMMM dd, yyyy HH:mm',
  TIME_ONLY: 'HH:mm:ss',
  RELATIVE: 'relative',
} as const;