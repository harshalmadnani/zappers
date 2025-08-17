// Environment configuration
// This file reads from environment variables (.env file)
// Copy env.example.ts to .env and fill in your actual values

// Helper function to get environment variable with fallback
const getEnvVar = (key: string, fallback: string): string => {
  // In Vite, environment variables are prefixed with VITE_
  const envKey = `VITE_${key}`;
  return import.meta.env[envKey] || fallback;
};

// Configuration that reads from environment variables
export const config = {
  privy: {
    appId: getEnvVar('PRIVY_APP_ID', ''),
    clientId: getEnvVar('PRIVY_CLIENT_ID', ''),
  },
  supabase: {
    url: getEnvVar('SUPABASE_URL', ''),
    anonKey: getEnvVar('SUPABASE_ANON_KEY', ''),
    serviceRoleKey: getEnvVar('SUPABASE_SERVICE_ROLE_KEY', ''),
  },
  theGraph: {
    apiUrl: getEnvVar('THEGRAPH_API_URL', 'https://token-api.thegraph.com'),
    apiKey: getEnvVar('THEGRAPH_API_KEY', ''),
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
