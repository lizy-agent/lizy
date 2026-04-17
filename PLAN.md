# LIZY Build Plan v0.1 — with Sub-Agent Delegation

## Context

LIZY is a brand-new project (v0.1) — the repo is empty, nothing has been built yet. The draft plan is comprehensive but assumes a single-threaded build from scratch. Several phases contain independent workstreams (5 MCP tools, 8+ web pages, 10 lib modules) that can be built in parallel by sub-agents with no shared dependencies. Sequential execution wastes time and pollutes the main agent's context with implementation details that don't need to be synthesized centrally.

This revision adds a **sub-agent fan-out strategy**: heavy phases spawn parallel sub-agents that each own a narrow, well-specified unit of work. The main agent stays focused on orchestration, integration points, and cross-cutting decisions (schemas, middleware wiring, deploy).

**Rule of thumb for spawning sub-agents:**
- **≥3 independent files/modules with no shared state** → fan out, one sub-agent per unit
- **Single file or tight coupling** → main agent does it
- **Research spanning multiple areas of the codebase** → Explore sub-agents in parallel
- **Unsure of scope** → 1 Plan sub-agent first to scope, then fan out

---

## Sub-Agent Fan-Out Map

| Phase | Workstream | Strategy | # Sub-agents |
|---|---|---|---|
| 1. Scaffold | Monorepo init, configs, CI | Main agent (sequential, foundational) | 0 |
| 2. Shared Types | 3 type files | Main agent (trivial, <50 LOC each) | 0 |
| 3. Core Infra | 10 lib modules | **Fan out**: group by concern | 3 |
| 4. Security Middleware | 5 middleware + helmet | **Fan out**: one agent per middleware | 3 |
| 5. Payment Middleware | x402 + MPP | Main agent (tightly coupled) | 0 |
| 6. MCP Tools | 5 tools | **Fan out**: 1 agent per tool | 5 |
| 7. MCP Server | Wiring, .well-known, routes | Main agent (integration) | 0 |
| 8. Frontend | 9 pages + components | **Fan out**: group by surface | 4 |
| 9. Deploy | Vercel x2, DNS, env | Main agent (risky, needs confirmation) | 0 |
| 10. Agent Registration | Onchain txs | Main agent (risky, needs confirmation) | 0 |
| 11. Claw Council | Discord, swap | Main agent (manual steps) | 0 |
| 12. Listing | mcp.so, Smithery, PR | **Fan out**: parallel submissions | 3 |

**Peak parallelism:** Phase 6 (5 tools) + Phase 8 (4 frontend groups).

---

## Fan-Out Details per Phase

### Phase 3 — Core Infra (3 sub-agents, parallel)

Each sub-agent gets a self-contained brief including types from `packages/types`, env var names, and example invocations.

- **Agent A — Chain layer**: `lib/rpc.ts`, `lib/rpcEthereum.ts`, `lib/registry.ts`
- **Agent B — State layer**: `lib/cache.ts` (Redis), `lib/quota.ts`, `lib/perks.ts`
- **Agent C — Ops layer**: `lib/errors.ts`, `lib/admin.ts`, `lib/email.ts` (Resend), plus routes `health.ts`, `quota.ts`, `session.ts`, `admin.ts`

### Phase 4 — Security Middleware (3 sub-agents, parallel)

- **Agent A**: `validateWallet.ts` + `rateLimit.ts` (both read wallet header)
- **Agent B**: `cors.ts` + `helmet` config + request size limit + terms version check
- **Agent C**: `quotaHeaders.ts` (response header injection + warning body)

### Phase 6 — MCP Tools (5 sub-agents, parallel)

Each gets: tool contract from `packages/types/tools.ts`, RPC lib API, cache TTL, price tier, chain. No shared logic beyond libs already written in Phase 3.

- Agent A: `oracle.ts` (wallet-activity + reputation + identity, 3 sub-tools)
- Agent B: `pengu.ts`
- Agent C: `pudgy.ts` (verify + metadata, Ethereum RPC)
- Agent D: `price.ts`
- Agent E: `transform.ts`

