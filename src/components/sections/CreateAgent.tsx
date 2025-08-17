import React, { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import QRCode from 'react-qr-code';
import { usePrivy } from '@privy-io/react-auth';
import { Wallet, Copy, RefreshCw, Zap, Save } from 'lucide-react';
import { agentService } from '../../lib/supabase';

const NETWORKS = {
  BASE: { name: 'Base', symbol: 'ETH', chainId: 8453 },
  ETHEREUM: { name: 'Ethereum', symbol: 'ETH', chainId: 1 },
  BNB: { name: 'BNB Smart Chain', symbol: 'BNB', chainId: 56 },
  AVAX: { name: 'Avalanche', symbol: 'AVAX', chainId: 43114 },
  ARB: { name: 'Arbitrum', symbol: 'ETH', chainId: 42161 },
  POL: { name: 'Polygon', symbol: 'POL', chainId: 137 },
  OPTIMISM: { name: 'Optimism', symbol: 'ETH', chainId: 10 },
  FLOW_EVM: { name: 'Flow EVM', symbol: 'FLOW', chainId: 747 }
};

const COINS = ['ETH', 'USDC', 'USDT', 'DAI', 'BTC', 'WETH', 'POL', 'AVAX', 'ARB', 'FLOW'];

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
    network: 'FLOW_EVM',
    strategy: 'DCA',
    customStrategy: '',
    customPrompt: '',
    originSymbol: 'USDC',
    destinationSymbol: 'FLOW',
    amount: '',
    interval: '60', // minutes
    isTest: true
  });

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

    setLoading(true);
    setError('');
    
    try {
      const agentData = {
        user_wallet: userWallet,
        agent_name: agentConfig.name,
        public_key: wallet.address,
        private_key: wallet.privateKey, // In production, encrypt this!
        agent_configuration: JSON.stringify({
          description: agentConfig.description,
          customPrompt: agentConfig.customPrompt,
          network: agentConfig.network,
          strategy: agentConfig.strategy === 'CUSTOM' ? agentConfig.customStrategy : agentConfig.strategy,
          originSymbol: agentConfig.originSymbol,
          destinationSymbol: agentConfig.destinationSymbol,
          amount: agentConfig.amount,
          interval: agentConfig.interval,
          isTest: agentConfig.isTest,
          walletAddress: wallet.address,
          mnemonic: wallet.mnemonic, // In production, encrypt this!
          aiInstructions: `This agent should execute trades based on the following custom prompt: "${agentConfig.customPrompt}". The AI should intelligently determine the best trading strategy, token pairs, amounts, and timing based on this natural language instruction.`
        }),
        agent_deployed_link: null // Will be set when actually deployed to a service
      };

      await agentService.createAgent(agentData);
      setSuccess(`Agent "${agentConfig.name}" created successfully!`);
      
      // Reset form
      setWallet(null);
      setAgentConfig({
        name: '',
        description: '',
        network: 'FLOW_EVM',
        strategy: 'DCA',
        customStrategy: '',
        customPrompt: '',
        originSymbol: 'USDC',
        destinationSymbol: 'FLOW',
        amount: '',
        interval: '60',
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
              <div className="grid gap-2">
                {Object.entries(NETWORKS).map(([key, network]) => (
                  <div key={key} className="flex items-center gap-3">
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
                ))}
              </div>
            </div>
          </div>


        </div>
      )}
    </div>
  );

  const renderConfigureStep = () => (
    <div className="step-container">
      <div className="text-center mb-8">
        <h2 className="metallic-text mb-4">⚙️ Step 2: Configure Your Agent</h2>
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
                onChange={(e) => setAgentConfig({...agentConfig, network: e.target.value})}
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
                {Object.entries(NETWORKS).map(([key, network]) => (
                  <option key={key} value={key} style={{ background: 'var(--bg-primary)' }}>
                    {network.name}
                  </option>
                ))}
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
            <p className="text-secondary" style={{ fontSize: '12px' }}>
              💡 You can leave these fields as defaults, or override them if you have specific preferences. The AI will use your custom prompt as the primary instruction.
            </p>
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
                {COINS.map(coin => (
                  <option key={coin} value={coin} style={{ background: 'var(--bg-primary)' }}>
                    {coin}
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
                {COINS.map(coin => (
                  <option key={coin} value={coin} style={{ background: 'var(--bg-primary)' }}>
                    {coin}
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

          <div className="grid grid-2 gap-4">
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
        <h2 className="metallic-text mb-4">🚀 Step 3: Deploy Your Agent</h2>
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

      {/* Step 2: Agent Configuration (only show if wallet exists) */}
      {wallet && (
        <div className="mt-8">
          {renderConfigureStep()}
        </div>
      )}

      {/* Step 3: Deploy (only show if wallet and config are ready) */}
      {wallet && agentConfig.name && agentConfig.amount && (agentConfig.strategy !== 'CUSTOM' || agentConfig.customStrategy) && (
        <div className="mt-8">
          {renderDeployStep()}
        </div>
      )}
    </div>
  );
};
