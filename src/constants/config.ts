//import { getCurrentNetwork } from '../config/sui-client';
import { NetworkConfig } from '../types/wallet';

export const DEFAULT_NETWORK = 'devnet';

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
    packageAddress: '0x95d889f983104d61c5b6145a0c6a1028882048d8c7f62f439951906c1e3e95ea', // Replace with your deployed package address
    explorerUrl: 'https://explorer.sui.io/?network=devnet',
  },
  localnet: {
    name: 'Local Network',
    rpcUrl: 'http://127.0.0.1:9000',
    packageAddress: '0x...', // Replace with your local package address
    explorerUrl: 'http://localhost:3000',
  },
};

// Coin types
export const COIN_TYPES = {
  SUI: '0x2::sui::SUI',
} as const;


// Update contract function names to match your Move code
export const CONTRACT_FUNCTIONS = {
  // Multi-owner wallet functions - these should match your Move module exactly
  CREATE_WALLET: 'create_wallet',
  DEPOSIT: 'deposit',
  WITHDRAW: 'withdraw',
  CREATE_PROPOSAL: 'create_proposal',
  APPROVE_PROPOSAL: 'approve_proposal',
  EXECUTE_PROPOSAL: 'execute_proposal',
  ADD_OWNER: 'add_owner',
  UPDATE_SPENDING_LIMIT: 'update_spending_limit',
  
  // View functions
  BALANCE: 'balance',
  OWNER_SPENDING: 'owner_spending',
  IS_OWNER: 'is_owner',
  PROPOSAL_DETAILS: 'proposal_details',
} as const;

// Add event types that match your Move events
export const EVENT_TYPES = {
  WALLET_CREATED: `::multi_owner_wallet::WalletCreatedEvent`,
  COIN_DEPOSITED: `::multi_owner_wallet::CoinDepositedEvent`,
  COIN_WITHDRAWN: `::multi_owner_wallet::CoinWithdrawnEvent`,
  OWNER_ADDED: `::multi_owner_wallet::OwnerAddedEvent`,
  SPENDING_LIMIT_UPDATED: `::multi_owner_wallet::SpendingLimitUpdatedEvent`,
  PROPOSAL_CREATED: `::multi_owner_wallet::ProposalCreatedEvent`,
  PROPOSAL_APPROVED: `::multi_owner_wallet::ProposalApprovedEvent`,
  PROPOSAL_EXECUTED: `::multi_owner_wallet::ProposalExecutedEvent`,
} as const;

// Add object types that match your Move structs
export const OBJECT_TYPES = {
  WALLET: `::multi_owner_wallet::Wallet`,
  OWNER_CAP: `::multi_owner_wallet::OwnerCap`,
  TRANSACTION_PROPOSAL: `::multi_owner_wallet::TransactionProposal`,
  OWNER_SPENDING_RECORD: `::multi_owner_wallet::OwnerSpendingRecord`,
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