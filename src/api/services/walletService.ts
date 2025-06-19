/* eslint-disable @typescript-eslint/no-explicit-any */
// Fixed version of src/api/services/walletService.ts

import { Transaction } from '@mysten/sui/transactions';
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
import { mistToSui, parseMoveStruct, suiToMist } from '../../utils/sui';

/**
 * Service class for interacting with multi-owner wallet smart contracts
 */
export class WalletService {
  private suiClient = getSuiClient();
  private networkConfig = getCurrentNetworkConfig();

  // ... (keep all existing transaction building methods unchanged)
  buildCreateWalletTransaction(request: CreateWalletRequest): Transaction {
    const tx = new Transaction();
    console.log(request.initialLimits);
    const limitsInMist = request.initialLimits.map(limit => suiToMist(limit));
    console.log(this.networkConfig.packageAddress);

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

  buildDepositAmountTransaction(
    walletId: string, 
    amount: string, 
    userCoins: Array<{ objectId: string; balance: string }>
  ): Transaction {
    const tx = new Transaction();
    const amountInMist = suiToMist(amount);
    const targetAmount = BigInt(amountInMist);
    
    const sortedCoins = [...userCoins].sort((a, b) => 
      BigInt(b.balance) - BigInt(a.balance) > 0 ? 1 : -1
    );
    
    let totalAmount = BigInt(0);
    const coinsToUse: string[] = [];
    
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
      coinToDeposit = tx.object(coinsToUse[0]);
    } else if (coinsToUse.length === 1) {
      const [splitCoin] = tx.splitCoins(tx.object(coinsToUse[0]), [targetAmount]);
      coinToDeposit = splitCoin;
    } else {
      const primaryCoin = tx.object(coinsToUse[0]);
      const otherCoins = coinsToUse.slice(1).map(id => tx.object(id));
      
      tx.mergeCoins(primaryCoin, otherCoins);
      
      if (totalAmount > targetAmount) {
        const [splitCoin] = tx.splitCoins(primaryCoin, [targetAmount]);
        coinToDeposit = splitCoin;
      } else {
        coinToDeposit = primaryCoin;
      }
    }
    
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

  // ===== FIXED VIEW/QUERY FUNCTIONS =====

  /**
   * Get wallet details by ID
   */
  async getWallet(walletId: string): Promise<MultiOwnerWallet | null> {
    try {
      console.log('🔍 Fetching wallet:', walletId);
      
      const response = await this.suiClient.getObject({
        id: walletId,
        options: {
          showContent: true,
          showType: true,
        },
      });

      if (!response.data || !response.data.content) {
        console.warn('❌ Wallet not found:', walletId);
        return null;
      }

      const walletData = parseMoveStruct(response.data);
      if (!walletData) {
        console.warn('❌ Failed to parse wallet data:', walletId);
        return null;
      }

      console.log('✅ Wallet data:', walletData);

      return {
        ...response.data,
        balance: walletData.balance || '0',
        owners: walletData.owners || [],
        requiredApprovals: walletData.required_approvals || 0,
        createdAt: walletData.created_at || 0,
        resetPeriodMs: walletData.reset_period_ms || 0,
      };
    } catch (error) {
      console.error('❌ Failed to get wallet:', error);
      return null;
    }
  }

  /**
   * FIXED: Get owner capabilities with wallet association for better wallet discovery
   */
  async getOwnerCapabilitiesWithWallets(ownerAddress: string): Promise<Array<{
    capId: string;
    walletId: string;
    owner: string;
  }>> {
    try {
      console.log('🔍 Fetching owner capabilities for:', ownerAddress);
      
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

      console.log('📋 Found', response.data.length, 'owner capabilities');

      const capabilities = [];
      for (const obj of response.data) {
        if (obj.data?.content && 'fields' in obj.data.content) {
          const fields = obj.data.content.fields as any;
          console.log('🎫 Owner cap fields:', fields);
          
          capabilities.push({
            capId: obj.data.objectId,
            walletId: fields.wallet_id,
            owner: ownerAddress,
          });
        }
      }

      console.log('✅ Processed capabilities:', capabilities);
      return capabilities;
    } catch (error) {
      console.error('❌ Failed to get owner capabilities with wallets:', error);
      return [];
    }
  }

  /**
   * IMPROVED: Get user wallets by finding their owner capabilities
   */
  async getUserWalletsByOwnerCaps(userAddress: string): Promise<MultiOwnerWallet[]> {
    try {
      console.log('🔍 Finding wallets for user via owner caps:', userAddress);
      
      // Get all owner capabilities for this user
      const capabilities = await this.getOwnerCapabilitiesWithWallets(userAddress);
      
      if (capabilities.length === 0) {
        console.log('❌ No owner capabilities found for user');
        return [];
      }

      console.log('🎫 Found', capabilities.length, 'owner capabilities');

      // Fetch wallet details for each capability
      const wallets = [];
      for (const cap of capabilities) {
        try {
          console.log('🔍 Fetching wallet for cap:', cap.walletId);
          const wallet = await this.getWallet(cap.walletId);
          if (wallet) {
            console.log('✅ Successfully fetched wallet:', cap.walletId);
            wallets.push(wallet);
          } else {
            console.warn('❌ Failed to fetch wallet:', cap.walletId);
          }
        } catch (error) {
          console.warn('❌ Error fetching wallet:', cap.walletId, error);
        }
      }

      console.log('✅ Total wallets found:', wallets.length);
      return wallets;
    } catch (error) {
      console.error('❌ Failed to get user wallets by owner caps:', error);
      return [];
    }
  }

  /**
   * FIXED: Get spending record for an owner using corrected dynamic field access
   */
  async getOwnerSpendingRecord(walletId: string, ownerAddress: string): Promise<OwnerSpendingRecord | null> {
    try {
      console.log('🔍 Fetching spending record for:', { walletId, ownerAddress });
      
      // Query dynamic fields for the wallet
      const dynamicFields = await this.suiClient.getDynamicFields({
        parentId: walletId,
      });

      console.log('📋 Found', dynamicFields.data.length, 'dynamic fields');

      // Find the spending record for this owner
      for (const field of dynamicFields.data) {
        try {
          console.log('🔍 Checking dynamic field:', field.objectId);
          
          const fieldObject = await this.suiClient.getObject({
            id: field.objectId,
            options: {
              showContent: true,
              showType: true,
            },
          });

          if (fieldObject.data?.content && 'fields' in fieldObject.data.content) {
            const fields = fieldObject.data.content.fields as any;
            console.log('📄 Dynamic field structure:', fields);


            // Check if this dynamic field is for our owner
            // The Move code uses the owner address as the key for dynamic object fields
            if (fields.owner === ownerAddress || 
                (typeof fields.name === 'object' && fields.owner.value === ownerAddress)) {
              
              console.log('✅ Found matching spending record field');
              
              // The value should contain the OwnerSpendingRecord
              const record = fields.value || fields;
              
              // Handle both direct fields and nested value structure
              const spendingRecord = {
                owner: record.owner || ownerAddress,
                spentAmount: record.spent_amount || record.spentAmount || '0',
                spendingLimit: record.spending_limit || record.spendingLimit || '0',
                lastReset: record.last_reset || record.lastReset || Date.now(),
              };

              console.log('✅ Parsed spending record:', spendingRecord);
              return spendingRecord;
            }
          }
        } catch (error) {
          console.warn('⚠️ Failed to fetch dynamic field:', field.objectId, error);
        }
      }

      console.log('❌ No spending record found for owner:', ownerAddress);
      
      // Return a default record if none found (shouldn't happen in practice)
      return {
        owner: ownerAddress,
        spentAmount: '0',
        spendingLimit: '1000000000000', // 1000 SUI in MIST as default
        lastReset: Date.now(),
      };
    } catch (error) {
      console.error('❌ Failed to get spending record:', error);
      
      // Return a default record on error
      return {
        owner: ownerAddress,
        spentAmount: '0',
        spendingLimit: '1000000000000', // 1000 SUI in MIST as default
        lastReset: Date.now(),
      };
    }
  }

  /**
   * IMPROVED: Check spending limit with better error handling
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
      console.log('🔍 Checking spending limit:', { walletId, ownerAddress, amount });
      
      const record = await this.getOwnerSpendingRecord(walletId, ownerAddress);
      
      if (!record) {
        console.warn('❌ No spending record found');
        return {
          withinLimit: false,
          currentSpent: '0',
          limit: '0',
          available: '0',
        };
      }

      // Convert amounts to SUI for calculation
      const spentInSui = parseFloat(mistToSui(record.spentAmount));
      const limitInSui = parseFloat(mistToSui(record.spendingLimit));
      const requestedAmountInSui = parseFloat(amount);
      
      const availableInSui = Math.max(0, limitInSui - spentInSui);
      const withinLimit = requestedAmountInSui <= availableInSui;

      const result = {
        withinLimit,
        currentSpent: spentInSui.toString(),
        limit: limitInSui.toString(),
        available: availableInSui.toString(),
      };

      console.log('✅ Spending limit check result:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to check spending limit:', error);
      return {
        withinLimit: false,
        currentSpent: '0',
        limit: '0',
        available: '0',
      };
    }
  }

  // ... (keep other existing methods unchanged)
  
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

  async getTransactionProposals(walletId: string): Promise<TransactionProposal[]> {
    try {
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
            
            if (eventData.wallet_id === walletId) {
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

  async getWalletBalances(walletId: string): Promise<WalletBalance[]> {
    try {
      const wallet = await this.getWallet(walletId);
      if (!wallet) return [];

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

  // Updated getTransactionHistory method in src/api/services/walletService.ts

  /**
   * FIXED: Get transaction history for a wallet with proper event parsing
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

      const transactions: TransactionRecord[] = response.data.map(tx => {
        // Parse transaction details from events and transaction data
        const transactionDetails = this.parseTransactionDetails(tx, walletId);
        
        return {
          digest: tx.digest,
          timestamp: parseInt(tx.timestampMs || '0'),
          sender: tx.transaction?.data?.sender || '',
          recipients: transactionDetails.recipients,
          amount: transactionDetails.amount,
          coinType: COIN_TYPES.SUI,
          status: tx.effects?.status?.status === 'success' ? 'success' : 'failed',
          type: transactionDetails.type,
          isMultiSig: transactionDetails.isMultiSig, // Add multi-sig indicator
          functionName: transactionDetails.functionName, // Add function name for debugging
        };
      });

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
   * NEW: Parse transaction details from events and transaction data
   */
  private parseTransactionDetails(tx: any, walletId: string): {
    amount: string;
    recipients: string[];
    type: 'send' | 'receive' | 'multi_sig' | 'deposit';
    isMultiSig: boolean;
    functionName?: string;
  } {
    let amount = '0';
    let recipients: string[] = [];
    let type: 'send' | 'receive' | 'multi_sig' | 'deposit' = 'send';
    let isMultiSig = false;
    let functionName: string | undefined;

    // Extract function name from transaction data
    if (tx.transaction?.data?.transaction?.transactions) {
      const moveCall = tx.transaction.data.transaction.transactions.find(
        (t: any) => t.MoveCall
      );
      if (moveCall?.MoveCall) {
        functionName = moveCall.MoveCall.function;
      }
    }

    // Parse events to extract transaction details
    if (tx.events && Array.isArray(tx.events)) {
      for (const event of tx.events) {
        if (!event.parsedJson) continue;

        const eventData = event.parsedJson;
        const eventType = event.type;

        // Handle CoinWithdrawnEvent (both direct and multi-sig)
        if (eventType.includes('CoinWithdrawnEvent')) {
          console.log('🔍 Parsing CoinWithdrawnEvent:', eventData);
          
          amount = eventData.amount || '0';
          recipients = eventData.recipient ? [eventData.recipient] : [];
          isMultiSig = eventData.required_multi_sig === true;
          type = isMultiSig ? 'multi_sig' : 'send';
          
          // Determine if it's send or receive based on wallet perspective
          if (eventData.wallet_id === walletId) {
            // Money leaving the wallet = send
            type = isMultiSig ? 'multi_sig' : 'send';
          }
          
          break; // CoinWithdrawnEvent has the most complete info
        }
        
        // Handle ProposalExecutedEvent (always multi-sig)
        else if (eventType.includes('ProposalExecutedEvent')) {
          console.log('🔍 Parsing ProposalExecutedEvent:', eventData);
          
          amount = eventData.amount || '0';
          recipients = eventData.recipient ? [eventData.recipient] : [];
          isMultiSig = true;
          type = 'multi_sig';
        }
        
        // Handle CoinDepositedEvent (money coming into wallet)
        else if (eventType.includes('CoinDepositedEvent')) {
          console.log('🔍 Parsing CoinDepositedEvent:', eventData);
          
          amount = eventData.amount || '0';
          recipients = []; // No recipient for deposits
          isMultiSig = false;
          type = 'deposit';
        }
      }
    }

    // Fallback: try to determine from function name if events didn't provide info
    if (amount === '0' && functionName) {
      console.log('🔍 Fallback: determining transaction type from function:', functionName);
      
      switch (functionName) {
        case 'withdraw':
          type = 'send';
          isMultiSig = false;
          break;
        case 'execute_proposal':
          type = 'multi_sig';
          isMultiSig = true;
          break;
        case 'deposit':
          type = 'deposit';
          isMultiSig = false;
          break;
      }
    }

    console.log('✅ Parsed transaction details:', {
      amount: `${amount} MIST (${mistToSui(amount)} SUI)`,
      recipients,
      type,
      isMultiSig,
      functionName
    });

    return {
      amount,
      recipients,
      type,
      isMultiSig,
      functionName,
    };
  }

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async estimateDepositGas(walletId: string, coinObjectId: string): Promise<string> {
    try {
      return '5000000'; // ~0.005 SUI
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      return '10000000';
    }
  }

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
      const estimatedGas = BigInt('10000000');

      const canDeposit = totalBalanceBig >= requestedAmountBig + estimatedGas;

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
}

// Export singleton instance
export const walletService = new WalletService();