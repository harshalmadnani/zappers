// Database types
export interface User {
  id: number;
  created_at: string;
  wallet: string | null;
  agents: string | null;
}

export interface Agent {
  id: number;
  created_at: string;
  user_wallet: string | null;
  agent_name: string | null;
  public_key: string | null;
  private_key: string | null;
  agent_configuration: string | null;
  agent_deployed_link: string | null;
}

// The Graph API types
export interface TokenBalance {
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

export interface BalanceResponse {
  data: TokenBalance[];
}
