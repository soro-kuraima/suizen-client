// constants/sui.ts
export const SUI_NETWORK = {
  DEVNET: 'https://fullnode.devnet.sui.io:443',
} as const;

export const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ADDRESS_DEVNET// Your deployed package ID

console.log()
export const MODULE_NAMES = {
  MULTI_OWNER_WALLET: 'multi_owner_wallet',
  INVOICE: 'invoice',
  SUBSCRIPTIONS: 'subscriptions',
} as const;

export const FUNCTION_NAMES = {
  // Multi-owner wallet functions
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

export const ERROR_CODES = {
  NOT_OWNER: 1,
  AMOUNT_EXCEEDS_LIMIT: 2,
  INSUFFICIENT_BALANCE: 3,
  INVALID_SETUP: 4,
  OWNER_ALREADY_EXISTS: 5,
  OWNER_DOES_NOT_EXIST: 6,
  MULTI_SIG_REQUIRED: 7,
} as const;

export const OBJECT_TYPES = {
  WALLET: `${PACKAGE_ID}::${MODULE_NAMES.MULTI_OWNER_WALLET}::Wallet`,
  OWNER_CAP: `${PACKAGE_ID}::${MODULE_NAMES.MULTI_OWNER_WALLET}::OwnerCap`,
  TRANSACTION_PROPOSAL: `${PACKAGE_ID}::${MODULE_NAMES.MULTI_OWNER_WALLET}::TransactionProposal`,
  OWNER_SPENDING_RECORD: `${PACKAGE_ID}::${MODULE_NAMES.MULTI_OWNER_WALLET}::OwnerSpendingRecord`,
} as const;

export const EVENT_TYPES = {
  WALLET_CREATED: `${PACKAGE_ID}::${MODULE_NAMES.MULTI_OWNER_WALLET}::WalletCreatedEvent`,
  COIN_DEPOSITED: `${PACKAGE_ID}::${MODULE_NAMES.MULTI_OWNER_WALLET}::CoinDepositedEvent`,
  COIN_WITHDRAWN: `${PACKAGE_ID}::${MODULE_NAMES.MULTI_OWNER_WALLET}::CoinWithdrawnEvent`,
  OWNER_ADDED: `${PACKAGE_ID}::${MODULE_NAMES.MULTI_OWNER_WALLET}::OwnerAddedEvent`,
  SPENDING_LIMIT_UPDATED: `${PACKAGE_ID}::${MODULE_NAMES.MULTI_OWNER_WALLET}::SpendingLimitUpdatedEvent`,
  PROPOSAL_CREATED: `${PACKAGE_ID}::${MODULE_NAMES.MULTI_OWNER_WALLET}::ProposalCreatedEvent`,
  PROPOSAL_APPROVED: `${PACKAGE_ID}::${MODULE_NAMES.MULTI_OWNER_WALLET}::ProposalApprovedEvent`,
  PROPOSAL_EXECUTED: `${PACKAGE_ID}::${MODULE_NAMES.MULTI_OWNER_WALLET}::ProposalExecutedEvent`,
} as const;

export const SUI_COIN_TYPE = '0x2::sui::SUI';

export const MIST_PER_SUI = 1_000_000_000; // 1 SUI = 1B MIST

export const DEFAULT_GAS_BUDGET = 10_000_000; // 0.01 SUI

export const RESET_PERIODS = {
  DAILY: 24 * 60 * 60 * 1000, // 24 hours in ms
  WEEKLY: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  MONTHLY: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
} as const;