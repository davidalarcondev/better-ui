# Publishing to npm

This repository can be configured to publish releases to npm automatically when `release-please` creates a release.

Requirements
- A repository secret named `NPM_TOKEN` must be created containing an npm automation token. Create one at https://www.npmjs.com/settings/<your-user-or-org>/tokens and add it in GitHub: Settings → Secrets and variables → Actions → New repository secret.
- The release workflow (`.github/workflows/release.yml`) must have a step that picks up `steps.release.outputs.release_created` and runs `npm publish` with `NODE_AUTH_TOKEN` set from the secret.

Security notes
- Use an npm automation token (not your login password). Limit the token scope where possible and rotate it periodically.

Local test
- To test publishing behavior locally without publishing, run `npm pack` and inspect the generated `.tgz`.
