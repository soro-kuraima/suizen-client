import { SuiClient } from '@mysten/sui/client';
import { NETWORKS, DEFAULT_NETWORK } from '../constants/config';

/**
 * Sui client configuration and initialization
 */
class SuiClientManager {
  private static instance: SuiClientManager;
  private clients: Map<string, SuiClient> = new Map();
  private currentNetwork: string = DEFAULT_NETWORK;

  private constructor() {
    this.initializeClients();
  }

  public static getInstance(): SuiClientManager {
    if (!SuiClientManager.instance) {
      SuiClientManager.instance = new SuiClientManager();
    }
    return SuiClientManager.instance;
  }

  /**
   * Initialize clients for all networks
   */
  private initializeClients(): void {
    console.log(NETWORKS);
    Object.entries(NETWORKS).forEach(([networkName, config]) => {
      try {
        const client = new SuiClient({
          url: config.rpcUrl,
        });
        this.clients.set(networkName, client);
      } catch (error) {
        console.error(`Failed to initialize client for ${networkName}:`, error);
      }
    });
  }

  /**
   * Get client for current network
   */
  public getCurrentClient(): SuiClient {
    const client = this.clients.get(this.currentNetwork);
    if (!client) {
      throw new Error(`Client not found for network: ${this.currentNetwork}`);
    }
    return client;
  }

  /**
   * Get client for specific network
   */
  public getClient(networkName: string): SuiClient {
    const client = this.clients.get(networkName);
    if (!client) {
      throw new Error(`Client not found for network: ${networkName}`);
    }
    return client;
  }

  /**
   * Switch to different network
   */
  public switchNetwork(networkName: string): void {
    if (!this.clients.has(networkName)) {
      throw new Error(`Network not supported: ${networkName}`);
    }
    this.currentNetwork = networkName;
  }

  /**
   * Get current network name
   */
  public getCurrentNetwork(): string {
    return this.currentNetwork;
  }

  /**
   * Get current network config
   */
  public getCurrentNetworkConfig() {
    return NETWORKS[this.currentNetwork];
  }

  /**
   * Get all available networks
   */
  public getAvailableNetworks(): Array<{ name: string; config: typeof NETWORKS[string] }> {
    return Object.entries(NETWORKS).map(([name, config]) => ({ name, config }));
  }

  /**
   * Test connection to current network
   */
  public async testConnection(): Promise<boolean> {
    try {
      const client = this.getCurrentClient();
      await client.getLatestSuiSystemState();
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Get network info
   */
  public async getNetworkInfo() {
    try {
      const client = this.getCurrentClient();
      const [chainId, protocolConfig, totalSupply] = await Promise.all([
        client.getChainIdentifier(),
        client.getProtocolConfig(),
        client.getTotalSupply({coinType: '0x2::sui::SUI'}),
      ]);

      return {
        chainId,
        protocolVersion: protocolConfig.protocolVersion,
        totalSupply: totalSupply.value,
        network: this.currentNetwork,
      };
    } catch (error) {
      console.error('Failed to get network info:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const suiClientManager = SuiClientManager.getInstance();

// Convenience functions
export const getSuiClient = () => suiClientManager.getCurrentClient();
export const switchNetwork = (network: string) => suiClientManager.switchNetwork(network);
export const getCurrentNetwork = () => suiClientManager.getCurrentNetwork();
export const getCurrentNetworkConfig = () => suiClientManager.getCurrentNetworkConfig();