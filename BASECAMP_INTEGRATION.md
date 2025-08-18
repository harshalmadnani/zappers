# Basecamp Testnet Integration

## Overview

This project has been successfully integrated with the **Camp AI** backend API (`https://camp-ai.onrender.com`) and configured to use **Basecamp testnet** as the primary network for AI trading bots.

## What Changed

### 1. Backend API Integration
- **Old API**: `https://zappers-backend.onrender.com`
- **New API**: `https://camp-ai.onrender.com`
- **Status**: ✅ Fully tested and working

### 2. Basecamp Testnet Configuration
- **Network Name**: Basecamp
- **RPC Endpoint**: `https://rpc.basecamp.t.raas.gelato.cloud`
- **Alternative RPC**: `https://rpc-campnetwork.xyz`
- **Chain ID**: `123420001114`
- **Currency Symbol**: `CAMP`
- **Block Explorer**: `https://basecamp.cloud.blockscout.com/`

### 3. Default Network Configuration
- **Primary Network**: Basecamp (CAMP)
- **Default Trading Pair**: CAMP → USDC
- **Default Strategy**: DCA (Dollar Cost Averaging)
- **Test Mode**: Enabled by default (recommended)

## API Endpoints Tested

All Camp AI API endpoints have been tested and verified:

- ✅ `GET /api/health` - Health check
- ✅ `GET /api/info` - API information
- ✅ `POST /api/bots` - Create trading bot
- ✅ `GET /api/bots` - Get all bots
- ✅ `GET /api/bots/:botId` - Get specific bot
- ✅ `POST /api/bots/:botId/activate` - Activate bot
- ✅ `POST /api/bots/:botId/deactivate` - Deactivate bot
- ✅ `DELETE /api/bots/:botId` - Delete bot
- ✅ `GET /api/bots/:botId/logs` - Get bot logs
- ✅ `GET /api/bots/status/active` - Get active bots

## Example Templates

The application now includes Basecamp-focused trading bot templates:

1. **🚀 Simple Basecamp Bot** - CAMP → USDC swaps
2. **🌉 Cross-Chain Basecamp Bot** - Basecamp → Arbitrum
3. **⚔️ Cross-Chain Basecamp → Katana** - Basecamp to Katana
4. **🔷 Cross-Chain Basecamp → Zircuit** - Basecamp to Zircuit L2
5. **🌊 Cross-Chain Basecamp → Flow EVM** - Basecamp to Flow EVM
6. **💎 Basecamp DCA Bot** - Dollar-cost averaging into CAMP
7. **📈 Basecamp Momentum Bot** - Momentum trading on Basecamp
8. **📊 Basecamp Range Bot** - Range trading strategy
9. **🧠 Custom AI Strategy** - AI-driven adaptive strategy

## How to Use

### 1. Create a New Agent
1. Navigate to the Create Agent page
2. Generate or import an EVM wallet
3. Choose a template or configure manually
4. Set Basecamp as your source network
5. Configure your trading parameters
6. Deploy your agent

### 2. Default Configuration
- **Network**: Basecamp
- **From Token**: CAMP
- **To Token**: USDC
- **Amount**: Configurable
- **Strategy**: DCA (configurable)
- **Interval**: 60 minutes (configurable)
- **Slippage**: 10% (configurable)
- **Mode**: Test (recommended for first deployment)

### 3. Cross-Chain Trading
The system supports cross-chain trading from Basecamp to:
- Arbitrum
- Base
- Katana
- Zircuit
- Flow EVM
- And many more networks

## Technical Details

### Wallet Generation
- Uses ethers.js for secure wallet generation
- Compatible with all EVM chains including Basecamp
- Supports both private key and mnemonic import

### API Integration
- RESTful API with JSON responses
- Automatic retry and error handling
- Real-time bot status updates
- Comprehensive logging system

### Network Support
- **Primary**: Basecamp testnet
- **Secondary**: All major EVM networks
- **Cross-chain**: Bridge and swap support
- **Tokens**: Native CAMP + USDC support

## Testing

The integration has been thoroughly tested:

- ✅ API connectivity
- ✅ Bot creation and management
- ✅ Cross-chain configuration
- ✅ Wallet generation
- ✅ Template application
- ✅ Error handling

## Benefits

1. **Native Basecamp Support** - First-class support for the Basecamp ecosystem
2. **AI-Powered Trading** - Advanced AI strategies using OpenAI o3-mini
3. **Cross-Chain Capability** - Trade across multiple networks seamlessly
4. **Test Mode** - Safe testing environment before live trading
5. **Real-Time Updates** - Live bot status and performance monitoring

## Next Steps

1. **Deploy your first Basecamp bot** using the test templates
2. **Configure cross-chain strategies** for arbitrage opportunities
3. **Monitor bot performance** through the dashboard
4. **Scale successful strategies** from test to live mode

## Support

For technical support or questions about the Basecamp integration:
- Check the bot logs for detailed execution information
- Review the API documentation at `https://camp-ai.onrender.com/api/info`
- Monitor bot status through the real-time dashboard

---

**Status**: ✅ **FULLY INTEGRATED AND TESTED**
**Last Updated**: August 18, 2025
**Version**: 1.0.0
