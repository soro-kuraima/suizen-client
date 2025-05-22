// config/sui.ts
import { SuiClient } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SUI_NETWORK } from '../constants/sui';

export class SuiConfig {
  private static instance: SuiConfig;
  private client: SuiClient;
  private currentNetwork: keyof typeof SUI_NETWORK;

  private constructor() {
    this.currentNetwork = 'DEVNET'; // Default to devnet
    this.client = new SuiClient({ url: SUI_NETWORK[this.currentNetwork] });
  }

  public static getInstance(): SuiConfig {
    if (!SuiConfig.instance) {
      SuiConfig.instance = new SuiConfig();
    }
    return SuiConfig.instance;
  }

  public getClient(): SuiClient {
    return this.client;
  }

  public getCurrentNetwork(): keyof typeof SUI_NETWORK {
    return this.currentNetwork;
  }

  public switchNetwork(network: keyof typeof SUI_NETWORK): void {
    this.currentNetwork = network;
    this.client = new SuiClient({ url: SUI_NETWORK[network] });
  }

  public async getGasPrice(): Promise<string> {
    const gasPrice = await this.client.getReferenceGasPrice();
    return gasPrice.toString();
  }

  public createTransactionBlock(): TransactionBlock {
    return new TransactionBlock();
  }

  public createKeypair(secretKey?: Uint8Array): Ed25519Keypair {
    if (secretKey) {
      return Ed25519Keypair.fromSecretKey(secretKey);
    }
    return new Ed25519Keypair();
  }
}

// Export singleton instance
export const suiConfig = SuiConfig.getInstance();