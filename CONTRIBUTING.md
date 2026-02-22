# Contributing

Thank you for your interest in contributing to interactive-profile-web!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/interactive-profile-web`
3. Install API dependencies: `cd api && npm install`
4. Copy the example files:
   - `cp api/profile.example.md api/profile.md`
   - `cp public/config.example.json public/config.json`
5. Create `api/local.settings.json` (see `.env.example` for required variables)
6. Start locally: `swa start public --api-location api`

## What to Contribute

- **Bug fixes** — always welcome
- **New AI provider adapters** in `api/src/providers/`
- **New platform adapters** in `platforms/`
- **UI improvements** to `public/styles.css` or `public/app.js`
- **Documentation** improvements

## Guidelines

- Keep personal data out of the template — use `[PLACEHOLDER]` values in examples
- Each AI provider lives in its own file in `api/src/providers/`
- Each platform adapter in `platforms/<platform>/` should only translate request/response format — no business logic
- Test your changes locally before submitting a PR

## Pull Request Process

1. Create a branch: `git checkout -b feature/your-feature`
2. Make your changes and test locally
3. Open a PR with a clear description of what changed and why
4. Link any related issues

## Reporting Issues

Open a GitHub issue with:
- What you expected to happen
- What actually happened
- Your platform and Node.js version
- Relevant log output (redact any API keys)
