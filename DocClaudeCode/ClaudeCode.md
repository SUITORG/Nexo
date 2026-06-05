\*\*\*



title: Claude Code

subtitle: Use Claude Code with OpenRouter

headline: Integration with Claude Code | OpenRouter

canonical-url: '\[https://openrouter.ai/docs/guides/coding-agents/claude-code-integration](https://openrouter.ai/docs/guides/coding-agents/claude-code-integration)'

'og:site\\\_name': OpenRouter Documentation

'og:title': Claude Code Integration - OpenRouter

'og:description': >-

Learn how to use Claude Code with OpenRouter for improved reliability,

provider failover, and organizational controls.

'og:image':

type: url

value: >-

\[https://openrouter.ai/dynamic-og?title=Claude%20Code\\\&description=Use%20Claude%20Code%20with%20OpenRouter](https://openrouter.ai/dynamic-og?title=Claude%20Code\\\&description=Use%20Claude%20Code%20with%20OpenRouter)

'og:image:width': 1200

'og:image:height': 630

'twitter:card': summary\\\_large\\\_image

'twitter:site': '@OpenRouter'

noindex: false

nofollow: false

\---------------



<Warning>

&#x20; Claude Code with OpenRouter is only guaranteed to work with the Anthropic first-party provider. For maximum compatibility, we recommend setting \[Anthropic 1P as top priority provider](/docs/guides/routing/provider-selection) when using Claude Code.

</Warning>



\## Why Use OpenRouter with Claude Code?



OpenRouter adds a reliability and management layer between Claude Code and Anthropic's API, giving you and your organization several key benefits.



\### Provider Failover for High Availability



Anthropic's API occasionally experiences outages or rate limiting. When you route Claude Code through OpenRouter, your requests automatically fail over between multiple Anthropic providers. If one provider is unavailable or rate-limited, OpenRouter seamlessly routes to another, keeping your coding sessions uninterrupted.



\### Organizational Budget Controls



For teams and organizations, OpenRouter provides centralized budget management. You can set spending limits, allocate credits across team members, and prevent unexpected cost overruns. This is especially valuable when multiple developers are using Claude Code across your organization.



\### Usage Visibility and Analytics



OpenRouter gives you complete visibility into how Claude Code is being used across your team. Track usage patterns, monitor costs in real-time, and understand which projects or team members are consuming the most resources. All of this data is available in your \[OpenRouter Activity Dashboard](https://openrouter.ai/activity).



\## Quick Start



This guide will get you running \[Claude Code](https://code.claude.com/docs/en/overview) powered by OpenRouter in just a few minutes.



\### Step 1: Install Claude Code



<Tabs>

&#x20; <Tab title="Native Install (Recommended)">

&#x20;   \*\*macOS, Linux, WSL:\*\*



&#x20;   ```bash

&#x20;   curl -fsSL https://claude.ai/install.sh | bash

&#x20;   ```



&#x20;   \*\*Windows PowerShell:\*\*



&#x20;   ```powershell

&#x20;   irm https://claude.ai/install.ps1 | iex

&#x20;   ```

&#x20; </Tab>



&#x20; <Tab title="npm">

&#x20;   Requires \[Node.js 18 or newer](https://nodejs.org/en/download/).



&#x20;   ```bash

&#x20;   npm install -g @anthropic-ai/claude-code

&#x20;   ```

&#x20; </Tab>

</Tabs>



\### Step 2: Connect Claude to OpenRouter



Instead of logging in with Anthropic directly, connect Claude Code to OpenRouter.

This requires setting a few environment variables.



Requirements:



1\. Use `https://openrouter.ai/api` for the base url

2\. Provide your \[OpenRouter API key](https://openrouter.ai/settings/keys) as the auth token

3\. \*\*Important:\*\* Explicitly blank out the Anthropic API key to prevent conflicts



<Tabs>

&#x20; <Tab title="Shell Profile">

&#x20;   Add these environment variables to your shell profile:



&#x20;   ```bash

&#x20;   # Open your shell profile in nano

&#x20;   nano \~/.zshrc  # or \~/.bashrc for Bash users



&#x20;   # Add these lines to the file:

&#x20;   export OPENROUTER\_API\_KEY="<your-openrouter-api-key>"

&#x20;   export ANTHROPIC\_BASE\_URL="https://openrouter.ai/api"

&#x20;   export ANTHROPIC\_AUTH\_TOKEN="$OPENROUTER\_API\_KEY"

&#x20;   export ANTHROPIC\_API\_KEY="" # Important: Must be explicitly empty



&#x20;   # After saving, restart your terminal for changes to take effect

&#x20;   ```



&#x20;   <Note>

&#x20;     \*\*Persistence:\*\* We recommend adding these lines to your shell profile (`\~/.bashrc`, `\~/.zshrc`, or `\~/.config/fish/config.fish`).

&#x20;   </Note>

&#x20; </Tab>



&#x20; <Tab title="Project Settings File">

&#x20;   Alternatively, you can configure Claude Code using a project-level settings file at `.claude/settings.local.json` in your project root:



&#x20;   ```json

&#x20;   {

&#x20;     "env": {

&#x20;       "ANTHROPIC\_BASE\_URL": "https://openrouter.ai/api",

&#x20;       "ANTHROPIC\_AUTH\_TOKEN": "<your-openrouter-api-key>",

&#x20;       "ANTHROPIC\_API\_KEY": ""

&#x20;     }

&#x20;   }

&#x20;   ```



&#x20;   Replace `<your-openrouter-api-key>` with your actual OpenRouter API key.



&#x20;   <Note>

&#x20;     \*\*Note:\*\* This method keeps your configuration scoped to the project, making it easy to share OpenRouter settings with your team via version control (just be careful not to commit your API key).

&#x20;   </Note>

&#x20; </Tab>

</Tabs>



<Warning>

&#x20; \*\*Variable Location:\*\* Do not put these in a project-level `.env` file. The native Claude Code installer does not read standard `.env` files.



&#x20; \*\*Previous Login:\*\* If you were previously logged in to Claude Code with Anthropic, run `/logout` in a Claude Code session to clear cached credentials before the OpenRouter configuration takes effect.

</Warning>



\### Step 3: Start your session



Navigate to your project directory and start Claude Code:



```bash

cd /path/to/your/project

claude

```



You are now connected! Any prompt you send will be routed through OpenRouter.



\### Step 4: Verify



You can confirm your connection by running the `/status` command inside Claude Code.



```text

> /status

Auth token: ANTHROPIC\_AUTH\_TOKEN

Anthropic base URL: https://openrouter.ai/api

```



You can also check the \[OpenRouter Activity Dashboard](https://openrouter.ai/activity) to see your requests appearing in real-time.



\## How It Works



OpenRouter exposes an input that is compatible with the Anthropic Messages API.



1\. \*\*Direct Connection:\*\* When you set `ANTHROPIC\_BASE\_URL` to `https://openrouter.ai/api`, Claude Code speaks its native protocol directly to OpenRouter. No local proxy server is required.

2\. \*\*Anthropic Skin:\*\* OpenRouter's "Anthropic Skin" behaves exactly like the Anthropic API. It handles model mapping and passes through advanced features like "Thinking" blocks and native tool use.

3\. \*\*Billing:\*\* You are billed using your OpenRouter credits. Usage (including reasoning tokens) appears in your OpenRouter dashboard.



\## Configuring Models



Claude Code uses several environment variables to determine which models to use for different tasks. You can override these to route each role through a specific model:



```bash

export ANTHROPIC\_DEFAULT\_OPUS\_MODEL="anthropic/claude-opus-4.7"

export ANTHROPIC\_DEFAULT\_SONNET\_MODEL="anthropic/claude-sonnet-4.6"

export ANTHROPIC\_DEFAULT\_HAIKU\_MODEL="anthropic/claude-haiku-4.5"

export CLAUDE\_CODE\_SUBAGENT\_MODEL="anthropic/claude-opus-4.7"

```



| Variable                         | Description                                                   |

| -------------------------------- | ------------------------------------------------------------- |

| `ANTHROPIC\_DEFAULT\_OPUS\_MODEL`   | The model used for Opus-class tasks (e.g. complex reasoning)  |

| `ANTHROPIC\_DEFAULT\_SONNET\_MODEL` | The model used for Sonnet-class tasks (e.g. general coding)   |

| `ANTHROPIC\_DEFAULT\_HAIKU\_MODEL`  | The model used for Haiku-class tasks (e.g. quick completions) |

| `CLAUDE\_CODE\_SUBAGENT\_MODEL`     | The model used for sub-agent tasks spawned by Claude Code     |



Add these to the same shell profile or project settings file where you set `ANTHROPIC\_BASE\_URL` and `ANTHROPIC\_AUTH\_TOKEN`.



Claude Code is optimized for Anthropic models and may not work correctly with other providers.



\## Fast Mode



Anthropic's fast mode provides up to 2.5x faster output for Claude Opus 4.7 at premium pricing. When enabled, OpenRouter automatically routes your request to the Anthropic first-party provider and injects the required beta header.



\### Using `/fast` in Claude Code



Claude Code has a built-in `/fast` command that toggles fast mode. When enabled, Claude Code sends `speed: "fast"` in its requests. OpenRouter fully supports this parameter — you just need to set the following environment variable:



```bash

export CLAUDE\_CODE\_SKIP\_FAST\_MODE\_ORG\_CHECK=1

```



<Note>

&#x20; Requires Claude Code v2.1.96 or newer.

</Note>



\### Pricing



Fast mode requests are billed at a multiplier on top of the model's standard token pricing. See \[Anthropic's fast mode pricing](https://platform.claude.com/docs/en/build-with-claude/fast-mode#pricing) for current rates. When fast mode is active, the response's `usage` object includes `"speed": "fast"` to confirm the request was processed at the higher speed tier.



<Note>

&#x20; If `speed: "fast"` is sent for a model that does not support fast mode, the parameter is silently ignored and the request proceeds at standard speed with standard pricing.

</Note>



\### Routing behavior



When `speed: "fast"` is present, OpenRouter restricts routing to the Anthropic first-party provider, since other providers (e.g. Amazon Bedrock, Google Vertex) do not support Anthropic's fast mode. If no Anthropic endpoints are available, the request proceeds normally without fast mode.



\## Agent SDK



The \[Anthropic Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview) lets you build AI agents programmatically using Python or TypeScript. Since the Agent SDK uses Claude Code as its runtime, you can connect it to OpenRouter using the same environment variables described above.



For complete setup instructions and code examples, see our \[Anthropic Agent SDK integration guide](/docs/guides/community/anthropic-agent-sdk).



\## GitHub Action



You can use OpenRouter with the official \[Claude Code GitHub Action](https://github.com/anthropics/claude-code-action).To adapt the \[example workflow](https://github.com/anthropics/claude-code-action/blob/main/examples/claude.yml) for OpenRouter, make two changes to the action step:



1\. Pass your OpenRouter API key via `anthropic\_api\_key` (store it as a GitHub secret named `OPENROUTER\_API\_KEY`)

2\. Set the `ANTHROPIC\_BASE\_URL` environment variable to `https://openrouter.ai/api`



```yaml

\- name: Run Claude Code

&#x20; uses: anthropics/claude-code-action@v1

&#x20; with:

&#x20;   anthropic\_api\_key: ${{ secrets.OPENROUTER\_API\_KEY }}

&#x20; env:

&#x20;   ANTHROPIC\_BASE\_URL: https://openrouter.ai/api

```



\## Cost Tracking Statusline



You can add a custom statusline to Claude Code that tracks your OpenRouter API costs in real-time. The statusline displays the provider, model, cumulative cost, and cache discounts for your session.



!\[Claude Code statusline showing OpenRouter cost tracking](file:f7283d48-c195-48b2-a495-45e1dad7135f)



Download the statusline scripts from the \[openrouter-examples repository](https://github.com/OpenRouterTeam/openrouter-examples/tree/main/claude-code), make them executable, and add the following to your `\~/.claude/settings.json`:



```json

{

&#x20; "statusLine": {

&#x20;   "type": "command",

&#x20;   "command": "/path/to/statusline.sh"

&#x20; }

}

```



The script uses your `ANTHROPIC\_AUTH\_TOKEN` environment variable, which should already be set to your OpenRouter API key if you followed the setup above.



\## Troubleshooting



\* \*\*Auth Errors:\*\* Ensure `ANTHROPIC\_API\_KEY` is set to an empty string (`""`). If it is unset (null), Claude Code might fall back to its default behavior and try to authenticate with Anthropic servers.

\* \*\*Context Length Errors:\*\* If you hit context limits, consider breaking your task into smaller chunks or starting a new session.

\* \*\*Privacy:\*\* OpenRouter does not log your source code prompts unless you explicitly opt-in to prompt logging in your account settings. See our \[Privacy Policy](/privacy) for details.