### Phase 8 — Frontend (4 sub-agents, parallel)

Split by surface area to minimize component-file conflicts. Shared components (`AGWConnectButton`, `TermsGate`, `QuotaBadge`, `Navbar`, `Footer`) are built by main agent **before** fan-out.

- **Agent A — Landing**: `/` + all `components/landing/*` (Hero, ToolGrid, HolderPerks, HowItWorks, CodeSnippet, PricingTable, LiveFeed, SocialProof)
- **Agent B — Onboarding**: `/start` + `components/onboarding/*` (5 steps + progress)
- **Agent C — Reference pages**: `/docs`, `/status`, `/playground`, `/changelog`
- **Agent D — Legal + error pages**: `/terms`, `/privacy`, `404`, `500`, SEO files (`sitemap.xml`, `robots.txt`, OG images)

### Phase 12 — Listing (3 sub-agents, parallel)

- Agent A: mcp.so submission
- Agent B: Smithery submission
- Agent C: awesome-mcp-servers PR

---

## Sub-Agent Brief Template

Every spawn uses this template to avoid shallow work:

```
Goal: <what this unit must deliver>
Inputs: <type contracts, env vars, lib APIs already built>
Outputs: <exact file paths to create>
Constraints: <TTLs, prices, error codes, holder perk behavior>
Verification: <how the main agent will check the result>
Do NOT: <cross into other sub-agents' files or modify shared libs>
Report format: <paths changed + any assumptions made>
```

Use `subagent_type: "general-purpose"` for implementation work. Use `Explore` only for research/lookup. Use `Plan` when a phase needs design before fan-out.

---

## Revised Phase Execution

1. **Phase 1–2** — main agent sequential (scaffold must exist before anything).
2. **Phase 3** — fan out 3 sub-agents; main agent reviews + integrates.
3. **Phase 4** — fan out 3 sub-agents; main agent wires into server.
4. **Phase 5** — main agent (x402 and MPP share session state).
5. **Phase 6** — fan out 5 sub-agents; main agent mounts tools in router.
6. **Phase 7** — main agent (pure integration).
7. **Phase 8** — main agent builds shared components, then fans out 4.
8. **Phase 9–11** — main agent, with user confirmation before each risky step (deploy, onchain txs, Discord posts).
9. **Phase 12** — fan out 3 listing submissions.

**Integration checkpoints** (main agent verifies after each fan-out):
- Typecheck passes across monorepo
- Each output file exists at declared path
- No sub-agent modified files outside its brief
- Spot-read 1 file per sub-agent to confirm quality

---

## Critical Files

- `apps/mcp-server/src/server.ts` — middleware stack wiring
- `apps/mcp-server/src/config/pricing.ts` — tool prices + holder discounts
- `apps/mcp-server/src/lib/quota.ts` — free-call tracker + warning logic
- `apps/mcp-server/public/.well-known/mcp.json` — MCP manifest
- `apps/web/app/start/page.tsx` — 5-step onboarding (AGW + terms + perks)
- `agent/lizy.agent.json` — ERC-8004 metadata (uploaded to IPFS)
- `supabase/migrations/001_init.sql` — 10 tables
- `.env.example` — key names only, no values

---

## Verification

**Per fan-out**: main agent runs `pnpm -r typecheck` and `pnpm -r lint` after integrating sub-agent outputs. Any cross-file break means a sub-agent overstepped its brief — revert and re-spawn with tighter scope.

**End-to-end** (after Phase 9 deploy):
- `curl https://lizy.world/health` → 200 with DB/Redis/RPC status
- `curl https://lizy.world/v1/quota -H "x-wallet-address: 0x…" -H "x-signature: …"` → returns quota JSON
- Call a paid tool without payment → 402 + x402 payload
- Retry with `x-mpp-charge` → 200 + quota headers present
- Load `/start` on mobile viewport → 5-step wizard works end-to-end
- Sentry receives a deliberate test error from both mcp-server and web
- `8004scan.io` shows agent with score 99+ after Phase 10

**Go/no-go for listing (Phase 12)**: all above pass + 24h uptime with no P1 Sentry alerts.
