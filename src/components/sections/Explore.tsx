import React, { useState, useEffect } from 'react';
import { Search, ExternalLink, Bot } from 'lucide-react';
import { agentService } from '../../lib/supabase';
import type { Agent } from '../../types/database';

export const Explore: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true);
        const fetchedAgents = await agentService.getAllAgents();
        setAgents(fetchedAgents);
        setError(null);
      } catch (err) {
        console.error('Error fetching agents:', err);
        setError('Failed to load agents. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  const filteredAgents = agents.filter(agent => 
    agent.agent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.user_wallet?.toLowerCase().includes(searchTerm.toLowerCase())
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
            {filteredAgents.map((agent) => (
              <div key={agent.id} className="card">
                <div className="card-header">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="card-title">{agent.agent_name || 'Unnamed Agent'}</h3>
                      <span 
                        className="metallic-text" 
                        style={{ fontSize: '12px', fontWeight: '500' }}
                      >
                        by {agent.user_wallet ? `${agent.user_wallet.slice(0, 6)}...${agent.user_wallet.slice(-4)}` : 'Anonymous'}
                      </span>
                    </div>
                    <div className="text-right">
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {new Date(agent.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  {agent.agent_configuration && (
                    <div className="card-description">
                      {(() => {
                        const configStr = agent.agent_configuration;
                        if (!configStr) return 'No configuration available';
                        
                        try {
                          const config = JSON.parse(configStr);
                          // Handle both old and new configuration formats
                          if (config.prompt) {
                            return (
                              <div>
                                <p style={{ marginBottom: '8px' }}>{config.prompt}</p>
                                {config.swapConfig && (
                                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    <span>🔄 {config.swapConfig.originSymbol} → {config.swapConfig.destinationSymbol}</span>
                                    <span style={{ marginLeft: '12px' }}>💰 {config.swapConfig.amount}</span>
                                    <span style={{ marginLeft: '12px' }}>🌐 {config.swapConfig.originBlockchain}</span>
                                  </div>
                                )}
                              </div>
                            );
                          } else if (config.description) {
                            return config.description;
                          } else {
                            return 'No description available';
                          }
                        } catch {
                          return configStr.slice(0, 100) + '...';
                        }
                      })()}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Bot size={16} color="var(--metallic-gold)" />
                      <span className="text-secondary" style={{ fontSize: '14px' }}>
                        {(() => {
                          if (!agent.agent_configuration) return agent.public_key ? 'Active' : 'Inactive';
                          
                          try {
                            const config = JSON.parse(agent.agent_configuration);
                            if (config.isActive !== undefined) {
                              return config.isActive ? 'Active' : 'Inactive';
                            }
                          } catch {}
                          return agent.public_key ? 'Active' : 'Inactive';
                        })()}
                      </span>
                    </div>
                    {(() => {
                      if (!agent.agent_configuration) return null;
                      
                      try {
                        const config = JSON.parse(agent.agent_configuration);
                        if (config.swapConfig && config.swapConfig.isTest !== undefined) {
                          return (
                            <span style={{ fontSize: '12px', color: config.swapConfig.isTest ? '#ffa500' : '#00ff00' }}>
                              {config.swapConfig.isTest ? '🧪 Test Mode' : '🚀 Live Mode'}
                            </span>
                          );
                        }
                      } catch {}
                      return null;
                    })()}
                  </div>
                  <div className="flex gap-2">
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
                    <button className="btn btn-secondary">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
