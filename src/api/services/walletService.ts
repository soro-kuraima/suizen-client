import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SuiObjectResponse, SuiTransactionBlockResponse } from '@mysten/sui.js/client';
import { suiConfig } from '../../config/sui';
import { 
  PACKAGE_ID, 
  MODULE_NAMES, 
  FUNCTION_NAMES, 
  OBJECT_TYPES,
  EVENT_TYPES,
  SUI_COIN_TYPE,
  MIST_PER_SUI 
} from '../../constants/sui';
import {
  MultiOwnerWallet,
  OwnerCapability,
  TransactionProposal,
  CreateWalletParams,
  WithdrawParams,
  CreateProposalParams,
  WalletTransaction,
  ApiResponse,
  PaginatedResponse
} from '../../types/wallet';

export class WalletService {
  private client = suiConfig.getClient();

  // Create a new multi-owner wallet
  public async createWallet(params: CreateWalletParams): Promise<ApiResponse<string>> {
    try {
      const txb = new TransactionBlock();
      
      // Get current clock object
      const clock = txb.object('0x6');
      
      txb.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAMES.MULTI_OWNER_WALLET}::${FUNCTION_NAMES.CREATE_WALLET}`,
        arguments: [
          txb.pure(params.initialOwners),
          txb.pure(params.initialLimits.map(limit => BigInt(limit))),
          txb.pure(params.requiredApprovals),
          txb.pure(BigInt(params.resetPeriodMs)),
          clock,
        ],
      });

      return { 
        data: txb.serialize(), 
        success: true 
      };
    } catch (error) {
      return { 
        data: '', 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Deposit SUI into wallet
  public async deposit(walletId: string, amount: string): Promise<ApiResponse<string>> {
    try {
      const txb = new TransactionBlock();
      
      // Convert SUI to MIST
      const amountInMist = BigInt(parseFloat(amount) * MIST_PER_SUI);
      
      // Split coin for deposit
      const [coin] = txb.splitCoins(txb.gas, [txb.pure(amountInMist)]);
      
      txb.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAMES.MULTI_OWNER_WALLET}::${FUNCTION_NAMES.DEPOSIT}`,
        arguments: [
          txb.object(walletId),
          coin,
        ],
      });

      return { 
        data: txb.serialize(), 
        success: true 
      };
    } catch (error) {
      return { 
        data: '', 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Withdraw from wallet (within spending limit)
  public async withdraw(params: WithdrawParams, ownerCapId: string): Promise<ApiResponse<string>> {
    try {
      const txb = new TransactionBlock();
      
      // Get current clock object
      const clock = txb.object('0x6');
      
      // Convert SUI to MIST
      const amountInMist = BigInt(parseFloat(params.amount) * MIST_PER_SUI);
      
      txb.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAMES.MULTI_OWNER_WALLET}::${FUNCTION_NAMES.WITHDRAW}`,
        arguments: [
          txb.object(params.walletId),
          txb.object(ownerCapId),
          txb.pure(params.recipient),
          txb.pure(amountInMist),
          clock,
        ],
      });

      return { 
        data: txb.serialize(), 
        success: true 
      };
    } catch (error) {
      return { 
        data: '', 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Create transaction proposal (for amounts exceeding limits)
  public async createProposal(params: CreateProposalParams, ownerCapId: string): Promise<ApiResponse<string>> {
    try {
      const txb = new TransactionBlock();
      
      // Get current clock object
      const clock = txb.object('0x6');
      
      // Convert SUI to MIST
      const amountInMist = BigInt(parseFloat(params.amount) * MIST_PER_SUI);
      
      // Convert expiration to option
      const expirationArg = params.expirationMs 
        ? txb.pure([BigInt(params.expirationMs)]) 
        : txb.pure([]);
      
      txb.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAMES.MULTI_OWNER_WALLET}::${FUNCTION_NAMES.CREATE_PROPOSAL}`,
        arguments: [
          txb.object(params.walletId),
          txb.object(ownerCapId),
          txb.pure(params.recipient),
          txb.pure(amountInMist),
          expirationArg,
          clock,
        ],
      });

      return { 
        data: txb.serialize(), 
        success: true 
      };
    } catch (error) {
      return { 
        data: '', 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Approve a transaction proposal
  public async approveProposal(walletId: string, proposalId: string, ownerCapId: string): Promise<ApiResponse<string>> {
    try {
      const txb = new TransactionBlock();
      
      txb.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAMES.MULTI_OWNER_WALLET}::${FUNCTION_NAMES.APPROVE_PROPOSAL}`,
        arguments: [
          txb.object(walletId),
          txb.object(proposalId),
          txb.object(ownerCapId),
        ],
      });

      return { 
        data: txb.serialize(), 
        success: true 
      };
    } catch (error) {
      return { 
        data: '', 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Execute a transaction proposal
  public async executeProposal(walletId: string, proposalId: string, ownerCapId: string): Promise<ApiResponse<string>> {
    try {
      const txb = new TransactionBlock();
      
      // Get current clock object
      const clock = txb.object('0x6');
      
      txb.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAMES.MULTI_OWNER_WALLET}::${FUNCTION_NAMES.EXECUTE_PROPOSAL}`,
        arguments: [
          txb.object(walletId),
          txb.object(proposalId),
          txb.object(ownerCapId),
          clock,
        ],
      });

      return { 
        data: txb.serialize(), 
        success: true 
      };
    } catch (error) {
      return { 
        data: '', 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Add new owner to wallet
  public async addOwner(
    walletId: string, 
    newOwner: string, 
    spendingLimit: string, 
    ownerCapId: string
  ): Promise<ApiResponse<string>> {
    try {
      const txb = new TransactionBlock();
      
      // Get current clock object
      const clock = txb.object('0x6');
      
      // Convert SUI to MIST
      const limitInMist = BigInt(parseFloat(spendingLimit) * MIST_PER_SUI);
      
      txb.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAMES.MULTI_OWNER_WALLET}::${FUNCTION_NAMES.ADD_OWNER}`,
        arguments: [
          txb.object(walletId),
          txb.object(ownerCapId),
          txb.pure(newOwner),
          txb.pure(limitInMist),
          clock,
        ],
      });

      return { 
        data: txb.serialize(), 
        success: true 
      };
    } catch (error) {
      return { 
        data: '', 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Update spending limit for an owner
  public async updateSpendingLimit(
    walletId: string, 
    ownerToUpdate: string, 
    newLimit: string, 
    ownerCapId: string
  ): Promise<ApiResponse<string>> {
    try {
      const txb = new TransactionBlock();
      
      // Convert SUI to MIST
      const limitInMist = BigInt(parseFloat(newLimit) * MIST_PER_SUI);
      
      txb.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAMES.MULTI_OWNER_WALLET}::${FUNCTION_NAMES.UPDATE_SPENDING_LIMIT}`,
        arguments: [
          txb.object(walletId),
          txb.object(ownerCapId),
          txb.pure(ownerToUpdate),
          txb.pure(limitInMist),
        ],
      });

      return { 
        data: txb.serialize(), 
        success: true 
      };
    } catch (error) {
      return { 
        data: '', 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get wallet details
  public async getWallet(walletId: string): Promise<ApiResponse<MultiOwnerWallet | null>> {
    try {
      const response = await this.client.getObject({
        id: walletId,
        options: {
          showContent: true,
          showType: true,
        },
      });

      if (!response.data?.content || response.data.content.dataType !== 'moveObject') {
        return { data: null, success: false, error: 'Wallet not found' };
      }

      const fields = response.data.content.fields as any;
      
      const wallet: MultiOwnerWallet = {
        id: walletId,
        balance: fields.balance.toString(),
        owners: fields.owners,
        requiredApprovals: parseInt(fields.required_approvals),
        createdAt: fields.created_at,
        resetPeriodMs: fields.reset_period_ms,
      };

      return { data: wallet, success: true };
    } catch (error) {
      return { 
        data: null, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get owner capabilities for a user
  public async getOwnerCapabilities(userAddress: string): Promise<ApiResponse<OwnerCapability[]>> {
    try {
      const response = await this.client.getOwnedObjects({
        owner: userAddress,
        filter: {
          StructType: OBJECT_TYPES.OWNER_CAP,
        },
        options: {
          showContent: true,
          showType: true,
        },
      });

      const capabilities: OwnerCapability[] = response.data
        .filter(item => item.data?.content?.dataType === 'moveObject')
        .map(item => {
          const fields = item.data!.content!.fields as any;
          return {
            id: item.data!.objectId,
            walletId: fields.wallet_id,
            owner: fields.owner,
          };
        });

      return { data: capabilities, success: true };
    } catch (error) {
      return { 
        data: [], 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get transaction proposals for a wallet
  public async getProposals(walletId: string): Promise<ApiResponse<TransactionProposal[]>> {
    try {
      const response = await this.client.getOwnedObjects({
        owner: walletId, // Proposals are shared objects, so we need to query differently
        filter: {
          StructType: OBJECT_TYPES.TRANSACTION_PROPOSAL,
        },
        options: {
          showContent: true,
          showType: true,
        },
      });

      const proposals: TransactionProposal[] = response.data
        .filter(item => item.data?.content?.dataType === 'moveObject')
        .map(item => {
          const fields = item.data!.content!.fields as any;
          return {
            id: item.data!.objectId,
            walletId: fields.wallet_id,
            recipient: fields.recipient,
            amount: fields.amount,
            approvals: fields.approvals,
            expiration: fields.expiration?.[0],
            creator: fields.approvals[0], // First approver is creator
            createdAt: '', // Would need to get from events
          };
        });

      return { data: proposals, success: true };
    } catch (error) {
      return { 
        data: [], 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get wallet events and transactions
  public async getWalletTransactions(
    walletId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ApiResponse<PaginatedResponse<WalletTransaction>>> {
    try {
      const events = await this.client.queryEvents({
        query: {
          MoveEventType: EVENT_TYPES.COIN_DEPOSITED,
        },
        order: 'descending',
        limit,
      });

      // Transform events to transactions
      const transactions: WalletTransaction[] = events.data.map((event, index) => ({
        id: event.id.eventSeq,
        type: 'deposit', // This would be determined by event type
        amount: (event.parsedJson as any)?.amount || '0',
        sender: (event.parsedJson as any)?.depositor || '',
        timestamp: event.timestampMs || '0',
        blockHeight: 0, // Would need to get from transaction details
        success: true,
      }));

      return {
        data: {
          data: transactions,
          total: events.data.length,
          page,
          limit,
          hasMore: events.hasNextPage,
        },
        success: true,
      };
    } catch (error) {
      return {
        data: {
          data: [],
          total: 0,
          page,
          limit,
          hasMore: false,
        },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const walletService = new WalletService();