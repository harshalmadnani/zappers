import React from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { LogIn, Zap } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { authenticated, login, ready } = usePrivy();

  // Show loading state while Privy is initializing
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-glow mb-6">
            <Zap size={48} color="var(--metallic-gold)" />
          </div>
          <div className="metallic-text" style={{ fontSize: '18px' }}>
            Loading Xade...
          </div>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          {/* Logo */}
          <div className="mb-8">
            <img 
              src="/xade.png" 
              alt="Xade" 
              style={{ 
                width: '176px', 
                height: '53px', 
                margin: '40px auto 40px',
                display: 'block'
              }} 
              onError={(e) => {
                // Fallback if image doesn't exist
                e.currentTarget.style.display = 'none';
              }}
            />
            <p className="text-secondary" style={{ 
              fontSize: '20px', 
              lineHeight: '1.6',
              marginBottom: '32px',
              maxWidth: '600px',
              marginLeft: 'auto',
              marginRight: 'auto',
              textAlign: 'center',
              fontWeight: '400'
            }}>
              Deploy powerful AI agents to automate your crypto operations and maximize returns across multiple chains.
            </p>
          </div>

          {/* Features */}
          <div className="grid gap-4 mb-8">
            <div className="card text-left">
              <div className="flex items-center gap-4">
                <div className="metallic-gradient rounded-lg" style={{ padding: '12px' }}>
                  <Zap size={24} color="var(--bg-primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>Native Camp Support</h3>
                  <p className="text-secondary" style={{ fontSize: '14px' }}>
                    Made exclusively for Camp, automate your trading strategies on Camp
                  </p>
                </div>
              </div>
            </div>

            <div className="card text-left">
              <div className="flex items-center gap-4">
                <div className="metallic-gradient rounded-lg" style={{ padding: '12px' }}>
                  <Zap size={24} color="var(--bg-primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>AI-Powered Agents</h3>
                  <p className="text-secondary" style={{ fontSize: '14px' }}>
                    Automated DeFi, arbitrage, and portfolio management
                  </p>
                </div>
              </div>
            </div>

            <div className="card text-left">
              <div className="flex items-center gap-4">
                <div className="metallic-gradient rounded-lg" style={{ padding: '12px' }}>
                  <Zap size={24} color="var(--bg-primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>Real-Time Portfolio</h3>
                  <p className="text-secondary" style={{ fontSize: '14px' }}>
                    Track your assets and performance across all chains
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Login Button */}
          <button
            onClick={login}
            className="btn btn-primary animate-glow"
            style={{ 
              padding: '16px 32px', 
              fontSize: '18px',
              width: '100%',
              marginBottom: '16px'
            }}
          >
            <LogIn size={20} />
            Connect Wallet to Get Started
          </button>

          <p className="text-secondary" style={{ fontSize: '14px' }}>
            Connect with your email or any Web3 wallet to begin
          </p>
        </div>

        {/* Background decoration */}
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 20% 80%, rgba(212, 175, 55, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(212, 175, 55, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.03) 0%, transparent 50%)
            `,
            pointerEvents: 'none',
            zIndex: -1
          }}
        />
      </div>
    );
  }

  // Render children if authenticated
  return <>{children}</>;
};

