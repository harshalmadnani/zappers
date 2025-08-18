const MOBULA_API_KEY = '607ccd7a-18dd-4d16-9f48-38dfe10fb238';
const MOBULA_BASE_URL = 'https://explorer-api.mobula.io/api/1';

export interface WalletAsset {
  contracts_balances: Array<{
    address: string;
    balance: number;
    balanceRaw: string;
    chainId: string;
    decimals: number;
  }>;
  cross_chain_balances: Record<string, any>;
  price_change_24h: number;
  estimated_balance: number;
  price: number;
  token_balance: number;
  allocation: number;
  asset: {
    id: number;
    name: string;
    symbol: string;
    logo: string;
    decimals: string[];
    contracts: string[];
    blockchains: string[];
  };
  wallets: string[];
  realized_pnl: number;
  unrealized_pnl: number;
  price_bought: number;
  total_invested: number;
  min_buy_price: number;
  max_buy_price: number;
}

export interface WalletPortfolio {
  total_wallet_balance: number;
  wallets: string[];
  assets: WalletAsset[];
  win_rate: number;
  tokens_distribution: {
    '10x+': number;
    '4x - 10x': number;
    '2x - 4x': number;
    '10% - 2x': number;
    '-10% - 10%': number;
    '-50% - -10%': number;
    '-100% - -50%': number;
  };
  pnl_history: {
    '1y': string[][];
    '7d': string[][];
    '24h': string[][];
    '30d': string[][];
  };
  total_realized_pnl: number;
  total_unrealized_pnl: number;
  total_pnl_history: {
    '24h': { realized: number; unrealized: number };
    '7d': { realized: number; unrealized: number };
    '30d': { realized: number; unrealized: number };
    '1y': { realized: number; unrealized: number };
  };
  balances_length: number;
}

export interface WalletTransaction {
  id: string;
  timestamp: number;
  from: string;
  to: string;
  contract: string;
  hash: string;
  amount_usd: number;
  amount: number;
  block_number: number;
  type: string;
  blockchain: string;
  tx_cost: number;
  transaction: {
    hash: string;
    chainId: string;
    fees: string;
    feesUSD: number;
    date: string;
  };
  asset: {
    id: number;
    name: string;
    symbol: string;
    logo: string;
    decimals: string[];
    contracts: string[];
    blockchains: string[];
  };
}

class MobulaApiService {
  private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${MOBULA_BASE_URL}${endpoint}`);
    
    // Add API key to params
    params.apikey = MOBULA_API_KEY;
    
    // Add all parameters to URL
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.append(key, value);
      }
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mobula API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.data || data;
  }

  // Get wallet portfolio
  async getWalletPortfolio(
    wallet: string,
    options: {
      blockchains?: string;
      cache?: boolean;
      stale?: number;
      unlistedAssets?: boolean;
      filterSpam?: boolean;
      minliq?: number;
      pnl?: boolean;
    } = {}
  ): Promise<WalletPortfolio> {
    const params: Record<string, string> = {
      wallet,
      cache: options.cache ? 'true' : 'false',
      unlistedAssets: options.unlistedAssets ? 'true' : 'false',
      filterSpam: options.filterSpam !== false ? 'true' : 'false', // Default to true
      pnl: options.pnl ? 'true' : 'false',
    };

    if (options.blockchains) params.blockchains = options.blockchains;
    if (options.stale) params.stale = options.stale.toString();
    if (options.minliq) params.minliq = options.minliq.toString();

    return this.makeRequest('/wallet/portfolio', params);
  }

  // Get wallet transactions
  async getWalletTransactions(
    wallet: string,
    options: {
      limit?: number;
      offset?: string;
      page?: string;
      order?: 'asc' | 'desc';
      from?: string;
      to?: string;
      blockchains?: string;
      unlistedAssets?: boolean;
      filterSpam?: boolean;
      trades?: boolean;
      transactions?: boolean;
    } = {}
  ): Promise<{ transactions: WalletTransaction[] }> {
    const params: Record<string, string> = {
      wallet,
      filterSpam: options.filterSpam !== false ? 'true' : 'false', // Default to true
      unlistedAssets: options.unlistedAssets ? 'true' : 'false',
    };

    if (options.limit) params.limit = options.limit.toString();
    if (options.offset) params.offset = options.offset;
    if (options.page) params.page = options.page;
    if (options.order) params.order = options.order;
    if (options.from) params.from = options.from;
    if (options.to) params.to = options.to;
    if (options.blockchains) params.blockchains = options.blockchains;
    if (options.trades) params.trades = 'true';
    if (options.transactions) params.transactions = 'true';

    return this.makeRequest('/wallet/transactions', params);
  }

  // Helper function to format balance
  formatBalance(balance: number): string {
    if (balance === 0) return '$0';
    if (balance < 0.01) return '<$0.01';
    if (balance < 1000) return `$${balance.toFixed(2)}`;
    if (balance < 1000000) return `$${(balance / 1000).toFixed(1)}K`;
    return `$${(balance / 1000000).toFixed(1)}M`;
  }

  // Helper function to format PnL
  formatPnL(pnl: number): { value: string; color: string } {
    const color = pnl >= 0 ? '#00ff00' : '#ff4444';
    const sign = pnl >= 0 ? '+' : '';
    return {
      value: `${sign}${this.formatBalance(pnl)}`,
      color
    };
  }

  // Helper function to get top assets
  getTopAssets(assets: WalletAsset[], limit: number = 3): WalletAsset[] {
    return assets
      .filter(asset => asset.estimated_balance > 0)
      .sort((a, b) => b.estimated_balance - a.estimated_balance)
      .slice(0, limit);
  }
}

export const mobulaApiService = new MobulaApiService();

