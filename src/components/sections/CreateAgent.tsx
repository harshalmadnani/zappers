import React, { useState, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import QRCode from 'react-qr-code';
import { usePrivy } from '@privy-io/react-auth';
import { Wallet, Copy, RefreshCw, Zap, Save } from 'lucide-react';
import { backendApiService } from '../../lib/backendApi';
import { NETWORKS, getTokensForChain, POPULAR_NETWORKS } from '../../constants/chains';

interface WalletInfo {
  address: string;
  privateKey: string;
  mnemonic: string;
}

export const CreateAgent: React.FC = () => {
  const { user } = usePrivy();
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [agentConfig, setAgentConfig] = useState({
    name: '',
    description: '',
    network: 'ARBITRUM',
    strategy: 'DCA',
    customStrategy: '',
    customPrompt: '',
    originSymbol: 'USDC',
    destinationSymbol: 'ETH',
    amount: '',
    interval: '60', // minutes
    slippageTolerance: '10', // percentage as string
    isTest: true
  });

  // Get available tokens for the selected network
  const availableTokens = useMemo(() => {
    const selectedNetwork = NETWORKS[agentConfig.network as keyof typeof NETWORKS];
    if (!selectedNetwork) return [];
    return getTokensForChain(selectedNetwork.chainId);
  }, [agentConfig.network]);

  // Example templates for quick setup
  const exampleTemplates = [
    {
      id: 'simple-katana',
      name: '🚀 Simple Katana Bot',
      description: 'Katana USDC → ETH swap',
      icon: '⚡',
      config: {
        name: 'Simple Katana USDC-ETH Bot',
        description: 'Simple bot that swaps USDC for ETH on Katana',
        network: 'KATANA',
        customPrompt: 'Simple bot that swaps 2 USDC for ETH on Katana every time the price is favorable',
        originSymbol: 'USDC',
        destinationSymbol: 'ETH',
        amount: '2',
        strategy: 'DCA',
        interval: '60',
        slippageTolerance: '10',
        isTest: true
      }
    },
    {
      id: 'cross-chain',
      name: '🌉 Cross-Chain Bot',
      description: 'Arbitrum → Base bridge trading',
      icon: '🔗',
      config: {
        name: 'Cross-Chain ARB-BASE Bot',
        description: 'Cross-chain bot that optimizes trades between Arbitrum and Base',
        network: 'ARBITRUM',
        customPrompt: 'Cross-chain bot that swaps USDC from Arbitrum to ETH on Base when arbitrage opportunities arise. Monitor both chains for best prices.',
        originSymbol: 'USDC',
        destinationSymbol: 'ETH',
        amount: '5',
        strategy: 'ARBITRAGE',
        interval: '30',
        slippageTolerance: '15',
        isTest: true
      }
    },
    {
      id: 'cross-chain-katana',
      name: '⚔️ Cross-Chain ARB → Katana',
      description: 'Arbitrum to Katana cross-chain trading',
      icon: '🌐',
      config: {
        name: 'CROSS-CHAIN-ARB-TO-KATANA-BOT',
        description: 'Cross-chain trading bot that swaps USDC from Arbitrum to ETH on Katana',
        network: 'ARBITRUM',
        customPrompt: 'Cross-chain trading bot that swaps 5 USDC from Arbitrum to ETH on Katana - REAL CROSS-CHAIN TRADING',
        originSymbol: 'USDC',
        destinationSymbol: 'ETH',
        amount: '5',
        strategy: 'CUSTOM',
        customStrategy: 'cross_chain_arbitrage',
        interval: '45',
        slippageTolerance: '15',
        isTest: false
      }
    },
    {
      id: 'cross-chain-zircuit',
      name: '🔷 Cross-Chain ARB → Zircuit',
      description: 'Arbitrum to Zircuit L2 trading',
      icon: '⚡',
      config: {
        name: 'CROSS-CHAIN-ARB-TO-ZIRCUIT-BOT',
        description: 'Cross-chain trading bot that swaps USDC from Arbitrum to ETH on Zircuit L2',
        network: 'ARBITRUM',
        customPrompt: 'Cross-chain trading bot that swaps 7 USDC from Arbitrum to ETH on Zircuit L2 - REAL CROSS-CHAIN TRADING',
        originSymbol: 'USDC',
        destinationSymbol: 'ETH',
        amount: '7',
        strategy: 'CUSTOM',
        customStrategy: 'cross_chain_l2_arbitrage',
        interval: '35',
        slippageTolerance: '12',
        isTest: false
      }
    },
    {
      id: 'cross-chain-flow',
      name: '🌊 Cross-Chain ARB → Flow EVM',
      description: 'Arbitrum to Flow EVM trading',
      icon: '💎',
      config: {
        name: 'CROSS-CHAIN-ARB-TO-FLOW-EVM-BOT',
        description: 'Cross-chain trading bot that swaps USDC from Arbitrum to FLOW tokens on Flow EVM',
        network: 'ARBITRUM',
        customPrompt: 'Cross-chain trading bot that swaps 6 USDC from Arbitrum to FLOW tokens on Flow EVM - REAL CROSS-CHAIN TRADING',
        originSymbol: 'USDC',
        destinationSymbol: 'FLOW',
        amount: '6',
        strategy: 'CUSTOM',
        customStrategy: 'cross_chain_emerging_network',
        interval: '40',
        slippageTolerance: '20',
        isTest: false
      }
    },
    {
      id: 'dca-flow',
      name: '💎 Flow DCA Bot',
      description: 'Dollar-cost average into FLOW',
      icon: '🌊',
      config: {
        name: 'Flow DCA Bot',
        description: 'DCA bot for accumulating FLOW tokens',
        network: 'FLOW_EVM',
        customPrompt: 'DCA bot that buys FLOW tokens with USDC every hour, investing 10 USDC per trade regardless of price to build a long-term position',
        originSymbol: 'USDC',
        destinationSymbol: 'FLOW',
        amount: '10',
        strategy: 'DCA',
        interval: '60',
        slippageTolerance: '12',
        isTest: true
      }
    },
    {
      id: 'momentum-base',
      name: '📈 Momentum Trading Bot',
      description: 'Base network momentum strategy',
      icon: '🚀',
      config: {
        name: 'Base Momentum Bot',
        description: 'Advanced momentum trading on Base network',
        network: 'BASE',
        customPrompt: 'Advanced momentum trading bot that buys ETH when price increases 3% in 15 minutes and sells when it drops 2% or gains 5%. Use 50 USDC per trade with tight risk management.',
        originSymbol: 'USDC',
        destinationSymbol: 'ETH',
        amount: '50',
        strategy: 'MOMENTUM',
        interval: '15',
        slippageTolerance: '8',
        isTest: true
      }
    },
    {
      id: 'range-polygon',
      name: '📊 Range Trading Bot',
      description: 'Polygon range trading strategy',
      icon: '📐',
      config: {
        name: 'Polygon Range Bot',
        description: 'Range trading bot for sideways markets',
        network: 'POLYGON',
        customPrompt: 'Range trading bot that buys POL when price drops to support level around $0.40 and sells at resistance around $0.50. Use 100 USDC per trade.',
        originSymbol: 'USDC',
        destinationSymbol: 'POL',
        amount: '100',
        strategy: 'RANGE',
        interval: '120',
        slippageTolerance: '10',
        isTest: true
      }
    },
    {
      id: 'custom-advanced',
      name: '🧠 Custom AI Strategy',
      description: 'Let AI decide everything',
      icon: '🤖',
      config: {
        name: 'AI-Powered Custom Bot',
        description: 'Fully AI-driven trading strategy',
        network: 'ARBITRUM',
        customPrompt: 'You are an advanced AI trading bot. Analyze market conditions, choose the best tokens, amounts, and timing for profitable trades. Be conservative but opportunistic. Start with small amounts and scale up successful strategies.',
        originSymbol: 'USDC',
        destinationSymbol: 'ETH',
        amount: '25',
        strategy: 'CUSTOM',
        customStrategy: 'AI-driven adaptive strategy based on market analysis',
        interval: '45',
        slippageTolerance: '12',
        isTest: true
      }
    }
  ];

  // Function to apply a template
  const applyTemplate = useCallback((template: typeof exampleTemplates[0]) => {
    setAgentConfig({
      ...agentConfig,
      ...template.config
    });
    setSuccess(`✨ Applied template: ${template.name}`);
    setTimeout(() => setSuccess(''), 3000);
  }, [agentConfig]);

  // Generate new EVM wallet
  const generateWallet = useCallback(() => {
    try {
      setLoading(true);
      const newWallet = ethers.Wallet.createRandom();
      setWallet({
        address: newWallet.address,
        privateKey: newWallet.privateKey,
        mnemonic: newWallet.mnemonic?.phrase || 'Generated from private key'
      });
      setError('');
      setSuccess('New EVM wallet generated successfully! This wallet works across all EVM chains including Flow EVM.');
    } catch (err) {
      setError('Failed to generate wallet: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Import existing wallet
  const importWallet = useCallback((privateKeyOrMnemonic: string) => {
    try {
      setLoading(true);
      let newWallet: ethers.HDNodeWallet | ethers.Wallet;
      
      if (privateKeyOrMnemonic.includes(' ')) {
        // It's a mnemonic
        newWallet = ethers.Wallet.fromPhrase(privateKeyOrMnemonic);
      } else {
        // It's a private key
        newWallet = new ethers.Wallet(privateKeyOrMnemonic);
      }
      
      setWallet({
        address: newWallet.address,
        privateKey: newWallet.privateKey,
        mnemonic: 'mnemonic' in newWallet && newWallet.mnemonic ? newWallet.mnemonic.phrase : 'Imported from private key'
      });
      setError('');
      setSuccess('Wallet imported successfully!');
    } catch (err) {
      setError('Failed to import wallet: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Copy to clipboard
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setSuccess('Copied to clipboard!');
      setTimeout(() => setSuccess(''), 2000);
    });
  }, []);

  // Deploy agent
  const deployAgent = useCallback(async () => {
    if (!wallet || !user) {
      setError('Please generate a wallet and ensure you are logged in');
      return;
    }

    const userWallet = user.wallet?.address || '';
    if (!userWallet) {
      setError('Unable to identify user wallet. Please try logging in again.');
      return;
    }

    if (!agentConfig.name) {
      setError('Please provide an agent name');
      return;
    }

    if (!agentConfig.customPrompt) {
      setError('Please provide a custom prompt for the AI to understand what you want');
      return;
    }

    if (!agentConfig.amount) {
      setError('Please provide an amount for trading');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const selectedNetwork = NETWORKS[agentConfig.network as keyof typeof NETWORKS];
      
      const botData = {
        name: agentConfig.name,
        prompt: agentConfig.customPrompt,
        userWallet: userWallet,
        swapConfig: {
          senderAddress: wallet.address,
          senderPrivateKey: wallet.privateKey,
          recipientAddress: wallet.address, // Same as sender for most cases
          originSymbol: agentConfig.originSymbol,
          destinationSymbol: agentConfig.destinationSymbol,
          amount: agentConfig.amount,
          originBlockchain: selectedNetwork.apiName,
          destinationBlockchain: (() => {
            // For cross-chain bots, determine destination blockchain from strategy
            if (agentConfig.strategy === 'CUSTOM' && agentConfig.customStrategy?.includes('cross_chain')) {
              if (agentConfig.customStrategy.includes('katana')) return 'katana';
              if (agentConfig.customStrategy.includes('zircuit')) return 'zircuit';
              if (agentConfig.customStrategy.includes('flow') || agentConfig.customStrategy.includes('emerging_network')) return 'flow-evm';
            }
            return selectedNetwork.apiName; // Same network for regular bots
          })(),
          slippageTolerance: agentConfig.slippageTolerance,
          // Add cross-chain specific fields if this is a custom strategy
          ...(agentConfig.strategy === 'CUSTOM' && agentConfig.customStrategy?.includes('cross_chain') && {
            crossChain: true,
            strategy: agentConfig.customStrategy
          }),
          isTest: agentConfig.isTest,
        }
      };

      await backendApiService.createBot(botData);
      setSuccess(`Agent "${agentConfig.name}" created and deployed successfully!`);
      
      // Reset form
      setWallet(null);
      setAgentConfig({
        name: '',
        description: '',
        network: 'ARBITRUM',
        strategy: 'DCA',
        customStrategy: '',
        customPrompt: '',
        originSymbol: 'USDC',
        destinationSymbol: 'ETH',
        amount: '',
        interval: '60',
        slippageTolerance: '10',
        isTest: true
      });
    } catch (err) {
      setError('Failed to create agent: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [wallet, user?.wallet?.address, agentConfig]);

  const renderWalletStep = () => (
    <div className="step-container">
      <div className="text-center mb-8">
        <h2 className="metallic-text mb-4">🔐 Step 1: Generate EVM Wallet</h2>
        <p className="text-secondary">
          Create a new EVM wallet that works across all supported networks including Flow EVM, 
          or import an existing one.
        </p>
      </div>
      
      <div className="grid grid-2 gap-6 mb-8">
        <div className="card">
          <h3 className="mb-4">Generate New Wallet</h3>
          <p className="text-secondary mb-4" style={{ fontSize: '14px' }}>
            Create a brand new EVM wallet with a secure random private key and mnemonic phrase.
          </p>
          <button 
            onClick={generateWallet} 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />}
            Generate New Wallet
          </button>
        </div>

        <div className="card">
          <h3 className="mb-4">Import Existing Wallet</h3>
          <p className="text-secondary mb-4" style={{ fontSize: '14px' }}>
            Import your existing wallet using a private key or mnemonic phrase.
          </p>
          <input
            type="password"
            placeholder="Enter private key or mnemonic phrase"
            className="mb-4"
            style={{
              width: '100%',
              padding: '12px',
              background: 'var(--glass-bg-dark)',
              border: '1px solid var(--glass-border-dark)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '14px'
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                importWallet(e.currentTarget.value.trim());
                e.currentTarget.value = '';
              }
            }}
          />
          <small className="text-secondary">Press Enter to import</small>
        </div>
      </div>

      {wallet && (
        <div className="card">
          <div className="flex items-center gap-4 mb-6">
            <div className="metallic-gradient rounded-lg" style={{ padding: '12px' }}>
              <Wallet size={24} color="var(--bg-primary)" />
            </div>
            <div>
              <h3>✅ Wallet Generated Successfully!</h3>
              <p className="text-secondary">Your multi-chain EVM wallet is ready</p>
            </div>
          </div>

          <div className="grid gap-4 mb-6">
            <div className="glass-dark rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-secondary" style={{ fontSize: '12px' }}>
                  📍 Wallet Address (Public Key)
                </label>
                <button 
                  onClick={() => copyToClipboard(wallet.address)}
                  className="btn btn-ghost"
                  style={{ padding: '4px 8px' }}
                >
                  <Copy size={14} />
                </button>
              </div>
              <code style={{ fontSize: '14px', wordBreak: 'break-all' }}>
                {wallet.address}
              </code>
            </div>
            
            <div className="glass-dark rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-secondary" style={{ fontSize: '12px' }}>
                  🔑 Private Key (Keep Secret!)
                </label>
                <button 
                  onClick={() => copyToClipboard(wallet.privateKey)}
                  className="btn btn-ghost"
                  style={{ padding: '4px 8px' }}
                >
                  <Copy size={14} />
                </button>
              </div>
              <code style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                {wallet.privateKey}
              </code>
            </div>

            <div className="glass-dark rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-secondary" style={{ fontSize: '12px' }}>
                  🔤 Mnemonic Phrase (Keep Secret!)
                </label>
                <button 
                  onClick={() => copyToClipboard(wallet.mnemonic)}
                  className="btn btn-ghost"
                  style={{ padding: '4px 8px' }}
                >
                  <Copy size={14} />
                </button>
              </div>
              <code style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                {wallet.mnemonic}
              </code>
            </div>
          </div>

          <div className="grid grid-2 gap-6">
            <div>
              <h4 className="mb-4">📱 QR Code</h4>
              <div className="flex justify-center">
                <QRCode 
                  value={wallet.address} 
                  size={150}
                  bgColor="#000000"
                  fgColor="#ffffff"
                />
              </div>
            </div>

            <div>
              <h4 className="mb-4">🌐 Supported Networks</h4>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                <div className="grid gap-2">
                  {POPULAR_NETWORKS.map((networkKey) => {
                    const network = NETWORKS[networkKey];
                    return (
                      <div key={networkKey} className="flex items-center gap-3">
                        <div 
                          style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '50%',
                            backgroundColor: 'var(--metallic-gold)'
                          }}
                        />
                        <span style={{ fontSize: '14px' }}>
                          {network.name} ({network.symbol})
                        </span>
                      </div>
                    );
                  })}
                  <div style={{ 
                    fontSize: '12px', 
                    color: 'var(--text-secondary)', 
                    marginTop: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--glass-border-dark)'
                  }}>
                    + {Object.keys(NETWORKS).length - POPULAR_NETWORKS.length} more networks available
                  </div>
                </div>
              </div>
            </div>
          </div>


        </div>
      )}
    </div>
  );

  const renderTemplatesStep = () => (
    <div className="step-container">
      <div className="text-center mb-8">
        <h2 className="metallic-text mb-4">✨ Step 2: Quick Start Templates</h2>
        <p className="text-secondary">
          Choose from pre-configured examples or start from scratch.
        </p>
      </div>

      <div className="grid grid-2 gap-4 mb-6">
        {exampleTemplates.map((template) => (
          <div 
            key={template.id} 
            className="card" 
            style={{ 
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: '1px solid var(--glass-border-dark)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--metallic-gold)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(212, 175, 55, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--glass-border-dark)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className="flex items-start gap-4">
              <div 
                className="metallic-gradient rounded-lg" 
                style={{ padding: '12px', fontSize: '20px', minWidth: '48px', textAlign: 'center' }}
              >
                {template.icon}
              </div>
              <div className="flex-1">
                <h3 className="mb-2" style={{ fontSize: '16px' }}>{template.name}</h3>
                <p className="text-secondary mb-3" style={{ fontSize: '13px' }}>
                  {template.description}
                </p>
                <div className="mb-3" style={{ fontSize: '11px', color: 'var(--metallic-gold)' }}>
                  <div>🌐 {NETWORKS[template.config.network as keyof typeof NETWORKS]?.name}</div>
                  <div>💱 {template.config.originSymbol} → {template.config.destinationSymbol}</div>
                  <div>💰 {template.config.amount} {template.config.originSymbol}</div>
                  {template.config.strategy === 'CUSTOM' && template.config.customStrategy?.includes('cross_chain') && (
                    <div style={{ color: '#00ff00', marginTop: '4px' }}>
                      🔗 Cross-Chain Trading
                    </div>
                  )}
                  {!template.config.isTest && (
                    <div style={{ color: '#ff4444', marginTop: '4px' }}>
                      🚀 LIVE TRADING MODE
                    </div>
                  )}
                </div>
                <button 
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '8px 16px', fontSize: '13px' }}
                  onClick={() => applyTemplate(template)}
                >
                  <Zap size={14} />
                  Use Template
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <div className="glass-dark rounded-lg p-4" style={{ display: 'inline-block' }}>
          <p className="text-secondary" style={{ fontSize: '14px', marginBottom: '8px' }}>
            💡 <strong>Templates are pre-configured for testing</strong>
          </p>
          <p className="text-secondary" style={{ fontSize: '12px' }}>
            All templates start in test mode. You can modify any settings after applying a template.
          </p>
        </div>
      </div>
    </div>
  );

  const renderConfigureStep = () => (
    <div className="step-container">
      <div className="text-center mb-8">
        <h2 className="metallic-text mb-4">⚙️ Step 3: Configure Your Agent</h2>
        <p className="text-secondary">
          Set up your trading agent's parameters and strategy.
        </p>
      </div>

      <div className="card">
        <div className="grid gap-6">
          <div className="grid grid-2 gap-4">
            <div>
              <label className="block text-secondary mb-2" style={{ fontSize: '14px' }}>
                🤖 Agent Name *
              </label>
              <input
                type="text"
                value={agentConfig.name}
                onChange={(e) => setAgentConfig({...agentConfig, name: e.target.value})}
                placeholder="e.g., Flow DCA Bot"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--glass-bg-dark)',
                  border: '1px solid var(--glass-border-dark)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label className="block text-secondary mb-2" style={{ fontSize: '14px' }}>
                🌐 Network *
              </label>
              <select
                value={agentConfig.network}
                onChange={(e) => {
                  const newNetwork = e.target.value;
                  const newTokens = getTokensForChain(NETWORKS[newNetwork as keyof typeof NETWORKS].chainId);
                  setAgentConfig({
                    ...agentConfig, 
                    network: newNetwork,
                    // Reset token selection if current tokens aren't available on new network
                    originSymbol: newTokens.includes(agentConfig.originSymbol) ? agentConfig.originSymbol : newTokens[0] || 'ETH',
                    destinationSymbol: newTokens.includes(agentConfig.destinationSymbol) ? agentConfig.destinationSymbol : newTokens[1] || 'USDC'
                  });
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--glass-bg-dark)',
                  border: '1px solid var(--glass-border-dark)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              >
                <optgroup label="🔥 Popular Networks" style={{ background: 'var(--bg-primary)' }}>
                  {POPULAR_NETWORKS.map((networkKey) => {
                    const network = NETWORKS[networkKey];
                    return (
                      <option key={networkKey} value={networkKey} style={{ background: 'var(--bg-primary)' }}>
                        {network.name} ({network.symbol})
                      </option>
                    );
                  })}
                </optgroup>
                <optgroup label="🌐 All Networks" style={{ background: 'var(--bg-primary)' }}>
                  {Object.entries(NETWORKS)
                    .filter(([key]) => !POPULAR_NETWORKS.includes(key as any))
                    .map(([key, network]) => (
                      <option key={key} value={key} style={{ background: 'var(--bg-primary)' }}>
                        {network.name} ({network.symbol})
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-secondary mb-2" style={{ fontSize: '14px' }}>
              📝 Description
            </label>
            <textarea
              value={agentConfig.description}
              onChange={(e) => setAgentConfig({...agentConfig, description: e.target.value})}
              placeholder="Describe what your agent should do..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--glass-bg-dark)',
                border: '1px solid var(--glass-border-dark)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>

          <div>
            <label className="block text-secondary mb-2" style={{ fontSize: '14px' }}>
              🧠 AI Custom Prompt *
            </label>
            <textarea
              value={agentConfig.customPrompt || ''}
              onChange={(e) => setAgentConfig({...agentConfig, customPrompt: e.target.value})}
              placeholder="Tell the AI exactly what you want it to do. Be specific about tokens, amounts, timing, and strategy. The AI will figure out the best approach!"
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--glass-bg-dark)',
                border: '1px solid var(--glass-border-dark)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
            <p className="text-secondary" style={{ fontSize: '12px', marginTop: '4px' }}>
              💡 Example: "Buy FLOW tokens with USDC every hour when the price drops below $0.50, using 100 USDC per trade. Use DCA strategy with 5% price drop intervals."
            </p>
          </div>

          <div className="mb-4 p-4 glass-dark rounded-lg">
            <p className="text-secondary" style={{ fontSize: '14px', marginBottom: '8px' }}>
              🤖 <strong>AI-Powered Trading:</strong> The AI will intelligently determine the best tokens, amounts, and strategies based on your custom prompt above.
            </p>
            <p className="text-secondary" style={{ fontSize: '12px', marginBottom: '8px' }}>
              💡 You can leave these fields as defaults, or override them if you have specific preferences. The AI will use your custom prompt as the primary instruction.
            </p>
            <div style={{ fontSize: '12px', color: 'var(--metallic-gold)' }}>
              🪙 <strong>Available tokens on {NETWORKS[agentConfig.network as keyof typeof NETWORKS]?.name}:</strong> {availableTokens.join(', ')}
            </div>
          </div>

          <div className="grid grid-3 gap-4">
            <div>
              <label className="block text-secondary mb-2" style={{ fontSize: '14px' }}>
                💱 From Token (Optional - AI will choose based on prompt)
              </label>
              <select
                value={agentConfig.originSymbol}
                onChange={(e) => setAgentConfig({...agentConfig, originSymbol: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--glass-bg-dark)',
                  border: '1px solid var(--glass-border-dark)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              >
                {availableTokens.map(token => (
                  <option key={token} value={token} style={{ background: 'var(--bg-primary)' }}>
                    {token}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-secondary mb-2" style={{ fontSize: '14px' }}>
                💰 To Token (Optional - AI will choose based on prompt)
              </label>
              <select
                value={agentConfig.destinationSymbol}
                onChange={(e) => setAgentConfig({...agentConfig, destinationSymbol: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--glass-bg-dark)',
                  border: '1px solid var(--glass-border-dark)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              >
                {availableTokens.map(token => (
                  <option key={token} value={token} style={{ background: 'var(--bg-primary)' }}>
                    {token}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-secondary mb-2" style={{ fontSize: '14px' }}>
                🔢 Amount per Trade (Optional - AI will determine based on prompt)
              </label>
              <input
                type="number"
                step="0.0001"
                value={agentConfig.amount}
                onChange={(e) => setAgentConfig({...agentConfig, amount: e.target.value})}
                placeholder="e.g., 1.0"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--glass-bg-dark)',
                  border: '1px solid var(--glass-border-dark)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <div className="grid grid-3 gap-4">
            <div>
              <label className="block text-secondary mb-2" style={{ fontSize: '14px' }}>
                📊 Strategy
              </label>
              <select
                value={agentConfig.strategy}
                onChange={(e) => setAgentConfig({...agentConfig, strategy: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--glass-bg-dark)',
                  border: '1px solid var(--glass-border-dark)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              >
                <option value="DCA" style={{ background: 'var(--bg-primary)' }}>Dollar Cost Averaging</option>
                <option value="ARBITRAGE" style={{ background: 'var(--bg-primary)' }}>Arbitrage</option>
                <option value="RANGE" style={{ background: 'var(--bg-primary)' }}>Range Trading</option>
                <option value="MOMENTUM" style={{ background: 'var(--bg-primary)' }}>Momentum</option>
                <option value="CUSTOM" style={{ background: 'var(--bg-primary)' }}>Custom Strategy</option>
              </select>
            </div>

            <div>
              <label className="block text-secondary mb-2" style={{ fontSize: '14px' }}>
                ⏱️ Interval (minutes)
              </label>
              <input
                type="number"
                min="1"
                value={agentConfig.interval}
                onChange={(e) => setAgentConfig({...agentConfig, interval: e.target.value})}
                placeholder="60"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--glass-bg-dark)',
                  border: '1px solid var(--glass-border-dark)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label className="block text-secondary mb-2" style={{ fontSize: '14px' }}>
                ⚡ Slippage Tolerance (%)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                step="1"
                value={agentConfig.slippageTolerance}
                onChange={(e) => setAgentConfig({...agentConfig, slippageTolerance: e.target.value})}
                placeholder="10"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--glass-bg-dark)',
                  border: '1px solid var(--glass-border-dark)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              />
              <small className="text-secondary" style={{ fontSize: '11px' }}>
                Higher slippage = more likely to execute, but worse price
              </small>
            </div>
          </div>

          {agentConfig.strategy === 'CUSTOM' && (
            <div>
              <label className="block text-secondary mb-2" style={{ fontSize: '14px' }}>
                ✍️ Custom Strategy Description *
              </label>
              <textarea
                value={agentConfig.customStrategy}
                onChange={(e) => setAgentConfig({...agentConfig, customStrategy: e.target.value})}
                placeholder="Describe your custom trading strategy in detail..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--glass-bg-dark)',
                  border: '1px solid var(--glass-border-dark)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
              <small className="text-secondary">
                Example: "Buy ETH when price drops 5% below 24h average, sell when it rises 3% above purchase price"
              </small>
            </div>
          )}

          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={agentConfig.isTest}
                onChange={(e) => setAgentConfig({...agentConfig, isTest: e.target.checked})}
                style={{ accentColor: 'var(--metallic-gold)' }}
              />
              <span style={{ fontSize: '14px' }}>
                🧪 Test Mode (recommended for first deployment)
              </span>
            </label>
          </div>


        </div>
      </div>
    </div>
  );

  const renderDeployStep = () => (
    <div className="step-container">
      <div className="text-center mb-8">
        <h2 className="metallic-text mb-4">🚀 Step 4: Deploy Your Agent</h2>
        <p className="text-secondary">
          Review your configuration and deploy your trading agent.
        </p>
      </div>

      <div className="card mb-6">
        <h3 className="mb-4">📋 Configuration Summary</h3>
        <div className="grid gap-3">
          <div className="flex justify-between">
            <span className="text-secondary">Agent Name:</span>
            <span>{agentConfig.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary">Network:</span>
            <span>{NETWORKS[agentConfig.network as keyof typeof NETWORKS]?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary">Trading Pair:</span>
            <span>{agentConfig.originSymbol} → {agentConfig.destinationSymbol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary">Amount per Trade:</span>
            <span>{agentConfig.amount} {agentConfig.originSymbol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary">Strategy:</span>
            <span>{agentConfig.strategy}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary">Interval:</span>
            <span>{agentConfig.interval} minutes</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary">Mode:</span>
            <span>{agentConfig.isTest ? '🧪 Test Mode' : '💰 Live Trading'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary">Wallet:</span>
            <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
              {wallet?.address.slice(0, 6)}...{wallet?.address.slice(-4)}
            </span>
          </div>
        </div>
      </div>

      <div className="text-center">
        <button 
          onClick={deployAgent}
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
          Deploy Agent
        </button>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="metallic-text mb-4">Create New Agent</h1>
        <p className="text-secondary" style={{ fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
          Create a powerful AI trading agent with multi-chain EVM wallet support including Flow EVM.
        </p>
      </div>

      {error && (
        <div className="card mb-6" style={{ backgroundColor: 'rgba(255, 68, 68, 0.1)', borderColor: '#ff4444' }}>
          <div className="flex items-center gap-3">
            <div style={{ color: '#ff4444', fontSize: '18px' }}>❌</div>
            <div style={{ color: '#ff4444' }}>{error}</div>
          </div>
        </div>
      )}

      {success && (
        <div className="card mb-6" style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', borderColor: 'var(--metallic-gold)' }}>
          <div className="flex items-center gap-3">
            <div style={{ color: 'var(--metallic-gold)', fontSize: '18px' }}>✅</div>
            <div style={{ color: 'var(--metallic-gold)' }}>{success}</div>
          </div>
        </div>
      )}

      {/* Step 1: Wallet Generation */}
      {renderWalletStep()}

      {/* Step 1.5: Templates (only show if wallet exists) */}
      {wallet && (
        <div className="mt-8">
          {renderTemplatesStep()}
        </div>
      )}

      {/* Step 2: Agent Configuration (only show if wallet exists) */}
      {wallet && (
        <div className="mt-8">
          {renderConfigureStep()}
        </div>
      )}

      {/* Step 3: Deploy (only show if wallet and config are ready) */}
      {wallet && agentConfig.name && agentConfig.customPrompt && agentConfig.amount && (
        <div className="mt-8">
          {renderDeployStep()}
        </div>
      )}
    </div>
  );
};
