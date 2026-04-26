# Security Policy

`better-ui` is intended to be a local-first tool. Product code should not introduce outbound network behavior without explicit design review.

## Reporting a vulnerability

If you believe you found a security issue, please avoid publishing exploit details immediately in a public issue. Share the problem with enough detail to reproduce it safely and describe:

- affected command or workflow
- impact
- reproduction steps
- whether the issue can write outside the project root or expose local data

## Project security guardrails

- outputs must stay inside the project root
- fix flows should remain explicit and reviewable
- product code should avoid exfiltration of repository data

See `docs/security-notes.md` for implementation-oriented guardrails.
