# hyperliquid-tracker-mcp

MCP (Model Context Protocol) server for Hyperliquid perpetual wallet tracking. Query positions, account summaries, and mid prices directly from your AI assistant.

## Features

- Track Hyperliquid perpetual wallet positions
- Get account summaries (balance, margin, PnL)
- Fetch mid prices for all perp coins
- Multi-wallet aggregation
- Persistent wallet config (stored in `~/.hyperliquid-tracker/config.json`)

## Install

```bash
npm install -g hyperliquid-tracker-mcp
```

Or use directly with `npx` (no install needed):

```bash
npx hyperliquid-tracker-mcp
```

## Setup

### Claude Desktop

Add to your Claude Desktop config file (`claude_desktop_config.json`):

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "hyperliquid-tracker": {
      "command": "npx",
      "args": ["hyperliquid-tracker-mcp"]
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "hyperliquid-tracker": {
      "command": "npx",
      "args": ["hyperliquid-tracker-mcp"]
    }
  }
}
```

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "hyperliquid-tracker": {
      "command": "npx",
      "args": ["hyperliquid-tracker-mcp"]
    }
  }
}
```

### opencode

Add to `mcp.json` in your project root:

```json
{
  "mcpServers": {
    "hyperliquid-tracker": {
      "command": "npx",
      "args": ["hyperliquid-tracker-mcp"]
    }
  }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| `list_tracked_wallets` | List wallet addresses stored in tracker config |
| `add_wallet` | Add a public Hyperliquid wallet address to track |
| `remove_wallet` | Remove a wallet address from tracker config |
| `clear_wallets` | Clear all tracked wallets from config |
| `get_all_mids` | Fetch mid prices for all Hyperliquid perp coins |
| `get_account_summary` | Fetch account summary (accountValue, withdrawable, margin, unrealized PnL) |
| `get_wallet_positions` | Fetch detailed perp positions including mark price and liquidation distance |
| `get_multi_wallet_summary` | Aggregate summaries across multiple wallets |

## Example Prompts

Once connected, you can ask your AI assistant things like:

- "Add wallet 0x1234... to my tracker"
- "Show me my tracked wallets"
- "What are my current positions?"
- "Get account summary for 0x1234..."
- "Show me all mid prices"
- "Give me a summary of all my wallets"

## Config Storage

Wallet addresses are stored in `~/.hyperliquid-tracker/config.json`:

```json
{
  "wallets": ["0x1234...", "0x5678..."],
  "settings": {
    "pollInterval": 10000,
    "isTestnet": false
  }
}
```

## License

MIT
