// Environment configuration template
// Copy this file to .env and fill in your actual values
// NEVER commit the actual .env file with real secrets

export const config = {
  privy: {
    appId: 'YOUR_PRIVY_APP_ID_HERE',
    clientId: 'YOUR_PRIVY_CLIENT_ID_HERE',
  },
  supabase: {
    url: 'YOUR_SUPABASE_URL_HERE',
    anonKey: 'YOUR_SUPABASE_ANON_KEY_HERE',
    serviceRoleKey: 'YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE',
  },
  theGraph: {
    apiUrl: 'https://token-api.thegraph.com',
    apiKey: 'YOUR_THEGRAPH_API_KEY_HERE',
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
