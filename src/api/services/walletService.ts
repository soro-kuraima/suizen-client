import { Transaction } from '@mysten/sui/transactions';
import { SuiObjectResponse } from '@mysten/sui/client';
import { getSuiClient, getCurrentNetworkConfig } from '../../config/sui-client';
import { CONTRACT_FUNCTIONS, COIN_TYPES } from '../../constants/config';
import { 
  MultiOwnerWallet, 
  OwnerSpendingRecord, 
  TransactionProposal, 
  CreateWalletRequest,
  WithdrawRequest,
  CreateProposalRequest,
  AddOwnerRequest,
  WalletBalance,
  TransactionRecord
} from '../../types/wallet';
import { extractObjectData, mistToSui, parseMoveStruct, suiToMist } from '../../utils/sui';

/**
 * Service class for interacting with multi-owner wallet smart contracts
 * Note: This service builds transactions but doesn't sign them.
 * Signing is handled by wallet adapters in the UI layer.
 */
export class WalletService {
  private suiClient = getSuiClient();
  private networkConfig = getCurrentNetworkConfig();

  /**
   * Build transaction for creating a new multi-owner wallet
   */
  buildCreateWalletTransaction(request: CreateWalletRequest): Transaction {
    const tx = new Transaction();

    // Convert limits to MIST
    const limitsInMist = request.initialLimits.map(limit => suiToMist(limit));

    tx.moveCall({
      package: this.networkConfig.packageAddress,
      module: 'multi_owner_wallet',
      function: CONTRACT_FUNCTIONS.CREATE_WALLET,
      arguments: [
        tx.pure.vector('address', request.initialOwners),
        tx.pure.vector('u64', limitsInMist),
        tx.pure.u64(request.requiredApprovals),
        tx.pure.u64(request.resetPeriodMs),
        tx.object('0x6'), // Clock object
      ],
    });

    return tx;
  }

  /**
 * Build transaction for depositing SUI into a wallet
 */
buildDepositTransaction(walletId: string, coinObjectId: string): Transaction {
  const tx = new Transaction();

  tx.moveCall({
    package: this.networkConfig.packageAddress,
    module: 'multi_owner_wallet',
    function: CONTRACT_FUNCTIONS.DEPOSIT,
    arguments: [
      tx.object(walletId),
      tx.object(coinObjectId),
    ],
  });

  return tx;
}

/**
 * Build transaction for depositing a specific amount by merging/splitting coins
 */
buildDepositAmountTransaction(
  walletId: string, 
  amount: string, 
  userCoins: Array<{ objectId: string; balance: string }>
): Transaction {
  const tx = new Transaction();
  const amountInMist = suiToMist(amount);
  const targetAmount = BigInt(amountInMist);
  
  // Sort coins by balance (largest first)
  const sortedCoins = [...userCoins].sort((a, b) => 
    BigInt(b.balance) - BigInt(a.balance) > 0 ? 1 : -1
  );
  
  let totalAmount = BigInt(0);
  const coinsToUse: string[] = [];
  
  // Select coins until we have enough
  for (const coin of sortedCoins) {
    coinsToUse.push(coin.objectId);
    totalAmount += BigInt(coin.balance);
    
    if (totalAmount >= targetAmount) {
      break;
    }
  }
  
  if (totalAmount < targetAmount) {
    throw new Error('Insufficient coins for the requested amount');
  }
  
  let coinToDeposit: any;
  
  if (coinsToUse.length === 1 && totalAmount === targetAmount) {
    // Perfect match - use the coin directly
    coinToDeposit = tx.object(coinsToUse[0]);
  } else if (coinsToUse.length === 1) {
    // Single coin but need to split
    const [splitCoin] = tx.splitCoins(tx.object(coinsToUse[0]), [targetAmount]);
    coinToDeposit = splitCoin;
  } else {
    // Multiple coins - merge them first
    const primaryCoin = tx.object(coinsToUse[0]);
    const otherCoins = coinsToUse.slice(1).map(id => tx.object(id));
    
    tx.mergeCoins(primaryCoin, otherCoins);
    
    if (totalAmount > targetAmount) {
      // Split the exact amount needed
      const [splitCoin] = tx.splitCoins(primaryCoin, [targetAmount]);
      coinToDeposit = splitCoin;
    } else {
      // Use the merged coin entirely
      coinToDeposit = primaryCoin;
    }
  }
  
  // Deposit the coin
  tx.moveCall({
    package: this.networkConfig.packageAddress,
    module: 'multi_owner_wallet',
    function: CONTRACT_FUNCTIONS.DEPOSIT,
    arguments: [
      tx.object(walletId),
      coinToDeposit,
    ],
  });

  return tx;
}


