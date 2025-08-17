import React, { useState, useEffect } from 'react';
import { Search, Bot, Wallet, Activity, Clock, Eye, X, CheckCircle, AlertCircle } from 'lucide-react';
import { backendApiService, type Bot as BackendBot, type BotLog } from '../../lib/backendApi';
import { mobulaApiService, type WalletPortfolio } from '../../lib/mobulaApi';

export const Explore: React.FC = () => {
  const [agents, setAgents] = useState<BackendBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [portfolios, setPortfolios] = useState<Record<string, WalletPortfolio>>({});
  const [portfolioLoading, setPortfolioLoading] = useState<Record<string, boolean>>({});
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedBot, setSelectedBot] = useState<BackendBot | null>(null);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [botLogs, setBotLogs] = useState<BotLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const fetchedAgents = await backendApiService.getAllBots();
      setAgents(Array.isArray(fetchedAgents) ? fetchedAgents : []);
      setError(null);
      setLastUpdate(new Date());
      
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

  useEffect(() => {
    fetchAgents();
    
    // Set up real-time refresh every 45 seconds
    const interval = setInterval(() => {
      fetchAgents();
    }, 45000); // 45 seconds

    // Cleanup interval on unmount
    return () => {
      clearInterval(interval);
    };
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

  // View bot logs
  const viewBotLogs = async (bot: BackendBot) => {
    setSelectedBot(bot);
    setShowLogsModal(true);
    setLogsLoading(true);
    setBotLogs([]);

    try {
      const logs = await backendApiService.getBotLogs(bot.id);
      setBotLogs(Array.isArray(logs) ? logs : []);
    } catch (err) {
      console.error('Error fetching bot logs:', err);
      setBotLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  // Close logs modal
  const closeLogsModal = () => {
    setShowLogsModal(false);
    setSelectedBot(null);
    setBotLogs([]);
  };

  // Format log level
  const getLogLevelIcon = (level: string) => {
    if (!level || typeof level !== 'string') {
      return <Activity size={14} color="var(--text-secondary)" />;
    }
    
    switch (level.toLowerCase()) {
      case 'error':
        return <AlertCircle size={14} color="#ff4444" />;
      case 'warn':
      case 'warning':
        return <AlertCircle size={14} color="#ffa500" />;
      case 'success':
        return <CheckCircle size={14} color="#00ff00" />;
      case 'info':
      default:
        return <Activity size={14} color="var(--text-secondary)" />;
    }
  };



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
          <div className="flex items-center gap-4">
            <h2>Available Agents ({filteredAgents.length})</h2>
            <div className="flex items-center gap-2">
              <div 
                className="animate-pulse" 
                style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%',
                  backgroundColor: 'var(--metallic-gold)'
                }}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Auto-refresh every 45s
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Last update: {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              className="btn btn-secondary"
              onClick={() => {
                setLoading(true);
                fetchAgents();
              }}
              disabled={loading}
            >
              <Activity size={16} />
              Refresh
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.href = '/#create'}
            >
              <Bot size={16} />
              Deploy New Agent
            </button>
          </div>
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
                      <div className="flex items-center gap-2">
                        <Clock size={12} style={{ color: 'var(--text-secondary)' }} />
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          Updated: {lastUpdate.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        className="btn btn-ghost"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => viewBotLogs(agent)}
                        title="View Logs"
                      >
                        <Eye size={14} />
                        Logs
                      </button>
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

      {/* Logs Modal */}
      {showLogsModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={closeLogsModal}
        >
          <div 
            className="card"
            style={{
              width: '90%',
              maxWidth: '800px',
              maxHeight: '80vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4" style={{ borderBottom: '1px solid var(--glass-border-dark)', paddingBottom: '16px' }}>
              <div>
                <h2 style={{ marginBottom: '4px' }}>📊 Bot Logs</h2>
                <p className="text-secondary" style={{ fontSize: '14px' }}>
                  {selectedBot?.name} ({selectedBot?.id})
                </p>
              </div>
              <button 
                className="btn btn-ghost"
                onClick={closeLogsModal}
                style={{ padding: '8px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Bot Status Summary */}
            {selectedBot && (
              <div className="mb-4 p-3 glass-dark rounded-lg">
                <div className="grid grid-3 gap-4" style={{ fontSize: '12px' }}>
                  <div>
                    <strong>Status:</strong>
                    <div className="flex items-center gap-2 mt-1">
                      <div 
                        style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%',
                          backgroundColor: selectedBot.isActive ? 'var(--metallic-gold)' : 'var(--text-secondary)'
                        }}
                      />
                      <span style={{ color: selectedBot.isActive ? 'var(--metallic-gold)' : 'var(--text-secondary)' }}>
                        {selectedBot.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <strong>Created:</strong>
                    <div style={{ marginTop: '2px' }}>
                      {new Date(selectedBot.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <strong>Trading Pair:</strong>
                    <div style={{ marginTop: '2px' }}>
                      {selectedBot.swapConfig?.originSymbol} → {selectedBot.swapConfig?.destinationSymbol}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Logs Content */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              {logsLoading ? (
                <div className="text-center py-8">
                  <Activity size={24} className="animate-spin" color="var(--metallic-gold)" />
                  <p className="text-secondary mt-2">Loading logs...</p>
                </div>
              ) : botLogs.length === 0 ? (
                <div className="text-center py-8">
                  <Clock size={24} color="var(--text-secondary)" />
                  <p className="text-secondary mt-2">No logs available yet</p>
                  <small className="text-secondary">Logs will appear here once the bot starts executing</small>
                </div>
              ) : (
                <div className="space-y-2">
                  {botLogs.map((log, index) => (
                    <div 
                      key={log.id || index} 
                      className="glass-dark rounded-lg p-3"
                      style={{ fontSize: '13px' }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getLogLevelIcon(log.level)}
                          <span 
                            style={{ 
                              color: !log.level ? 'var(--text-primary)' :
                                     log.level.toLowerCase() === 'error' ? '#ff4444' : 
                                     log.level.toLowerCase() === 'warn' ? '#ffa500' :
                                     log.level.toLowerCase() === 'success' ? '#00ff00' : 'var(--text-primary)',
                              fontWeight: '500',
                              textTransform: 'uppercase',
                              fontSize: '11px'
                            }}
                          >
                            {log.level || 'INFO'}
                          </span>
                        </div>
                        <span className="text-secondary" style={{ fontSize: '11px' }}>
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'No timestamp'}
                        </span>
                      </div>
                      <div style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>
                        {log.message || 'No message'}
                      </div>
                      {log.data && (
                        <details style={{ fontSize: '11px' }}>
                          <summary className="text-secondary cursor-pointer">Additional Data</summary>
                          <pre 
                            style={{ 
                              marginTop: '8px', 
                              padding: '8px', 
                              background: 'var(--bg-primary)', 
                              borderRadius: '4px',
                              overflow: 'auto',
                              fontSize: '10px'
                            }}
                          >
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center mt-4 pt-4" style={{ borderTop: '1px solid var(--glass-border-dark)' }}>
              <small className="text-secondary">
                Showing {botLogs.length} log entries
              </small>
              <button 
                className="btn btn-secondary"
                onClick={() => selectedBot && viewBotLogs(selectedBot)}
              >
                <Activity size={14} />
                Refresh Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
