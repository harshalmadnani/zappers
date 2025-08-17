import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'viem';
import { 
  mainnet, 
  polygon, 
  arbitrum, 
  base, 
  optimism 
} from 'viem/chains';
import { createConfig } from '@privy-io/wagmi';
import { config as envConfig } from '../config/env';

// Create wagmi config with supported chains
export const wagmiConfig = createConfig({
  chains: [mainnet, polygon, arbitrum, base, optimism],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
    [optimism.id]: http(),
  },
});

// Create React Query client
export const queryClient = new QueryClient();

// Privy configuration
export const privyConfig = {
  appId: envConfig.privy.appId,
  config: {
    loginMethods: ['email', 'wallet'] as ('email' | 'wallet')[],
    appearance: {
      theme: 'dark' as const,
      accentColor: '#D4AF37' as `#${string}`,
      logo: undefined,
    },
    embeddedWallets: {
      createOnLogin: 'users-without-wallets' as const,
    },
    mfa: {
      noPromptOnMfaRequired: false,
    },
  },
};

// Wrapper components for providers
export { PrivyProvider, WagmiProvider, QueryClientProvider };
