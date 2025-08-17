const API_BASE_URL = 'https://zappers-backend.onrender.com';

export interface BotConfig {
  senderAddress: string;
  senderPrivateKey: string;
  recipientAddress: string;
  originSymbol: string;
  destinationSymbol: string;
  amount: string;
  originBlockchain: string;
  destinationBlockchain: string;
  slippageTolerance: string;
  crossChain?: boolean;
  strategy?: string;
  isTest?: boolean;
}

export interface CreateBotRequest {
  name: string;
  prompt: string;
  swapConfig: BotConfig;
  userWallet?: string;
}

export interface Bot {
  id: string;
  name: string;
  prompt: string;
  swapConfig: BotConfig;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userWallet: string;
}

export interface BotLog {
  id: string;
  botId: string;
  timestamp: string;
  level: string;
  message: string;
  data?: any;
}

class BackendApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // Health check
  async getHealth(): Promise<{ status: string }> {
    return this.makeRequest('/api/health');
  }

  // API info
  async getInfo(): Promise<any> {
    return this.makeRequest('/api/info');
  }

  // Create a new bot
  async createBot(botData: CreateBotRequest): Promise<Bot> {
    return this.makeRequest('/api/bots', {
      method: 'POST',
      body: JSON.stringify(botData),
    });
  }

  // Get all bots
  async getAllBots(): Promise<Bot[]> {
    const response = await this.makeRequest<{data: Bot[], success: boolean, message: string}>('/api/bots');
    return response.data || [];
  }

  // Get specific bot
  async getBotById(botId: string): Promise<Bot> {
    const response = await this.makeRequest<{data: Bot, success: boolean, message: string}>(`/api/bots/${botId}`);
    return response.data;
  }

  // Get bots by user wallet
  async getBotsByUserWallet(userWallet: string): Promise<Bot[]> {
    const response = await this.makeRequest<{data: Bot[], success: boolean, message: string}>(`/api/bots/user/${userWallet}`);
    return response.data || [];
  }

  // Get active bots only
  async getActiveBots(): Promise<Bot[]> {
    const response = await this.makeRequest<{data: Bot[], success: boolean, message: string}>('/api/bots/status/active');
    return response.data || [];
  }

  // Activate a bot
  async activateBot(botId: string): Promise<Bot> {
    return this.makeRequest(`/api/bots/${botId}/activate`, {
      method: 'POST',
    });
  }

  // Deactivate a bot
  async deactivateBot(botId: string): Promise<Bot> {
    return this.makeRequest(`/api/bots/${botId}/deactivate`, {
      method: 'POST',
    });
  }

  // Delete a bot
  async deleteBot(botId: string): Promise<void> {
    return this.makeRequest(`/api/bots/${botId}`, {
      method: 'DELETE',
    });
  }

  // Get bot execution logs
  async getBotLogs(botId: string): Promise<BotLog[]> {
    const response = await this.makeRequest<{data: BotLog[], success: boolean, message: string}>(`/api/bots/${botId}/logs`);
    return response.data || [];
  }
}

export const backendApiService = new BackendApiService();
