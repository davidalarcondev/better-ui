# Release automation and CI notes

This document explains how the repository's release automation works and what to check when a release does not run.

Workflows
- `.github/workflows/release.yml` runs `googleapis/release-please-action@v4` to create releases/tags and PRs.
- The workflow is triggered on `push` to `main` and `master`.

Token and permissions
- The action requires a token with repo write permissions. The workflow uses the repository secret `MY_RELEASE_PLEASE_TOKEN` by default.
- You can create a Personal Access Token (PAT) with the `repo` scope or create a fine-grained token limited to the repository. Add it under repository Settings → Secrets and variables → Actions as `MY_RELEASE_PLEASE_TOKEN`.
- Alternatively, change the workflow to use the built-in `GITHUB_TOKEN` by setting `token: ${{ secrets.GITHUB_TOKEN }}`. `GITHUB_TOKEN` is sufficient for most single-repo workflows and avoids storing a PAT, but it is not available to workflows triggered by forks.

Why release might not run
- The workflow triggers only on branches listed under `on.push.branches`. If your default branch is `master` but the workflow only listens to `main`, it won't run. Ensure the workflow includes the branch you use (this repo listens to both `main` and `master`).
- If the workflow runs but does not have a valid token (secret missing), it will fail; check Actions logs for the error.
- If PRs come from forks, GitHub will not expose secrets to the workflow. Use a maintainers branch and merge strategy, or configure an alternative approach.

Quick checklist when a release doesn't occur
1. Confirm which branch you merged into (main or master).
2. Confirm `.github/workflows/release.yml` is present on that branch.
3. In the repository settings, verify `MY_RELEASE_PLEASE_TOKEN` exists and is valid (or update the workflow to use `GITHUB_TOKEN`).
4. Open the Actions page and inspect the latest run for `release-please`. The logs contain precise failure reasons.

Local testing
- Use `npm pack` to produce a `.tgz` and install it elsewhere to simulate how npm installs the package.
- Use `npm link` during local development to test the global CLI behavior across projects.

If you need help creating the PAT or updating the workflow to use `GITHUB_TOKEN`, follow the instructions in the README or ask a maintainer with admin access to add the secret.
