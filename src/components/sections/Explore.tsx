import React, { useState, useEffect } from 'react';
import { Search, Bot, Wallet } from 'lucide-react';
import { backendApiService, type Bot as BackendBot } from '../../lib/backendApi';
import { mobulaApiService, type WalletPortfolio } from '../../lib/mobulaApi';

export const Explore: React.FC = () => {
  const [agents, setAgents] = useState<BackendBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [portfolios, setPortfolios] = useState<Record<string, WalletPortfolio>>({});
  const [portfolioLoading, setPortfolioLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        const fetchedAgents = await backendApiService.getAllBots();
        setAgents(Array.isArray(fetchedAgents) ? fetchedAgents : []);
        setError(null);
        
        // Fetch portfolios for each agent
        fetchedAgents.forEach(agent => {
          if (agent.swapConfig?.senderAddress) {
            fetchPortfolio(agent.swapConfig.senderAddress);
          }
        });
      } catch (err) {
        console.error('Error fetching agents:', err);
        setError('Failed to load agents. Please try again later.');
        setAgents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  const fetchPortfolio = async (walletAddress: string) => {
    if (portfolios[walletAddress] || portfolioLoading[walletAddress]) {
      return; // Already loaded or loading
    }

    setPortfolioLoading(prev => ({ ...prev, [walletAddress]: true }));

    try {
      const portfolio = await mobulaApiService.getWalletPortfolio(walletAddress, {
        cache: true,
        stale: 3600, // 1 hour cache
        filterSpam: true,
        minliq: 100, // Minimum $100 liquidity
        pnl: true
      });
      
      setPortfolios(prev => ({ ...prev, [walletAddress]: portfolio }));
    } catch (err) {
      console.error(`Error fetching portfolio for ${walletAddress}:`, err);
    } finally {
      setPortfolioLoading(prev => ({ ...prev, [walletAddress]: false }));
    }
  };

  const filteredAgents = agents.filter(agent => 
    agent.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.userWallet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.swapConfig?.senderAddress?.toLowerCase().includes(searchTerm.toLowerCase())
  );



  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="metallic-text mb-4">Explore Agents</h1>
        <p className="text-secondary" style={{ fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
          Discover powerful AI agents that can automate your crypto operations and maximize your returns
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="glass" style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
          <div className="flex items-center gap-4">
            <Search size={20} style={{ color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search agents by name or creator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '16px',
                flex: 1
              }}
            />
          </div>
        </div>
      </div>



      {/* Available Agents */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2>Available Agents ({filteredAgents.length})</h2>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.href = '/#create'}
          >
            <Bot size={16} />
            Deploy New Agent
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-glow mb-4">
              <Bot size={48} color="var(--metallic-gold)" />
            </div>
            <p className="text-secondary">Loading agents...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="card">
              <p style={{ color: '#ff4444', marginBottom: '16px' }}>{error}</p>
              <button 
                className="btn btn-secondary"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="text-center py-12">
            <div className="card">
              <Bot size={48} color="var(--text-secondary)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ marginBottom: '8px' }}>No Agents Found</h3>
              <p className="text-secondary" style={{ marginBottom: '16px' }}>
                {searchTerm ? 'No agents match your search criteria.' : 'No agents have been deployed yet.'}
              </p>
              <button className="btn btn-primary">
                <Bot size={16} />
                Deploy First Agent
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-2">
            {filteredAgents.map((agent) => {
              const walletAddress = agent.swapConfig?.senderAddress;
              const portfolio = walletAddress ? portfolios[walletAddress] : null;
              const isLoadingPortfolio = walletAddress ? portfolioLoading[walletAddress] : false;
              
              return (
                <div key={agent.id} className="card">
                  <div className="card-header">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="card-title">{agent.name || 'Unnamed Agent'}</h3>
                        <span 
                          className="metallic-text" 
                          style={{ fontSize: '12px', fontWeight: '500' }}
                        >
                          by {agent.userWallet ? `${agent.userWallet.slice(0, 6)}...${agent.userWallet.slice(-4)}` : 'Anonymous'}
                        </span>
                      </div>
                      <div className="text-right">
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {new Date(agent.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    {/* Agent Prompt */}
                    {agent.prompt && (
                      <div className="card-description mb-4">
                        <p style={{ marginBottom: '8px' }}>{agent.prompt}</p>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          <span>🔄 {agent.swapConfig?.originSymbol} → {agent.swapConfig?.destinationSymbol}</span>
                          <span style={{ marginLeft: '12px' }}>💰 {agent.swapConfig?.amount}</span>
                          <span style={{ marginLeft: '12px' }}>🌐 {agent.swapConfig?.originBlockchain}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Portfolio Section */}
                  <div className="mb-4">
                    <h4 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--metallic-gold)' }}>
                      💼 Wallet Portfolio
                    </h4>
                    {!walletAddress ? (
                      <div className="glass-dark rounded-lg p-3">
                        <p className="text-secondary" style={{ fontSize: '12px' }}>
                          No wallet address available
                        </p>
                      </div>
                    ) : isLoadingPortfolio ? (
                      <div className="glass-dark rounded-lg p-3 text-center">
                        <div className="animate-spin inline-block">⏳</div>
                        <p className="text-secondary" style={{ fontSize: '12px', marginTop: '4px' }}>
                          Loading portfolio...
                        </p>
                      </div>
                    ) : portfolio ? (
                      <div className="glass-dark rounded-lg p-3">
                        <div className="grid grid-2 gap-3 mb-3">
                          <div>
                            <div className="text-secondary" style={{ fontSize: '11px' }}>Total Balance</div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                              {mobulaApiService.formatBalance(portfolio.total_wallet_balance)}
                            </div>
                          </div>
                          <div>
                            <div className="text-secondary" style={{ fontSize: '11px' }}>24h PnL</div>
                            <div 
                              style={{ 
                                fontSize: '14px', 
                                fontWeight: '600',
                                color: portfolio.total_pnl_history['24h'] ? 
                                  (portfolio.total_pnl_history['24h'].realized + portfolio.total_pnl_history['24h'].unrealized >= 0 ? '#00ff00' : '#ff4444') : 
                                  'var(--text-secondary)'
                              }}
                            >
                              {portfolio.total_pnl_history['24h'] ? 
                                mobulaApiService.formatPnL(portfolio.total_pnl_history['24h'].realized + portfolio.total_pnl_history['24h'].unrealized).value :
                                'N/A'
                              }
                            </div>
                          </div>
                        </div>
                        
                        {/* Top Assets */}
                        {portfolio.assets && portfolio.assets.length > 0 && (
                          <div>
                            <div className="text-secondary" style={{ fontSize: '11px', marginBottom: '4px' }}>Top Holdings</div>
                            <div className="space-y-1">
                              {mobulaApiService.getTopAssets(portfolio.assets, 3).map((asset, index) => (
                                <div key={asset.asset.id || index} className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    {asset.asset.logo && (
                                      <img 
                                        src={asset.asset.logo} 
                                        alt={asset.asset.symbol}
                                        style={{ width: '16px', height: '16px', borderRadius: '50%' }}
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                      />
                                    )}
                                    <span style={{ fontSize: '12px' }}>{asset.asset.symbol}</span>
                                  </div>
                                  <div style={{ fontSize: '12px', fontWeight: '500' }}>
                                    {mobulaApiService.formatBalance(asset.estimated_balance)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="glass-dark rounded-lg p-3">
                        <p className="text-secondary" style={{ fontSize: '12px' }}>
                          Portfolio data unavailable
                        </p>
                        <button 
                          className="btn btn-ghost mt-2" 
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          onClick={() => fetchPortfolio(walletAddress)}
                        >
                          Retry
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Status and Actions */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div 
                          style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '50%',
                            backgroundColor: agent.isActive ? 'var(--metallic-gold)' : 'var(--text-secondary)'
                          }}
                        />
                        <span 
                          className="text-secondary" 
                          style={{ 
                            fontSize: '14px',
                            color: agent.isActive ? 'var(--metallic-gold)' : 'var(--text-secondary)'
                          }}
                        >
                          {agent.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        className="btn btn-ghost"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => walletAddress && fetchPortfolio(walletAddress)}
                        disabled={isLoadingPortfolio}
                      >
                        <Wallet size={14} />
                        Refresh
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
