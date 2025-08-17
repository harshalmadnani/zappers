import { config } from '../config/env';
import type { TokenBalance, BalanceResponse } from '../types/database';

// Re-export types for convenience
export type { TokenBalance, BalanceResponse };

// The Graph API service
export class TheGraphService {
  private baseUrl = config.theGraph.apiUrl;
  private apiKey = config.theGraph.apiKey;

  private async makeRequest<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`The Graph API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getBalancesByAddress(
    address: string, 
    networkId: string = 'mainnet',
    limit: number = 100
  ): Promise<TokenBalance[]> {
    const endpoint = `/balances/evm/${address}?network_id=${networkId}&limit=${limit}`;
    const response = await this.makeRequest<BalanceResponse>(endpoint);
    return response.data;
  }

  async getMultiChainBalances(address: string): Promise<{
    [networkId: string]: TokenBalance[];
  }> {
    const supportedNetworks = ['mainnet', 'matic', 'arbitrum-one', 'base', 'optimism'];
    const balancePromises = supportedNetworks.map(async (networkId) => {
      try {
        const balances = await this.getBalancesByAddress(address, networkId);
        return { networkId, balances };
      } catch (error) {
        console.warn(`Failed to fetch balances for ${networkId}:`, error);
        return { networkId, balances: [] };
      }
    });

    const results = await Promise.all(balancePromises);
    const balancesByNetwork: { [networkId: string]: TokenBalance[] } = {};
    
    results.forEach(({ networkId, balances }) => {
      balancesByNetwork[networkId] = balances;
    });

    return balancesByNetwork;
  }

  // Filter out scam/spam tokens
  private isScamToken(balance: TokenBalance): boolean {
    const scamKeywords = [
      'visit', 'claim', 'reward', 'bonus', 'airdrop', 'redeem', 'earn',
      'www.', 'http', '.com', '.xyz', '.io', '.site', '.org', '.events',
      'telegram', 't.me', 't.ly', 'check:', 'use just', 'official link',
      'entry ticket', 'raffle ticket', 'voucher', 'mining', 'stake',
      'pool', 'drop', 'code', 'refid', 'within', 'days', 'until'
    ];

    const tokenName = balance.name.toLowerCase();
    const tokenSymbol = balance.symbol.toLowerCase();
    
    // Check if token name or symbol contains scam keywords
    const hasScamKeywords = scamKeywords.some(keyword => 
      tokenName.includes(keyword) || tokenSymbol.includes(keyword)
    );

    // Filter out tokens with very low value (likely dust/spam)
    const isDustToken = balance.value < 0.01;

    // Filter out tokens with suspicious unicode characters
    const hasSuspiciousChars = /[^\x00-\x7F]/.test(balance.name) || /[^\x00-\x7F]/.test(balance.symbol);

    return hasScamKeywords || isDustToken || hasSuspiciousChars;
  }

  // Filter balances to remove scam tokens
  filterValidTokens(balancesByNetwork: { [networkId: string]: TokenBalance[] }): { [networkId: string]: TokenBalance[] } {
    const filteredBalances: { [networkId: string]: TokenBalance[] } = {};
    
    Object.entries(balancesByNetwork).forEach(([networkId, balances]) => {
      filteredBalances[networkId] = balances.filter(balance => !this.isScamToken(balance));
    });

    return filteredBalances;
  }

  calculateTotalPortfolioValue(balancesByNetwork: { [networkId: string]: TokenBalance[] }): {
    totalValue: number;
    totalTokens: number;
    networkBreakdown: { [networkId: string]: { value: number; tokens: number } };
  } {
    // First filter out scam tokens
    const filteredBalances = this.filterValidTokens(balancesByNetwork);
    
    let totalValue = 0;
    let totalTokens = 0;
    const networkBreakdown: { [networkId: string]: { value: number; tokens: number } } = {};

    Object.entries(filteredBalances).forEach(([networkId, balances]) => {
      let networkValue = 0;
      let networkTokens = 0;

      balances.forEach((balance) => {
        networkValue += balance.value;
        networkTokens += 1;
      });

      networkBreakdown[networkId] = {
        value: networkValue,
        tokens: networkTokens
      };

      totalValue += networkValue;
      totalTokens += networkTokens;
    });

    return {
      totalValue,
      totalTokens,
      networkBreakdown
    };
  }

  getNetworkDisplayName(networkId: string): string {
    const networkNames: { [key: string]: string } = {
      'mainnet': 'Ethereum',
      'matic': 'Polygon',
      'arbitrum-one': 'Arbitrum',
      'base': 'Base',
      'optimism': 'Optimism'
    };
    return networkNames[networkId] || networkId;
  }

  getNetworkColor(networkId: string): string {
    const networkColors: { [key: string]: string } = {
      'mainnet': '#627EEA',
      'matic': '#8247E5',
      'arbitrum-one': '#28A0F0',
      'base': '#0052FF',
      'optimism': '#FF0420'
    };
    return networkColors[networkId] || 'var(--metallic-gold)';
  }
}

// Export singleton instance
export const theGraphService = new TheGraphService();
