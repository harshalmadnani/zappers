// Environment configuration template
// Copy this file to env.ts and fill in your actual values

export const config = {
  privy: {
    appId: 'YOUR_PRIVY_APP_ID',
    clientId: 'YOUR_PRIVY_CLIENT_ID',
  },
  supabase: {
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY',
    serviceRoleKey: 'YOUR_SUPABASE_SERVICE_ROLE_KEY',
  },
  theGraph: {
    apiUrl: 'https://token-api.thegraph.com',
    apiKey: 'YOUR_THEGRAPH_API_KEY',
  },
  chains: {
    supported: [
      'ethereum',
      'polygon',
      'arbitrum',
      'base',
      'optimism',
      'flow',
      'katana',
      'zircuit'
    ],
    networkIds: {
      ethereum: 'mainnet',
      polygon: 'matic',
      arbitrum: 'arbitrum-one',
      base: 'base',
      optimism: 'optimism'
    }
  }
} as const;
