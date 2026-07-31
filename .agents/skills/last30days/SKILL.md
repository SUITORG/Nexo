---
name: last30days
description: >
  AI-powered cross-platform research agent. Researches any topic across
  Reddit, X/Twitter, YouTube, TikTok, Instagram, Hacker News, Polymarket,
  GitHub, Bluesky, LinkedIn, StockTwits, arXiv, Techmeme, Digg, and the web
  — restricted to the last 30 days — then synthesizes a grounded,
  citation-backed summary. Use for: competitor intelligence, trend discovery,
  product/customer research, pre-meeting briefs, tool comparisons, hiring
  signals, content strategy, market sentiment, prompt research, trip
  planning, or any task requiring up-to-date intel from social platforms.
  Triggers: /last30days, "research X", "what are people saying about",
  "trends in", "compare X vs Y", "brief me on", "before my meeting with".
---

# /last30days — Cross-Platform Research Skill

Researches any topic across social platforms, video, news, and prediction markets from the **last 30 days** and produces a grounded, citation-backed synthesis.

## Quick start

```
/last30days <topic>
```

## Setup (one-time)

### 1. Install the skill

```bash
npx skills add mvanhorn/last30days-skill -g
```

For Claude Code:
```
/plugin marketplace add mvanhorn/last30days-skill
```

### 2. Run the setup wizard

Run any research once — the wizard auto-launches and walks you through unlocking sources:

```
/last30days setup
```

Or check what's available:
```
/last30days --diagnose
```

### 3. Install optional free dependencies for richer results

```bash
# YouTube transcripts (free)
brew install yt-dlp       # macOS
pip install yt-dlp        # cross-platform

# arXiv + Techmeme + Digg — auto-installed by first-run setup
# No keys required
```

### 4. Source requirements

| Source | What you need | Cost |
|---|---|---|
| Reddit + HN + Polymarket + GitHub + StockTwits | Nothing | Free |
| arXiv + Techmeme + Digg | Auto-installed CLIs | Free |
| X/Twitter | Logged-in browser session, or `XAI_API_KEY` | Free with cookies |
| YouTube | `yt-dlp` on PATH | Free |
| Bluesky | App password from bsky.app | Free |
| TikTok / Instagram / LinkedIn / Pinterest | ScrapeCreators API key | 10K free calls, then PAYG |
| Web search | Brave Search API key | 2K free queries/month |
| Perplexity | Perplexity or OpenRouter key | PAYG |

Prompt for keys when the wizard runs, or set them in `~/.config/last30days/.env`.

## Usage

### Basic research

```
/last30days Peter Steinberger
/last30days AI coding agents 2026
/last30days what are people saying about OpenClaw
```

### Mode flags

| Flag | Effect |
|---|---|
| `--days=7` | Look back N days instead of 30 |
| `--quick` | Faster research, fewer sources (8-12 each) |
| `--deep` | Comprehensive (50-70 Reddit, 40-60 X, 40 YouTube) |
| `--sources=reddit,x` | Restrict to specific sources |
| `--include-web` | Add native web search |
| `--emit=json` | Machine-readable JSON output |
| `--store` | Persist to SQLite for trend tracking |
| `--output <file>` | Write result to exact path |
| `--save-dir <path>` | Save research to custom directory |

### Comparative

```
/last30days OpenClaw vs Hermes vs Paperclip
/last30days --competitors "SuitOrg"
```

### Discovery mode (find trending topics)

```
/last30days what's trending in AI agents?
/last30days what's exploding in video generation?
```

### Person research

```
/last30days Peter Steinberger --github-user=steipete
/last30days <name> --hiring-signals
```

### ELI5 mode

After any research run:
```
eli5 on
```

### Library & watchlists

```
# Track topics over time
last30 watch my biggest competitor every week
last30 watch AI video tools monthly

# Search accumulated knowledge
last30 what have you found about AI video?

# Library feed
/last30days library feed
/last30days search my library for MCP servers
```

## What you get

Each run produces a structured brief with:

- **Executive summary** — what matters, why
- **Source breakdown** — engagement-ranked findings from each platform
- **Synthesis** — cross-source patterns and signal clusters
- **Best Takes** — community's most upvoted / liked / quoted lines
- **Follow-ups** — ready-to-run `/last30days` queries to drill deeper
- **Citations** — every claim links back to its original URL

Saved to `~/Documents/Last30Days/` by default.

## Architecture

Two-phase search:
1. **Broad discovery** — parallel queries across configured sources, scored by engagement + relevance + freshness
2. **Smart supplemental** — resolves handles, subreddits, hashtags, repos before firing APIs
3. **Cross-source cluster merging** — same story from different platforms = one cluster
4. **AI judge synthesis** — LLM scores and summarizes into grounded brief