  /**
   * Build transaction for withdrawing from wallet (if within spending limit)
   */
  buildWithdrawTransaction(request: WithdrawRequest, ownerCapId: string): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      package: this.networkConfig.packageAddress,
      module: 'multi_owner_wallet',
      function: CONTRACT_FUNCTIONS.WITHDRAW,
      arguments: [
        tx.object(request.walletId),
        tx.object(ownerCapId),
        tx.pure.address(request.recipient),
        tx.pure.u64(suiToMist(request.amount)),
        tx.object('0x6'), // Clock object
      ],
    });

    return tx;
  }

  /**
   * Build transaction for creating a transaction proposal
   */
  buildCreateProposalTransaction(request: CreateProposalRequest, ownerCapId: string): Transaction {
    const tx = new Transaction();

    const expirationArg = request.expirationMs 
      ? tx.pure.option('u64', request.expirationMs)
      : tx.pure.option('u64', null);

    tx.moveCall({
      package: this.networkConfig.packageAddress,
      module: 'multi_owner_wallet',
      function: CONTRACT_FUNCTIONS.CREATE_PROPOSAL,
      arguments: [
        tx.object(request.walletId),
        tx.object(ownerCapId),
        tx.pure.address(request.recipient),
        tx.pure.u64(suiToMist(request.amount)),
        expirationArg,
        tx.object('0x6'), // Clock object
      ],
    });

    return tx;
  }

  /**
   * Build transaction for approving a proposal
   */
  buildApproveProposalTransaction(walletId: string, proposalId: string, ownerCapId: string): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      package: this.networkConfig.packageAddress,
      module: 'multi_owner_wallet',
      function: CONTRACT_FUNCTIONS.APPROVE_PROPOSAL,
      arguments: [
        tx.object(walletId),
        tx.object(proposalId),
        tx.object(ownerCapId),
      ],
    });

    return tx;
  }

  /**
   * Build transaction for executing a proposal
   */
  buildExecuteProposalTransaction(walletId: string, proposalId: string, ownerCapId: string): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      package: this.networkConfig.packageAddress,
      module: 'multi_owner_wallet',
      function: CONTRACT_FUNCTIONS.EXECUTE_PROPOSAL,
      arguments: [
        tx.object(walletId),
        tx.object(proposalId),
        tx.object(ownerCapId),
        tx.object('0x6'), // Clock object
      ],
    });

    return tx;
  }

  /**
   * Build transaction for adding a new owner
   */
  buildAddOwnerTransaction(request: AddOwnerRequest, ownerCapId: string): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      package: this.networkConfig.packageAddress,
      module: 'multi_owner_wallet',
      function: CONTRACT_FUNCTIONS.ADD_OWNER,
      arguments: [
        tx.object(request.walletId),
        tx.object(ownerCapId),
        tx.pure.address(request.newOwner),
        tx.pure.u64(suiToMist(request.spendingLimit)),
        tx.object('0x6'), // Clock object
      ],
    });

    return tx;
  }

  /**
   * Build transaction for updating spending limit
   */
  buildUpdateSpendingLimitTransaction(
    walletId: string, 
    ownerToUpdate: string, 
    newLimit: string, 
    ownerCapId: string
  ): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      package: this.networkConfig.packageAddress,
      module: 'multi_owner_wallet',
      function: CONTRACT_FUNCTIONS.UPDATE_SPENDING_LIMIT,
      arguments: [
        tx.object(walletId),
        tx.object(ownerCapId),
        tx.pure.address(ownerToUpdate),
        tx.pure.u64(suiToMist(newLimit)),
      ],
    });

    return tx;
  }

  // ===== View/Query Functions =====

  /**
   * Get wallet details by ID
   */
  async getWallet(walletId: string): Promise<MultiOwnerWallet | null> {
    try {
      const response = await this.suiClient.getObject({
        id: walletId,
        options: {
          showContent: true,
          showType: true,
        },
      });

      if (!response.data || !response.data.content) {
        return null;
      }

      const walletData = parseMoveStruct(response.data);
      if (!walletData) return null;

      return {
        ...response.data,
        balance: walletData.balance || '0',
        owners: walletData.owners || [],
        requiredApprovals: walletData.required_approvals || 0,
        createdAt: walletData.created_at || 0,
        resetPeriodMs: walletData.reset_period_ms || 0,
      };
    } catch (error) {
      console.error('Failed to get wallet:', error);
      return null;
    }
  }

  /**
   * Get owner capabilities for an address
   */
  async getOwnerCapabilities(ownerAddress: string): Promise<string[]> {
    try {
      const response = await this.suiClient.getOwnedObjects({
        owner: ownerAddress,
        filter: {
          StructType: `${this.networkConfig.packageAddress}::multi_owner_wallet::OwnerCap`,
        },
        options: {
          showContent: true,
        },
      });

      return response.data
        .map(obj => obj.data?.objectId)
        .filter(Boolean) as string[];
    } catch (error) {
      console.error('Failed to get owner capabilities:', error);
      return [];
    }
  }

  /**
   * Get transaction proposals for a wallet
   * Note: This is a simplified implementation. In production, you'd want to:
   * 1. Use event queries to track proposal creation
   * 2. Implement proper indexing
   * 3. Use dynamic fields querying for better performance
   */
  async getTransactionProposals(walletId: string): Promise<TransactionProposal[]> {
    try {
      // For now, we'll use event-based querying to find proposals
      // This is more efficient than scanning all objects
      const events = await this.suiClient.queryEvents({
        query: {
          MoveEventType: `${this.networkConfig.packageAddress}::multi_owner_wallet::ProposalCreatedEvent`,
        },
        limit: 50,
        order: 'descending',
      });

      const proposals: TransactionProposal[] = [];

      for (const event of events.data) {
        try {
          if (event.parsedJson && typeof event.parsedJson === 'object') {
            const eventData = event.parsedJson as any;
            
            // Check if this proposal belongs to our wallet
            if (eventData.wallet_id === walletId) {
              // Fetch the actual proposal object
              const proposalResponse = await this.suiClient.getObject({
                id: eventData.proposal_id,
                options: {
                  showContent: true,
                },
              });

              if (proposalResponse.data?.content) {
                const proposalData = parseMoveStruct(proposalResponse.data);
                if (proposalData) {
                  proposals.push({
                    ...proposalResponse.data,
                    walletId: proposalData.wallet_id,
                    recipient: proposalData.recipient,
                    amount: proposalData.amount,
                    approvals: proposalData.approvals || [],
                    expiration: proposalData.expiration,
                  });
                }
              }
            }
          }
        } catch (error) {
          console.warn('Failed to parse proposal event:', error);
        }
      }

      return proposals;
    } catch (error) {
      console.error('Failed to get transaction proposals:', error);
      return [];
    }
  }

  /**
   * Get wallet balances
   */
  async getWalletBalances(walletId: string): Promise<WalletBalance[]> {
    try {
      const wallet = await this.getWallet(walletId);
      if (!wallet) return [];

      // For now, only return SUI balance
      return [{
        coinType: COIN_TYPES.SUI,
        balance: wallet.balance,
        decimals: 9,
        symbol: 'SUI',
      }];
    } catch (error) {
      console.error('Failed to get wallet balances:', error);
      return [];
    }
  }

  /**
   * Get transaction history for a wallet
   */
  async getTransactionHistory(walletId: string, cursor?: string): Promise<{
    transactions: TransactionRecord[];
    nextCursor?: string;
    hasMore: boolean;
  }> {
    try {
      const response = await this.suiClient.queryTransactionBlocks({
        filter: {
          InputObject: walletId,
        },
        cursor,
        limit: 20,
        options: {
          showEffects: true,
          showEvents: true,
          showInput: true,
        },
      });

      const transactions: TransactionRecord[] = response.data.map(tx => ({
        digest: tx.digest,
        timestamp: parseInt(tx.timestampMs || '0'),
        sender: tx.transaction?.data?.sender || '',
        recipients: [], // Would need to parse from transaction data
        amount: '0', // Would need to parse from events
        coinType: COIN_TYPES.SUI,
        status: tx.effects?.status?.status === 'success' ? 'success' : 'failed',
        type: 'send', // Would need to determine from events
      }));

      return {
        transactions,
        nextCursor: response.nextCursor,
        hasMore: response.hasNextPage,
      };
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      return {
        transactions: [],
        hasMore: false,
      };
    }
  }

  /**
 * Get user's SUI coins for deposits
 */
