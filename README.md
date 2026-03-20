# Hyperliquid Wallet Tracker

A modern, real-time wallet tracker dashboard for Hyperliquid perpetuals. Built with Next.js 15, TypeScript, and the [@nktkas/hyperliquid](https://github.com/nktkas/hyperliquid) SDK.

![Dashboard Preview](docs/dashboard-preview.png)

## Features

- **Multi-wallet tracking** - Track multiple public wallet addresses simultaneously
- **Real-time polling** - Configurable polling interval (default: 10 seconds)
- **Account summary** - View account value, unrealized PnL, margin used, withdrawable
- **Position tracking** - See all open positions with entry/mark price, leverage, PnL
- **Liquidation monitoring** - Distance to liquidation with color-coded warnings
- **Change detection** - Toast notifications for new/closed positions and PnL swings
- **Network toggle** - Switch between mainnet and testnet
- **Dark mode** - Beautiful dark theme by default
- **Responsive design** - Works on desktop, tablet, and mobile
- **MCP Server** - Available as npm package for AI assistants

## Tech Stack

- [Next.js 15+](https://nextjs.org/) (App Router, React 19)
- [TypeScript](https://www.typescriptlang.org/) (strict mode)
- [@nktkas/hyperliquid](https://github.com/nktkas/hyperliquid) SDK
- [Tailwind CSS v4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) components
- [Sonner](https://sonner.emilkowal.ski/) for toast notifications
- [Lucide React](https://lucide.dev/) for icons

## Getting Started

### Prerequisites

- Node.js 18.18 or later
- npm, pnpm, yarn, or bun

### Installation

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd hyperliquid-wallet-tracker
```

2. **Install dependencies**

```bash
npm install
```

3. **Run the development server**

```bash
npm run dev
```

4. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

## Configuration

### Configuration Storage

- **Source of truth:** Browser `localStorage`
- **Default fallback:** `data/config.json`
- **Import/Export:** JSON file from the sidebar

### Adding Wallets

You can manage wallets in three ways:

1. **Via UI** - Add/remove wallets from the sidebar
2. **Import JSON** - Import wallet list from file
3. **Export JSON** - Export current wallet list for backup/share

## MCP Server

This project includes an MCP server published as [`hyperliquid-tracker-mcp`](https://www.npmjs.com/package/hyperliquid-tracker-mcp) on npm.

### Use via npm (recommended)

```bash
npx hyperliquid-tracker-mcp
```

### MCP client config

Add to your MCP config (Claude Desktop, Cursor, Windsurf, opencode):

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

### Available MCP tools

| Tool | Description |
|------|-------------|
| `list_tracked_wallets` | List configured wallet addresses |
| `add_wallet` | Add a wallet address to track |
| `remove_wallet` | Remove a wallet address |
| `clear_wallets` | Clear all tracked wallets |
| `get_all_mids` | Get mid prices for all perp coins |
| `get_account_summary` | Get account summary for a wallet |
| `get_wallet_positions` | Get detailed positions for a wallet |
| `get_multi_wallet_summary` | Aggregate summary across multiple wallets |

### MCP package source

The MCP server source lives in [`mcp/`](./mcp/) and can be developed locally:

```bash
cd mcp
npm install
npm run dev
```

See [`mcp/README.md`](./mcp/README.md) for full MCP package documentation.

## Project Structure

```
hyperliquid-wallet-tracker/
├── mcp/                           # MCP server (npm package)
│   ├── src/
│   │   ├── server.ts              # MCP stdio server
│   │   ├── hyperliquid.ts         # Hyperliquid API client
│   │   ├── config-store.ts        # JSON config read/write
│   │   ├── types.ts               # TypeScript types
│   │   └── utils.ts               # Utility functions
│   ├── package.json               # npm package config
│   ├── tsconfig.json
│   └── README.md
├── app/
│   ├── globals.css                # Global styles + Tailwind
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Dashboard page
├── components/
│   ├── dashboard/
│   │   ├── AccountSkeleton.tsx
│   │   ├── PositionTable.tsx
│   │   ├── SummaryCards.tsx
│   │   ├── WalletDashboard.tsx
│   │   └── WalletSelector.tsx
│   ├── providers/
│   │   └── ToastProvider.tsx
│   └── ui/                        # shadcn/ui components
├── hooks/
│   └── useWalletPolling.ts        # Polling hook with change detection
├── lib/
│   ├── hyperliquid.ts             # SDK client + data fetching
│   ├── types.ts                   # TypeScript type definitions
│   └── utils.ts                   # Utility functions
├── data/
│   └── config.json                # Default config
├── mcp.json                       # MCP client config example
├── package.json
└── tsconfig.json
```

## API Reference

This project uses the public Info API endpoints from Hyperliquid:

- `POST /info` with `type: "clearinghouseState"` - Get account summary and positions
- `POST /info` with `type: "allMids"` - Get current mid prices for all coins

See [@nktkas/hyperliquid documentation](https://nktkas.gitbook.io/hyperliquid/) for more details.

## Building for Production

```bash
npm run build
npm start
```

## Type Checking

```bash
npm run typecheck
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for any purpose.

## Acknowledgments

- [Hyperliquid](https://hyperliquid.xyz/) - The perpetuals DEX
- [@nktkas/hyperliquid](https://github.com/nktkas/hyperliquid) - Community TypeScript SDK
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Vercel](https://vercel.com/) - Next.js framework

---

**Note:** This is a read-only tracker. It does not require any private keys or signing capabilities. All data is fetched from public API endpoints.
