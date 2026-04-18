# ⚡ eskomsepush-mcp

> Model Context Protocol server for [EskomSePush](https://sepush.co.za) — bringing real-time South African load shedding data to Claude and any MCP-compatible AI client.

Built by a South African developer, for South Africans. Ask Claude about load shedding in plain language.

---

## What it does

| Tool | Description | Plan |
|---|---|---|
| `get_status` | Current national load shedding stage (Eskom + Cape Town) | Free ✅ |
| `check_allowance` | See how many API calls you have left today | Free ✅ |
| `search_areas` | Find your area ID by suburb or city name | Paid 💳 |
| `get_area_schedule` | Upcoming events and full schedule for your area | Paid 💳 |
| `get_areas_nearby` | Discover areas by GPS coordinates | Paid 💳 |

### Example prompts
- *"What stage are we on right now?"* → works on free plan
- *"How many API calls do I have left today?"* → works on free plan
- *"Is there load shedding in Stellenbosch tonight?"* → paid plan
- *"Show me the load shedding schedule for Sandton this week"* → paid plan
- *"Find load shedding areas near me"* (with GPS) → paid plan

---

## Prerequisites

- Node.js 18+
- An EskomSePush API token from [eskomsepush.gumroad.com/l/api](https://eskomsepush.gumroad.com/l/api)

### API Plan Requirements

EskomSePush operates a tiered API. The free tier returns **HTTP 410 Gone** on area-lookup endpoints — those require a paid subscription. This MCP server exposes the full tool surface regardless of plan; unsupported tools will surface the 410 as a clear error to the client.

| Plan | Cost | What works |
|---|---|---|
| Free | $0 via [Gumroad](https://eskomsepush.gumroad.com/l/api) | `get_status`, `check_allowance` |
| Paid | From $55/yr | All 5 tools |

---

## Installation

### Option 1 — npx (recommended)
```bash
npx eskomsepush-mcp
```

### Option 2 — Clone & build
```bash
git clone https://github.com/zukhanyendiki9-code/eskomsepush-mcp.git
cd eskomsepush-mcp
npm install
npm run build
```

---

## Configuration

### Claude Desktop

Add to your `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "eskomsepush": {
      "command": "npx",
      "args": ["-y", "eskomsepush-mcp"],
      "env": {
        "ESP_API_TOKEN": "your-api-token-here"
      }
    }
  }
}
```

### Claude Code
```bash
claude mcp add eskomsepush -e ESP_API_TOKEN=your-token -- npx -y eskomsepush-mcp
```

### Cursor / Windsurf
```json
{
  "mcpServers": {
    "eskomsepush": {
      "command": "npx",
      "args": ["-y", "eskomsepush-mcp"],
      "env": {
        "ESP_API_TOKEN": "your-api-token-here"
      }
    }
  }
}
```

---

## Development

```bash
npm run build        # compile TypeScript
npm run dev          # watch mode
npm run inspect      # open MCP Inspector UI for testing
```

> **Tip:** Pass `test: true` to any tool during development — it returns mock data and doesn't count against your daily quota.

### Testing status

| Tool | Tested on free plan |
|---|---|
| `get_status` | ✅ |
| `check_allowance` | ✅ |
| `search_areas` | ⚠️ Requires paid plan |
| `get_area_schedule` | ⚠️ Requires paid plan |
| `get_areas_nearby` | ⚠️ Requires paid plan |

If you're on a paid plan and test any of the paid-tier tools, please open an issue or PR to confirm behaviour.

---

## API Quota

| Plan | Calls/day |
|---|---|
| Free | 50 |
| Paid | Higher limits |

Use the `check_allowance` tool to monitor your usage. Use `test: true` while building.

---

## Contributing

PRs welcome. If you're South African and have ideas for making this more useful, open an issue.

Join the EskomSePush developer community on [ZATech Slack](https://zatech.slack.com/) in `#eskomsepush`.

---

## License

MIT © [Zukanye Ndiki](https://github.com/zukhanyendiki9-code)
