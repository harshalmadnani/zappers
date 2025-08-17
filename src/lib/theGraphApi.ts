const THEGRAPH_API_KEY = 'eyJhbGciOiJLTVNFUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3OTEzOTgxNDIsImp0aSI6IjE4ODdhMzAyLTJjNmQtNDYwYi05MTFjLWM2ZGE5OTM1MGU5MyIsImlhdCI6MTc1NTM5ODE0MiwiaXNzIjoiZGZ1c2UuaW8iLCJzdWIiOiIwY2FoaWViYWE0MDkyM2MyOGMwNGQiLCJ2IjoxLCJha2kiOiIxMDk3MjZhNGI2ZjcwNDM3M2QwZWUxYjlkMWRiMjk1MzE1MjY2YzhhNDlmZWQ3YTlmNjMyYTk1NGM3YTVhMGIyIiwidWlkIjoiMGNhaGllYmFhNDA5MjNjMjhjMDRkIn0.K8s3o4GxzXhVT7IPV0bEIrNPAs1EinkVijOZdoLTcH9ScP7NiN3TJTHN9omek93r0OvNCwRg9rtqFbBLu_rNYg';
const THEGRAPH_BASE_URL = 'https://token-api.thegraph.com';

export interface TheGraphTokenBalance {
  block_num: number;
  last_balance_update: string;
  contract: string;
  amount: string;
  value: number;
  name: string;
  symbol: string;
  decimals: number;
  network_id: string;
}

export interface TheGraphBalancesResponse {
  data: TheGraphTokenBalance[];
}

export interface EnhancedWalletPortfolio {
  // Mobula data
  total_wallet_balance: number;
  total_pnl_history: Record<string, { realized: number; unrealized: number }>;
  assets: Array<{
    asset: {
      id: string;
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

class TheGraphApiService {
  private async makeRequest<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${THEGRAPH_BASE_URL}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${THEGRAPH_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`The Graph API error: ${response.status} - ${response.statusText}`);
    }

    return response.json();
  }

  async getWalletBalances(
    address: string, 
    networkId: string = 'mainnet',
    limit: number = 100,
    page: number = 1
  ): Promise<TheGraphBalancesResponse> {
    return this.makeRequest<TheGraphBalancesResponse>(
      `/balances/evm/${address}`,
      {
        network_id: networkId,
        limit: limit.toString(),
        page: page.toString(),
      }
    );
  }

  async getMultiNetworkBalances(
    address: string,
    networks: string[] = ['mainnet', 'arbitrum-one', 'avalanche', 'base', 'bsc', 'matic', 'optimism']
  ): Promise<Record<string, TheGraphBalancesResponse>> {
    const results: Record<string, TheGraphBalancesResponse> = {};
    
    for (const network of networks) {
      try {
        const balances = await this.getWalletBalances(address, network, 100, 1);
        results[network] = balances;
      } catch (error) {
        console.warn(`Failed to fetch balances for network ${network}:`, error);
        results[network] = { data: [] };
      }
    }
    
    return results;
  }

  // Helper function to format token balances
  formatTokenBalance(balance: TheGraphTokenBalance): string {
    const numValue = parseFloat(balance.amount) / Math.pow(10, balance.decimals);
    if (numValue >= 1000000) {
      return `${(numValue / 1000000).toFixed(2)}M`;
    } else if (numValue >= 1000) {
      return `${(numValue / 1000).toFixed(2)}K`;
    } else {
      return numValue.toFixed(4);
    }
  }

  // Helper function to get top tokens by value
  getTopTokensByValue(balances: TheGraphTokenBalance[], limit: number = 10): TheGraphTokenBalance[] {
    return balances
      .filter(balance => balance.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  }
}

export const theGraphApiService = new TheGraphApiService();
