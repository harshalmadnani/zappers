import React, { useState, useEffect } from 'react';
import { Bot, Play, Pause, Settings, BarChart3, Zap, ExternalLink } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { agentService } from '../../lib/supabase';
import type { Agent } from '../../types/database';

export const Agents: React.FC = () => {
  const { user } = usePrivy();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
        const userAgents = await agentService.getAgentsByUserWallet(userWallet);
        setAgents(userAgents);
      } catch (err) {
        console.error('Error fetching user agents:', err);
        setError('Failed to load your agents. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAgents();
  }, [user]);

  const getStatusColor = (agent: Agent) => {
    return agent.public_key ? 'var(--metallic-gold)' : 'var(--text-secondary)';
  };

  const getStatusText = (agent: Agent) => {
    return agent.public_key ? 'Active' : 'Inactive';
  };

  const getStatusIcon = (agent: Agent) => {
    return agent.public_key ? Play : Pause;
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
              <h3>{agents.length}</h3>
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
              <h3 className="metallic-text">{agents.filter(agent => agent.public_key).length}</h3>
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
              <h3>{agents.filter(agent => !agent.public_key).length}</h3>
              <p className="text-secondary">Inactive Agents</p>
            </div>
          </div>
        </div>
      </div>

      {/* Agent List */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2>Your Agents ({agents.length})</h2>
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
        ) : agents.length === 0 ? (
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
            {agents.map((agent) => {
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
                        <h3 className="card-title">{agent.agent_name || 'Unnamed Agent'}</h3>
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
                            • Created: {new Date(agent.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button className="btn btn-ghost" style={{ padding: '8px' }}>
                        <Settings size={16} />
                      </button>
                      {agent.agent_deployed_link && (
                        <a
                          href={agent.agent_deployed_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost"
                          style={{ padding: '8px' }}
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Agent Configuration Display */}
                  {agent.agent_configuration && (
                    <div className="mb-4">
                      <div className="glass-dark rounded-lg p-4">
                        <h4 style={{ fontSize: '14px', marginBottom: '8px', color: 'var(--metallic-gold)' }}>
                          Configuration
                        </h4>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {(() => {
                            try {
                              const config = JSON.parse(agent.agent_configuration);
                              return (
                                <div className="grid gap-3">
                                  {/* Handle both old and new configuration formats */}
                                  {config.prompt && (
                                    <div>
                                      <strong>AI Prompt:</strong> 
                                      <div style={{ marginTop: '4px', color: 'var(--text-primary)' }}>
                                        {config.prompt}
                                      </div>
                                    </div>
                                  )}
                                  {config.description && (
                                    <div><strong>Description:</strong> {config.description}</div>
                                  )}
                                  {config.swapConfig && (
                                    <div>
                                      <strong>Trading Configuration:</strong>
                                      <div className="grid grid-2 gap-2 mt-2">
                                        <div>🔄 {config.swapConfig.originSymbol} → {config.swapConfig.destinationSymbol}</div>
                                        <div>💰 Amount: {config.swapConfig.amount}</div>
                                        <div>🌐 Network: {config.swapConfig.originBlockchain}</div>
                                        <div>🧪 Mode: {config.swapConfig.isTest ? 'Test' : 'Live'}</div>
                                      </div>
                                    </div>
                                  )}
                                  {config.network && !config.swapConfig && (
                                    <div><strong>Network:</strong> {config.network}</div>
                                  )}
                                  {config.strategy && !config.swapConfig && (
                                    <div><strong>Strategy:</strong> {config.strategy}</div>
                                  )}
                                  {config.isActive !== undefined && (
                                    <div>
                                      <strong>Status:</strong> 
                                      <span style={{ color: config.isActive ? '#00ff00' : '#ffa500', marginLeft: '8px' }}>
                                        {config.isActive ? '🟢 Active' : '🟡 Inactive'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            } catch {
                              const configStr = agent.agent_configuration || '';
                              return <div>{configStr.slice(0, 200)}...</div>;
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Agent Wallet Info */}
                  <div className="grid grid-2 gap-4">
                    <div className="glass-dark rounded-lg p-4">
                      <div className="text-secondary mb-2" style={{ fontSize: '12px' }}>
                        Public Key
                      </div>
                      <div style={{ fontSize: '14px', fontFamily: 'monospace' }}>
                        {agent.public_key ? 
                          `${agent.public_key.slice(0, 6)}...${agent.public_key.slice(-4)}` : 
                          'Not generated'
                        }
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
    </div>
  );
};