async getUserCoins(userAddress: string, coinType: string = COIN_TYPES.SUI): Promise<Array<{
  objectId: string;
  balance: string;
  coinType: string;
}>> {
  try {
    const response = await this.suiClient.getCoins({
      owner: userAddress,
      coinType,
    });

    return response.data.map(coin => ({
      objectId: coin.coinObjectId,
      balance: coin.balance,
      coinType: coin.coinType,
    }));
  } catch (error) {
    console.error('Failed to get user coins:', error);
    return [];
  }
}

/**
 * Get total balance for user
 */
async getUserTotalBalance(userAddress: string, coinType: string = COIN_TYPES.SUI): Promise<string> {
  try {
    const response = await this.suiClient.getBalance({
      owner: userAddress,
      coinType,
    });

    return response.totalBalance;
  } catch (error) {
    console.error('Failed to get user balance:', error);
    return '0';
  }
}

/**
 * Estimate gas cost for deposit transaction
 */
async estimateDepositGas(walletId: string, coinObjectId: string): Promise<string> {
  try {
    const tx = this.buildDepositTransaction(walletId, coinObjectId);
    
    // This is a simplified estimation - in production you'd want to use
    // the actual gas estimation from the Sui client
    return '5000000'; // ~0.005 SUI
  } catch (error) {
    console.error('Failed to estimate gas:', error);
    return '10000000'; // Fallback estimate
  }
}

