# interactive-profile-web

A terminal-themed, AI-powered interactive profile that lets visitors ask questions about your professional experience in a chat interface.

Built as an open-source template — bring your own profile, AI provider, and hosting platform.

---

## Features

- Terminal-style UI with collapsible header, suggested questions, and markdown rendering
- Invite-code access gate (configurable via `ACCESS_CODES` env var) with per-IP rate limiting
- Configurable via a single `public/config.json` — no code changes needed for your name, title, questions, and links
- Profile content loaded from `api/profile.md` — easy to edit, gitignored by default so it is never committed accidentally
- Multiple AI providers supported out of the box: **Anthropic**, **OpenAI**, **Azure OpenAI**, **Ollama** (local), **Google Gemini**
- Platform-agnostic business logic in `api/src/core/` with thin adapters for each hosting target
- Platform adapters included for: **Azure Static Web Apps**, **Netlify**, **Vercel**, **AWS Lambda**, **GCP Cloud Functions**

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- An API key for your chosen AI provider (see [AI Providers](#ai-providers))

> **Platform note:** Local development and deployment have been tested with **Azure Static Web Apps** using the [SWA CLI](https://azure.github.io/static-web-apps-cli/) (`npm install -g @azure/static-web-apps-cli`). Platform adapters for Netlify, Vercel, AWS Lambda, and GCP Cloud Functions are included and should work — feedback and fixes from the community are very welcome!

---

## Quick Start

### 1. Clone and configure

```bash
git clone https://github.com/YOUR_USERNAME/interactive-profile-web
cd interactive-profile-web
```

Copy the example config files:

```bash
cp api/profile.example.md api/profile.md
cp public/config.example.json public/config.json
```

Edit `api/profile.md` with your professional background (this file is gitignored — it won't be committed).  
Edit `public/config.json` with your name, title, links, and suggested questions (also gitignored).

### 2. Set environment variables

Create `api/local.settings.json` (gitignored — never committed):

```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "",
    "AI_PROVIDER": "anthropic",
    "AI_API_KEY": "sk-ant-...",
    "AI_MODEL": "claude-3-haiku-20240307",
    "ACCESS_CODES": "ABC-123,DEF-456"
  }
}
```

See `.env.example` for all supported variables and provider-specific setup.

### 3. Install dependencies and run locally

```bash
cd api && npm install && cd ..
swa start public --api-location api
```

Open `http://localhost:4280` and enter your access code.

---

## AI Providers

Set `AI_PROVIDER` to one of:

| Value | Provider | Required vars | Example model |
|---|---|---|---|
| `anthropic` | Anthropic Claude (default) | `AI_API_KEY` | `claude-3-haiku-20240307` |
| `openai` | OpenAI GPT | `AI_API_KEY` | `gpt-4o-mini` |
| `azure-openai` | Azure OpenAI | `AI_API_KEY`, `AI_API_ENDPOINT`, `AI_API_VERSION` | your deployment name |
| `ollama` | Local Ollama | `AI_API_ENDPOINT` (`http://localhost:11434/v1`) | `llama3.2` |
| `gemini` | Google Gemini | `AI_API_KEY` | `gemini-1.5-flash` |

Use `AI_MODEL` to override the model name. Use `AI_MAX_TOKENS` to cap the response size (default: `2000`).

---

## Deployment

### Azure Static Web Apps (default)

```powershell
# Set environment variables on your SWA resource
# Required:
az staticwebapp appsettings set --name YOUR_APP_NAME --resource-group YOUR_RG `
  --setting-names `
    "AI_PROVIDER=anthropic" `
    "AI_API_KEY=sk-ant-..." `
    "ACCESS_CODES=ABC-123,DEF-456"

# Optional overrides (omit to use defaults):
az staticwebapp appsettings set --name YOUR_APP_NAME --resource-group YOUR_RG `
  --setting-names `
    "AI_MODEL=claude-3-haiku-20240307" `
    "AI_MAX_TOKENS=2000" `
    "PROFILE_PROMPT="    # inline profile text — alternative to bundling profile.md

# Deploy
swa deploy public --deployment-token YOUR_TOKEN --api-location api
```

### Netlify

1. Connect your repo in the Netlify dashboard (or use `netlify deploy`)
2. Set environment variables in Site Settings → Environment Variables
3. The included `netlify.toml` handles routing and functions automatically

### Vercel

1. Import your repo in the Vercel dashboard (or use `vercel deploy`)
2. Set environment variables in Project Settings → Environment Variables
3. The included `vercel.json` routes `/api/*` to the Vercel function adapters

### AWS Lambda

Use the handlers in `platforms/aws/` with API Gateway. Set environment variables in the Lambda console or via SAM/CDK.

### GCP Cloud Functions

Deploy the handlers in `platforms/gcp/` with HTTP triggers. Set environment variables via the Cloud Console or `gcloud functions deploy`.

---

## Project Structure

```
public/                        # Static frontend (HTML, CSS, JS — no framework)
  index.html                   # UI shell — all personal strings populated at runtime
  app.js                       # Fetches config.json, injects content, handles chat
  styles.css
  config.json                  # Your profile config — gitignored, edit freely
  config.example.json          # Committed template with [YOUR_...] placeholders

api/
  profile.md                   # Your profile content (AI system prompt) — gitignored
  profile.example.md           # Committed template
  local.settings.json          # Local env vars — gitignored
  package.json
  src/
    core/                      # Platform-agnostic business logic (shared by all adapters)
      chat-handler.js          # Validates access code, calls AI provider, returns response
      validate-handler.js      # Validates access codes with per-IP rate limiting
      profile.js               # Profile loader with caching (env var → file → error)
    providers/                 # AI provider adapters
      index.js                 # Factory — reads AI_PROVIDER and returns correct adapter
      anthropic.js             # Anthropic Claude
      openai.js                # OpenAI, Azure OpenAI, and Ollama (OpenAI-compatible)
      gemini.js                # Google Gemini
    functions/                 # Azure Functions v4 HTTP trigger wrappers (thin adapters)
      chat.js
      validateCode.js

platforms/                     # Adapters for other hosting platforms
  netlify/functions/           # Netlify Functions (Lambda-style exports.handler)
    chat.js
    validateCode.js
  vercel/api/                  # Vercel Serverless Functions (Express-style)
    chat.js
    validateCode.js
  aws/                         # AWS Lambda (API Gateway proxy format)
    chat.js
    validateCode.js
  gcp/                         # GCP Cloud Functions (HTTP trigger)
    chat.js
    validateCode.js

netlify.toml                   # Netlify routing and functions config
vercel.json                    # Vercel rewrite rules
staticwebapp.config.json       # Azure SWA routing config
.env.example                   # All environment variables documented
```

---

## Configuration Reference

### `public/config.json`

| Field | Description |
|---|---|
| `owner.name` | Your full name |
| `owner.shortName` | Short name used in question templates |
| `owner.username` | Terminal prompt username (`username@profile:~$`) |
| `owner.title` | Your job title / area |
| `owner.experience` | Experience summary line |
| `owner.location` | Your location |
| `owner.linkedin` | LinkedIn URL |
| `owner.github` | GitHub URL |
| `ui.appVersion` | Version string shown in the header |
| `ui.motd` | Message of the day. Use `{shortName}` as placeholder |
| `ui.audienceLabel` | Shown in `user@LABEL:~$` prompt |
| `ui.stackLabel` | Footer stack label |
| `asciiArt` | Array of strings for the ASCII banner |
| `questions` | Array of `{ label, question }` — use `{shortName}` in question text |

### `api/profile.md`

Free-form markdown used as the AI system prompt. See `api/profile.example.md` for structure. Loaded in this priority order:

1. `PROFILE_PROMPT` environment variable (useful if your platform cannot bundle files with functions)
2. `api/profile.md` file on disk (recommended for most setups)
3. Error if neither is found

### Environment variables

See `.env.example` for the full list. Key variables:

| Variable | Required | Description |
|---|---|---|
| `AI_PROVIDER` | Yes | `anthropic` / `openai` / `azure-openai` / `ollama` / `gemini` |
| `AI_API_KEY` | Yes* | API key for the chosen provider (*not needed for Ollama) |
| `AI_MODEL` | No | Model name override (provider-specific) |
| `AI_MAX_TOKENS` | No | Max response tokens (default: `2000`) |
| `AI_API_ENDPOINT` | Conditional | Required for `azure-openai` and `ollama` |
| `AI_API_VERSION` | Conditional | Required for `azure-openai` |
| `ACCESS_CODES` | Yes | Comma-separated invite codes in `XXX-XXX` format |
| `PROFILE_PROMPT` | No | Inline profile content (alternative to `api/profile.md`) |

---

## Security

- `api/profile.md`, `public/config.json`, and `api/local.settings.json` are all **gitignored** — personal data and secrets never enter version control
- Access codes are validated server-side with per-IP rate limiting (10 attempts per 15 minutes)
- Rotate your `ACCESS_CODES` in your hosting platform's environment settings at any time to invalidate shared codes
- API keys are read only from environment variables — never from client-side code

---

## Troubleshooting

**`Error contacting the API` on first load**  
Check that `api/local.settings.json` exists with valid `AI_PROVIDER`, `AI_API_KEY`, and `ACCESS_CODES` values. Restart `swa start` after editing it.

**Model not found (404)**  
Verify the model name is valid for your provider and tier. Recommended safe defaults:
- Anthropic: `claude-3-haiku-20240307`
- OpenAI: `gpt-4o-mini`
- Gemini: `gemini-1.5-flash`

**`context.log.error is not a function`**  
This was a known issue with Azure Functions v4 — already fixed in v1.1.0. Pull the latest version.

**Profile not loading / `PROFILE_PROMPT` not set**  
Make sure `api/profile.md` exists (copy from `api/profile.example.md`). The file must be present at the path from which `func start` or `swa start` is launched.

**ASCII art looks misaligned**  
Update `asciiArt` in `public/config.json` — each string in the array is one line. Use a monospace font generator for best results.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
