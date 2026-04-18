#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { EskomSePushClient } from "./client.js";

const token = process.env.ESP_API_TOKEN;
if (!token) {
  console.error(
    "Error: ESP_API_TOKEN environment variable is required.\n" +
    "Get your free API token at: https://eskomsepush.gumroad.com/l/api"
  );
  process.exit(1);
}

const client = new EskomSePushClient(token);

const server = new McpServer({
  name: "eskomsepush-mcp",
  version: "0.1.0",
});

// ── Tool 1: Get national load shedding status ────────────────────────────────
server.tool(
  "get_status",
  "Get the current national load shedding stage for both Eskom and Cape Town. Use this to find out what stage we are on right now.",
  {
    test: z
      .boolean()
      .optional()
      .default(false)
      .describe("Use test data instead of live data (does not count against your quota)"),
  },
  async ({ test }) => {
    const data = await client.getStatus(test);
    const { eskom, capetown } = data.status;

    return {
      content: [
        {
          type: "text",
          text: [
            "## 🔌 Current Load Shedding Status",
            "",
            `**Eskom (National)**`,
            `  Stage: ${eskom.stage || "None (No load shedding)"}`,
            `  Last updated: ${eskom.stage_updated}`,
            "",
            `**City of Cape Town**`,
            `  Stage: ${capetown.stage || "None (No load shedding)"}`,
            `  Last updated: ${capetown.stage_updated}`,
          ].join("\n"),
        },
      ],
    };
  }
);

// ── Tool 2: Search for areas ─────────────────────────────────────────────────
server.tool(
  "search_areas",
  "Search for load shedding areas by name or suburb. Returns area IDs you can use with get_area_schedule. Always search first if you don't have an area ID.",
  {
    text: z.string().describe("Suburb, city, or area name to search for (e.g. 'Stellenbosch', 'Sandton', 'Ballito')"),
    test: z
      .boolean()
      .optional()
      .default(false)
      .describe("Use test data (does not count against your quota)"),
  },
  async ({ text, test }) => {
    const data = await client.searchAreas(text, test);

    if (!data.areas.length) {
      return {
        content: [{ type: "text", text: `No areas found for "${text}". Try a broader search term.` }],
      };
    }

    const list = data.areas
      .map((a) => `- **${a.name}** (${a.region})\n  ID: \`${a.id}\``)
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text: [
            `## 🔍 Areas matching "${text}"`,
            "",
            list,
            "",
            "Use the area ID with `get_area_schedule` to see upcoming load shedding events.",
          ].join("\n"),
        },
      ],
    };
  }
);

// ── Tool 3: Get area schedule ────────────────────────────────────────────────
server.tool(
  "get_area_schedule",
  "Get the upcoming load shedding schedule and events for a specific area. Requires an area ID — use search_areas first if you don't have one.",
  {
    area_id: z
      .string()
      .describe("The area ID from search_areas (e.g. 'eskmo-7-stellenboschstellenboschwestern-cape')"),
    test: z
      .boolean()
      .optional()
      .default(false)
      .describe("Use test data (does not count against your quota)"),
  },
  async ({ area_id, test }) => {
    const data = await client.getAreaInfo(area_id, test);

    const events = data.events.length
      ? data.events
          .map((e) => `- 🚫 **${e.note}**\n  From: ${e.start}\n  Until: ${e.end}`)
          .join("\n")
      : "✅ No upcoming load shedding events scheduled.";

    const schedule = data.schedule.days
      .slice(0, 3)
      .map((day) => {
        const slots = day.stages
          .map((stage, i) => (stage.length ? `  Stage ${i + 1}: ${stage.join(", ")}` : null))
          .filter(Boolean)
          .join("\n");
        return `**${day.name} (${day.date})**\n${slots || "  No slots"}`;
      })
      .join("\n\n");

    return {
      content: [
        {
          type: "text",
          text: [
            `## ⚡ Load Shedding Schedule — ${data.info.name}`,
            `Region: ${data.info.region}`,
            "",
            "### Upcoming Events",
            events,
            "",
            "### Schedule (next 3 days)",
            schedule,
          ].join("\n"),
        },
      ],
    };
  }
);

// ── Tool 4: Get areas nearby by GPS ─────────────────────────────────────────
server.tool(
  "get_areas_nearby",
  "Find load shedding areas near a GPS location. Useful when you know coordinates but not the area name.",
  {
    lat: z.number().describe("Latitude (e.g. -33.9249 for Cape Town)"),
    lon: z.number().describe("Longitude (e.g. 18.4241 for Cape Town)"),
    test: z
      .boolean()
      .optional()
      .default(false)
      .describe("Use test data (does not count against your quota)"),
  },
  async ({ lat, lon, test }) => {
    const data = await client.getAreasNearby(lat, lon, test);

    if (!data.areas.length) {
      return {
        content: [{ type: "text", text: "No areas found near those coordinates." }],
      };
    }

    const list = data.areas
      .map((a) => `- **${a.name}** (${a.region})\n  ID: \`${a.id}\`  |  Nearby count: ${a.count}`)
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text: [
            `## 📍 Areas near (${lat}, ${lon})`,
            "",
            list,
            "",
            "Use the area ID with `get_area_schedule` to see upcoming events.",
          ].join("\n"),
        },
      ],
    };
  }
);

// ── Tool 5: Check API quota ──────────────────────────────────────────────────
server.tool(
  "check_allowance",
  "Check how many EskomSePush API calls you have remaining today. Free tier allows 50 calls per day.",
  {},
  async () => {
    const data = await client.getAllowance();
    const { count, limit, type } = data.allowance;
    const remaining = limit - count;
    const pct = Math.round((remaining / limit) * 100);

    return {
      content: [
        {
          type: "text",
          text: [
            "## 📊 API Allowance",
            "",
            `Plan: **${type}**`,
            `Used today: **${count} / ${limit}**`,
            `Remaining: **${remaining}** (${pct}%)`,
            "",
            remaining < 10
              ? "⚠️ Running low — use `test: true` on tools to avoid burning quota."
              : "✅ You have plenty of quota left.",
          ].join("\n"),
        },
      ],
    };
  }
);

// ── Start server ─────────────────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("EskomSePush MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
