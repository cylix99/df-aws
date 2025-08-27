# Claude Code Configuration

## MCP Servers
This project should load the following MCP servers:
- shopify-dev-mcp: For Shopify development tools and workflows

## Setup
Ensure the Shopify MCP is configured in your Claude Code settings:

```json
{
  "mcpServers": {
    "shopify-dev-mcp": {
      "command": "npx",
      "args": ["-y", "@shopify/dev-mcp@latest"]
    }
  }
}
```

If the Shopify MCP tools are not available, restart Claude Code to ensure the MCP server connects properly.