/**
 * Check if user has sufficient coins for deposit
 */
async checkDepositFeasibility(
  userAddress: string, 
  requestedAmount: string
): Promise<{
  canDeposit: boolean;
  availableBalance: string;
  requiredCoins: number;
  estimatedGas: string;
}> {
  try {
    const [userCoins, totalBalance] = await Promise.all([
      this.getUserCoins(userAddress),
      this.getUserTotalBalance(userAddress),
    ]);

    const requestedAmountBig = BigInt(suiToMist(requestedAmount));
    const totalBalanceBig = BigInt(totalBalance);
    const estimatedGas = BigInt('10000000'); // ~0.01 SUI for gas

    // Check if user has enough balance including gas
    const canDeposit = totalBalanceBig >= requestedAmountBig + estimatedGas;

    // Calculate how many coins would be needed
    let requiredCoins = 0;
    let accumulatedAmount = BigInt(0);
    
    const sortedCoins = userCoins.sort((a, b) => 
      BigInt(b.balance) - BigInt(a.balance) > 0 ? 1 : -1
    );

    for (const coin of sortedCoins) {
      requiredCoins++;
      accumulatedAmount += BigInt(coin.balance);
      
      if (accumulatedAmount >= requestedAmountBig) {
        break;
      }
    }

    return {
      canDeposit,
      availableBalance: mistToSui(totalBalance),
      requiredCoins,
      estimatedGas: mistToSui(estimatedGas.toString()),
    };
  } catch (error) {
    console.error('Failed to check deposit feasibility:', error);
    return {
      canDeposit: false,
      availableBalance: '0',
      requiredCoins: 0,
      estimatedGas: '0.01',
    };
  }
}

  /**
   * Get wallet events for a user (wallets they own or are involved in)
   */
  async getUserWalletEvents(userAddress: string): Promise<Array<{ walletId: string; event: any }>> {
    try {
      const events = await this.suiClient.queryEvents({
        query: {
          MoveEventType: `${this.networkConfig.packageAddress}::multi_owner_wallet::WalletCreatedEvent`,
        },
        limit: 50,
        order: 'descending',
      });

      const userWallets = [];
      
      for (const event of events.data) {
        try {
          if (event.parsedJson && typeof event.parsedJson === 'object') {
            const eventData = event.parsedJson as any;
            
            // Check if user was the creator or is in the initial owners
            if (eventData.creator === userAddress) {
              userWallets.push({
                walletId: eventData.wallet_id,
                event: eventData,
              });
            }
          }
        } catch (error) {
          console.warn('Failed to parse wallet event:', error);
        }
      }

      return userWallets;
    } catch (error) {
      console.error('Failed to get user wallet events:', error);
      return [];
    }
  }


  /**
 * Get owner capabilities for an address with wallet association
 */
