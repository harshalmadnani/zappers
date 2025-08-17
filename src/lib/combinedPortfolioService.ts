import { mobulaApiService, type WalletPortfolio } from './mobulaApi';
import { theGraphApiService, type TheGraphTokenBalance } from './theGraphApi';

export interface EnhancedWalletPortfolio {
  // Mobula data
  total_wallet_balance: number;
  total_pnl_history: Record<string, { realized: number; unrealized: number }>;
  assets: Array<{
    asset: {
      id: number;
      symbol: string;
      name: string;
      logo?: string;
    };
    estimated_balance: number;
    allocation: number;
  }>;
  
  // The Graph data
  theGraphBalances: TheGraphTokenBalance[];
  totalTheGraphValue: number;
  
  // Combined data
  combinedTotalValue: number;
  allTokens: Array<{
    symbol: string;
    name: string;
    balance: number;
    value: number;
    source: 'mobula' | 'thegraph' | 'combined';
    logo?: string;
    contract?: string;
    network?: string;
  }>;
}

export class CombinedPortfolioService {
  async getEnhancedPortfolio(
    walletAddress: string,
    options?: {
      useMobula?: boolean;
      useTheGraph?: boolean;
      networks?: string[];
      cache?: boolean;
      stale?: number;
    }
  ): Promise<EnhancedWalletPortfolio> {
    const {
      useMobula = true,
      useTheGraph = true,
      networks = ['mainnet', 'arbitrum-one', 'avalanche', 'base', 'bsc', 'matic', 'optimism'],
      cache = true,
      stale = 3600
    } = options || {};

    let mobulaData: WalletPortfolio | null = null;
    let theGraphData: TheGraphTokenBalance[] = [];
    let totalTheGraphValue = 0;

    // Fetch Mobula data if enabled
    if (useMobula) {
      try {
        mobulaData = await mobulaApiService.getWalletPortfolio(walletAddress, {
          cache,
          stale,
          filterSpam: true,
          minliq: 100,
          pnl: true
        });
      } catch (error) {
        console.warn('Failed to fetch Mobula data:', error);
      }
    }

    // Fetch The Graph data if enabled
    if (useTheGraph) {
      try {
        const multiNetworkBalances = await theGraphApiService.getMultiNetworkBalances(walletAddress, networks);
        
        // Combine all network balances
        Object.values(multiNetworkBalances).forEach(networkBalances => {
          theGraphData.push(...networkBalances.data);
        });
        
        // Calculate total The Graph value
        totalTheGraphValue = theGraphData.reduce((sum, balance) => sum + balance.value, 0);
      } catch (error) {
        console.warn('Failed to fetch The Graph data:', error);
      }
    }

    // Create combined portfolio
    const combinedPortfolio: EnhancedWalletPortfolio = {
      // Mobula data
      total_wallet_balance: mobulaData?.total_wallet_balance || 0,
      total_pnl_history: mobulaData?.total_pnl_history || {},
      assets: mobulaData?.assets || [],
      
      // The Graph data
      theGraphBalances: theGraphData,
      totalTheGraphValue,
      
      // Combined calculations
      combinedTotalValue: (mobulaData?.total_wallet_balance || 0) + totalTheGraphValue,
      allTokens: []
    };

    // Combine tokens from both sources
    const tokenMap = new Map<string, any>();

    // Add Mobula tokens
    if (mobulaData?.assets) {
      mobulaData.assets.forEach(asset => {
        const key = asset.asset.symbol.toLowerCase();
        tokenMap.set(key, {
          symbol: asset.asset.symbol,
          name: asset.asset.name,
          balance: asset.estimated_balance,
          value: asset.estimated_balance, // Mobula provides balance in USD
          source: 'mobula' as const,
          logo: asset.asset.logo,
          allocation: asset.allocation
        });
      });
    }

    // Add The Graph tokens
    theGraphData.forEach(balance => {
      const key = balance.symbol.toLowerCase();
      const existingToken = tokenMap.get(key);
      
      if (existingToken) {
        // Token exists in both sources - combine data
        existingToken.source = 'combined' as const;
        existingToken.value = Math.max(existingToken.value, balance.value);
        existingToken.contract = balance.contract;
        existingToken.network = balance.network_id;
        existingToken.balance = Math.max(existingToken.balance, balance.value);
      } else {
        // New token from The Graph
        tokenMap.set(key, {
          symbol: balance.symbol,
          name: balance.name,
          balance: parseFloat(balance.amount) / Math.pow(10, balance.decimals),
          value: balance.value,
          source: 'thegraph' as const,
          contract: balance.contract,
          network: balance.network_id
        });
      }
    });

    // Convert map to array and sort by value
    combinedPortfolio.allTokens = Array.from(tokenMap.values())
      .sort((a, b) => b.value - a.value);

    return combinedPortfolio;
  }

  // Helper function to get portfolio summary
  getPortfolioSummary(portfolio: EnhancedWalletPortfolio) {
    return {
      totalValue: portfolio.combinedTotalValue,
      mobulaValue: portfolio.total_wallet_balance,
      theGraphValue: portfolio.totalTheGraphValue,
      tokenCount: portfolio.allTokens.length,
      topTokens: portfolio.allTokens.slice(0, 5),
      networks: [...new Set(portfolio.theGraphBalances.map(b => b.network_id))]
    };
  }

  // Helper function to format currency
  formatCurrency(value: number): string {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  }

  // Helper function to get network icon
  getNetworkIcon(networkId: string): string {
    const networkIcons: Record<string, string> = {
      'mainnet': '🔵',
      'arbitrum-one': '🔴',
      'avalanche': '❄️',
      'base': '🔷',
      'bsc': '🟡',
      'matic': '🟣',
      'optimism': '🟠'
    };
    return networkIcons[networkId] || '🌐';
  }
}

export const combinedPortfolioService = new CombinedPortfolioService();
