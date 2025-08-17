import React, { useState, useEffect } from 'react';
import { Bot, Play, Pause, BarChart3, Zap, Trash2, Eye, Activity, X, Clock, CheckCircle, AlertCircle, Wallet, Copy, Check } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { backendApiService, type Bot as BackendBot, type BotLog } from '../../lib/backendApi';
import { combinedPortfolioService, type EnhancedWalletPortfolio } from '../../lib/combinedPortfolioService';
import { mobulaApiService } from '../../lib/mobulaApi';

export const Agents: React.FC = () => {
  const { user } = usePrivy();
  const [agents, setAgents] = useState<BackendBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBot, setSelectedBot] = useState<BackendBot | null>(null);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [botLogs, setBotLogs] = useState<BotLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [portfolios, setPortfolios] = useState<Record<string, EnhancedWalletPortfolio>>({});
  const [portfolioLoading, setPortfolioLoading] = useState<Record<string, boolean>>({});
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [copiedAddresses, setCopiedAddresses] = useState<Record<string, boolean>>({});

  const fetchUserAgents = async () => {
    if (!user) {
      setError('Please log in to view your agents');
      setLoading(false);
      return;
    }

    const userWallet = user.wallet?.address || '';
    if (!userWallet) {
      setError('Unable to identify user wallet. Please try logging in again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userAgents = await backendApiService.getBotsByUserWallet(userWallet);
      
      // Ensure we have a valid array
      if (Array.isArray(userAgents)) {
        setAgents(userAgents);
        setLastUpdate(new Date());
        
        // Fetch portfolios for each agent
        userAgents.forEach(agent => {
          if (agent.swapConfig?.senderAddress) {
            fetchPortfolio(agent.swapConfig.senderAddress);
          }
        });
      } else {
        console.warn('API returned non-array data:', userAgents);
        setAgents([]);
        setError('Received invalid data format from server.');
      }
    } catch (err) {
      console.error('Error fetching user agents:', err);
      setError('Failed to load your agents. Please try again.');
      setAgents([]); // Ensure agents is always an array
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAgents();
    
    // Set up real-time refresh every 30 seconds
    const interval = setInterval(() => {
      if (user) {
        fetchUserAgents();
      }
    }, 30000); // 30 seconds

    // Cleanup interval on unmount
    return () => {
      clearInterval(interval);
    };
  }, [user]);

  const fetchPortfolio = async (walletAddress: string) => {
    if (portfolios[walletAddress] || portfolioLoading[walletAddress]) {
      return; // Already loaded or loading
    }

    setPortfolioLoading(prev => ({ ...prev, [walletAddress]: true }));

    try {
      const portfolio = await combinedPortfolioService.getEnhancedPortfolio(walletAddress, {
        useMobula: true,
        useTheGraph: true,
        networks: ['mainnet', 'arbitrum-one', 'avalanche', 'base', 'bsc', 'matic', 'optimism'],
        cache: true,
        stale: 3600 // 1 hour cache
      });
      
      setPortfolios(prev => ({ ...prev, [walletAddress]: portfolio }));
    } catch (err) {
      console.error(`Error fetching portfolio for ${walletAddress}:`, err);
    } finally {
      setPortfolioLoading(prev => ({ ...prev, [walletAddress]: false }));
    }
  };

  const getStatusColor = (agent: BackendBot) => {
    return agent.isActive ? 'var(--metallic-gold)' : 'var(--text-secondary)';
  };

  const getStatusText = (agent: BackendBot) => {
    return agent.isActive ? 'Active' : 'Inactive';
  };

  const getStatusIcon = (agent: BackendBot) => {
    return agent.isActive ? Play : Pause;
  };

  // Toggle agent active status
  const toggleAgentStatus = async (agent: BackendBot) => {
    try {
      if (agent.isActive) {
        await backendApiService.deactivateBot(agent.id);
      } else {
        await backendApiService.activateBot(agent.id);
      }
      
      // Refresh the agents list
      const userWallet = user?.wallet?.address || '';
      if (userWallet) {
        const updatedAgents = await backendApiService.getBotsByUserWallet(userWallet);
        if (Array.isArray(updatedAgents)) {
          setAgents(updatedAgents);
        } else {
          console.warn('Toggle: API returned non-array data:', updatedAgents);
          setAgents([]);
        }
      }
    } catch (err) {
      console.error('Error toggling agent status:', err);
      setError('Failed to update agent status. Please try again.');
    }
  };

  // Delete agent
  const deleteAgent = async (agent: BackendBot) => {
    if (!confirm(`Are you sure you want to delete "${agent.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await backendApiService.deleteBot(agent.id);
      
      // Refresh the agents list
      const userWallet = user?.wallet?.address || '';
      if (userWallet) {
        const updatedAgents = await backendApiService.getBotsByUserWallet(userWallet);
        setAgents(updatedAgents);
      }
    } catch (err) {
      console.error('Error deleting agent:', err);
      setError('Failed to delete agent. Please try again.');
    }
  };

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

  // Refresh bot status
  const refreshBotStatus = async (botId: string) => {
    try {
      const updatedBot = await backendApiService.getBotById(botId);
      setAgents(prevAgents => 
        prevAgents.map(agent => 
          agent.id === botId ? updatedBot : agent
        )
      );
    } catch (err) {
      console.error('Error refreshing bot status:', err);
    }
  };

  // Copy wallet address to clipboard
  const copyWalletAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddresses(prev => ({ ...prev, [address]: true }));
      setTimeout(() => {
        setCopiedAddresses(prev => ({ ...prev, [address]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
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
        <h1 className="metallic-text mb-4">My Agents</h1>
        <p className="text-secondary" style={{ fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
          Monitor and manage your AI agents. Track performance, adjust settings, and optimize your strategies.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-3 mb-8">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="metallic-gradient rounded-lg" style={{ padding: '12px' }}>
              <Bot size={24} color="var(--bg-primary)" />
            </div>
            <div>
              <h3>{Array.isArray(agents) ? agents.length : 0}</h3>
              <p className="text-secondary">Total Agents</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="metallic-gradient rounded-lg" style={{ padding: '12px' }}>
              <BarChart3 size={24} color="var(--bg-primary)" />
            </div>
            <div>
              <h3 className="metallic-text">{Array.isArray(agents) ? agents.filter(agent => agent.isActive).length : 0}</h3>
              <p className="text-secondary">Active Agents</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="metallic-gradient rounded-lg" style={{ padding: '12px' }}>
              <Zap size={24} color="var(--bg-primary)" />
            </div>
            <div>
              <h3>{Array.isArray(agents) ? agents.filter(agent => !agent.isActive).length : 0}</h3>
              <p className="text-secondary">Inactive Agents</p>
            </div>
          </div>
        </div>
      </div>

      {/* Agent List */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h2>Your Agents ({Array.isArray(agents) ? agents.length : 0})</h2>
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
                Auto-refresh every 30s
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Last update: {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              className="btn btn-secondary"
              onClick={fetchUserAgents}
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
            <p className="text-secondary">Loading your agents...</p>
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
        ) : !Array.isArray(agents) || agents.length === 0 ? (
          <div className="text-center py-12">
            <div className="card">
              <Bot size={48} color="var(--text-secondary)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ marginBottom: '8px' }}>No Agents Found</h3>
              <p className="text-secondary" style={{ marginBottom: '16px' }}>
                You haven't created any agents yet. Create your first agent to get started.
              </p>
              <button className="btn btn-primary">
                <Bot size={16} />
                Create First Agent
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6">
            {Array.isArray(agents) && agents.map((agent) => {
              const StatusIcon = getStatusIcon(agent);
              return (
                <div key={agent.id} className="card">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div 
                        className="glass rounded-lg" 
                        style={{ 
                          padding: '12px',
                          border: `2px solid ${getStatusColor(agent)}`
                        }}
                      >
                        <Bot size={24} color={getStatusColor(agent)} />
                      </div>
                      <div>
                        <h3 className="card-title">{agent.name || 'Unnamed Agent'}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <StatusIcon size={12} color={getStatusColor(agent)} />
                          <span 
                            style={{ 
                              fontSize: '12px', 
                              color: getStatusColor(agent),
                              textTransform: 'capitalize'
                            }}
                          >
                            {getStatusText(agent)}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            • Created: {new Date(agent.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        className="btn btn-ghost" 
                        style={{ padding: '8px' }}
                        onClick={() => viewBotLogs(agent)}
                        title="View Logs"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="btn btn-ghost" 
                        style={{ padding: '8px' }}
                        onClick={() => agent.swapConfig?.senderAddress && fetchPortfolio(agent.swapConfig.senderAddress)}
                        title="Refresh Portfolio"
                        disabled={!agent.swapConfig?.senderAddress || portfolioLoading[agent.swapConfig?.senderAddress || '']}
                      >
                        <Wallet size={16} />
                      </button>
                      <button 
                        className="btn btn-ghost" 
                        style={{ padding: '8px' }}
                        onClick={() => refreshBotStatus(agent.id)}
                        title="Refresh Status"
                      >
                        <Activity size={16} />
                      </button>
                      <button 
                        className="btn btn-ghost" 
                        style={{ padding: '8px' }}
                        onClick={() => toggleAgentStatus(agent)}
                        title={agent.isActive ? 'Deactivate Agent' : 'Activate Agent'}
                      >
                        {agent.isActive ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                      <button 
                        className="btn btn-ghost" 
                        style={{ padding: '8px', color: '#ff4444' }}
                        onClick={() => deleteAgent(agent)}
                        title="Delete Agent"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Agent Configuration Display */}
                  <div className="mb-4">
                    <div className="glass-dark rounded-lg p-4">
                      <h4 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--metallic-gold)' }}>
                        Configuration
                      </h4>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <div className="grid gap-3">
                          {/* AI Prompt */}
                          {agent.prompt && (
                            <div>
                              <strong>AI Prompt:</strong> 
                              <div style={{ marginTop: '4px', color: 'var(--text-primary)' }}>
                                {agent.prompt}
                              </div>
                            </div>
                          )}
                          
                          {/* Trading Configuration */}
                          {agent.swapConfig && (
                            <div>
                              <strong>Trading Configuration:</strong>
                              <div className="grid grid-2 gap-2 mt-2">
                                <div>🔄 {agent.swapConfig.originSymbol} → {agent.swapConfig.destinationSymbol}</div>
                                <div>💰 Amount: {agent.swapConfig.amount}</div>
                                <div>🌐 Network: {agent.swapConfig.originBlockchain}</div>
                                <div>📍 Wallet: {agent.swapConfig.senderAddress.slice(0, 6)}...{agent.swapConfig.senderAddress.slice(-4)}</div>
                              </div>
                            </div>
                          )}
                          
                          {/* Status */}
                          <div>
                            <strong>Status:</strong> 
                            <span style={{ color: agent.isActive ? '#00ff00' : '#ffa500', marginLeft: '8px' }}>
                              {agent.isActive ? '🟢 Active' : '🟡 Inactive'}
                            </span>
                          </div>
                          
                          {/* Real-time Info */}
                          <div>
                            <strong>Last Updated:</strong> 
                            <span style={{ color: 'var(--text-secondary)', marginLeft: '8px', fontSize: '11px' }}>
                              {lastUpdate.toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Portfolio Section */}
                  {(() => {
                    const walletAddress = agent.swapConfig?.senderAddress;
                    const portfolio = walletAddress ? portfolios[walletAddress] : null;
                    const isLoadingPortfolio = walletAddress ? portfolioLoading[walletAddress] : false;

                    return (
                      <div className="mb-4">
                        <div className="glass-dark rounded-lg p-4">
                          <h4 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--metallic-gold)' }}>
                            💼 Wallet Portfolio
                          </h4>
                          {!walletAddress ? (
                            <p className="text-secondary" style={{ fontSize: '12px' }}>
                              No wallet address configured
                            </p>
                          ) : isLoadingPortfolio ? (
                            <div className="text-center">
                              <div className="animate-spin inline-block">⏳</div>
                              <p className="text-secondary" style={{ fontSize: '12px', marginTop: '4px' }}>
                                Loading portfolio...
                              </p>
                            </div>
                          ) : portfolio ? (
                            <div>
                              <div className="grid grid-3 gap-4 mb-3">
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
                                <div>
                                  <div className="text-secondary" style={{ fontSize: '11px' }}>Assets</div>
                                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                                    {portfolio.assets?.length || 0}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Top Assets */}
                              {portfolio.assets && portfolio.assets.length > 0 && (
                                <div>
                                  <div className="text-secondary" style={{ fontSize: '11px', marginBottom: '6px' }}>Top Holdings</div>
                                  <div className="space-y-2">
                                    {portfolio.assets.slice(0, 4).map((asset, index) => (
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
                                          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                                            ({(asset.allocation || 0).toFixed(1)}%)
                                          </span>
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
                            <div>
                              <p className="text-secondary" style={{ fontSize: '12px', marginBottom: '8px' }}>
                                Portfolio data unavailable
                              </p>
                              <button 
                                className="btn btn-ghost" 
                                style={{ padding: '4px 8px', fontSize: '11px' }}
                                onClick={() => fetchPortfolio(walletAddress)}
                              >
                                Load Portfolio
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Agent Wallet Info */}
                  <div className="grid grid-2 gap-4">
                    <div className="glass-dark rounded-lg p-4">
                      <div className="text-secondary mb-2" style={{ fontSize: '12px' }}>
                        Wallet Address
                      </div>
                      <div className="flex items-center gap-2">
                        <div style={{ fontSize: '14px', fontFamily: 'monospace' }}>
                          {agent.swapConfig?.senderAddress ? 
                            `${agent.swapConfig.senderAddress.slice(0, 6)}...${agent.swapConfig.senderAddress.slice(-4)}` : 
                            'Not configured'
                          }
                        </div>
                        {agent.swapConfig?.senderAddress && (
                          <button
                            className="btn btn-ghost"
                            style={{ padding: '4px' }}
                            onClick={() => copyWalletAddress(agent.swapConfig.senderAddress)}
                            title="Copy wallet address"
                          >
                            {copiedAddresses[agent.swapConfig.senderAddress] ? (
                              <Check size={14} color="#00ff00" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="glass-dark rounded-lg p-4">
                      <div className="text-secondary mb-2" style={{ fontSize: '12px' }}>
                        Status
                      </div>
                      <div className="flex items-center gap-2">
                        <div 
                          style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '50%',
                            backgroundColor: getStatusColor(agent)
                          }}
                        />
                        <span style={{ fontSize: '14px', color: getStatusColor(agent) }}>
                          {getStatusText(agent)}
                        </span>
                      </div>
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