async getOwnerCapabilitiesWithWallets(ownerAddress: string): Promise<Array<{
  capId: string;
  walletId: string;
  owner: string;
}>> {
  try {
    const response = await this.suiClient.getOwnedObjects({
      owner: ownerAddress,
      filter: {
        StructType: `${this.networkConfig.packageAddress}::multi_owner_wallet::OwnerCap`,
      },
      options: {
        showContent: true,
        showType: true,
      },
    });

    const capabilities = [];
    for (const obj of response.data) {
      if (obj.data?.content && 'fields' in obj.data.content) {
        const fields = obj.data.content.fields as any;
        capabilities.push({
          capId: obj.data.objectId,
          walletId: fields.wallet_id,
          owner: ownerAddress,
        });
      }
    }

    return capabilities;
  } catch (error) {
    console.error('Failed to get owner capabilities with wallets:', error);
    return [];
  }
}

/**
 * Get owner capability for specific wallet
 */
async getOwnerCapabilityForWallet(ownerAddress: string, walletId: string): Promise<string | null> {
  try {
    const capabilities = await this.getOwnerCapabilitiesWithWallets(ownerAddress);
    const walletCap = capabilities.find(cap => cap.walletId === walletId);
    return walletCap?.capId || null;
  } catch (error) {
    console.error('Failed to get owner capability for wallet:', error);
    return null;
  }
}

/**
 * Get spending record for an owner using dynamic fields
 */
async getOwnerSpendingRecord(walletId: string, ownerAddress: string): Promise<OwnerSpendingRecord | null> {
  try {
    // Query dynamic field for the spending record
    const dynamicFields = await this.suiClient.getDynamicFields({
      parentId: walletId,
    });

    // Find the spending record for this owner
    for (const field of dynamicFields.data) {
      try {
        const fieldObject = await this.suiClient.getObject({
          id: field.objectId,
          options: {
            showContent: true,
          },
        });

        if (fieldObject.data?.content && 'fields' in fieldObject.data.content) {
          const fields = fieldObject.data.content.fields as any;
          if (fields.name === ownerAddress) {
            const record = fields.value;
            return {
              owner: record.owner,
              spentAmount: record.spent_amount,
              spendingLimit: record.spending_limit,
              lastReset: record.last_reset,
            };
          }
        }
      } catch (error) {
        console.warn('Failed to fetch dynamic field:', field.objectId, error);
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to get spending record:', error);
    return null;
  }
}

/**
 * Check if spending limit would be exceeded
 */
async checkSpendingLimit(
  walletId: string, 
  ownerAddress: string, 
  amount: string
): Promise<{
  withinLimit: boolean;
  currentSpent: string;
  limit: string;
  available: string;
}> {
  try {
    const record = await this.getOwnerSpendingRecord(walletId, ownerAddress);
    
    if (!record) {
      return {
        withinLimit: false,
        currentSpent: '0',
        limit: '0',
        available: '0',
      };
    }

    const spent = parseFloat(record.spentAmount);
    const limit = parseFloat(record.spendingLimit);
    const requestedAmount = parseFloat(amount);
    const available = Math.max(0, limit - spent);
    const withinLimit = requestedAmount <= available;

    return {
      withinLimit,
      currentSpent: record.spentAmount,
      limit: record.spendingLimit,
      available: available.toString(),
    };
  } catch (error) {
    console.error('Failed to check spending limit:', error);
    return {
      withinLimit: false,
      currentSpent: '0',
      limit: '0',
      available: '0',
    };
  }
}
}

// Export singleton instance
export const walletService = new WalletService();
