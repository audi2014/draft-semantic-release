# Workflow Scripts

TypeScript scripts used by GitHub Actions workflows.

## Configuration

All shared configuration is centralized in `constants.ts`:

```typescript
export const PACKAGE_NAME = '@audi2014/npmjs-test';
export const TARGET_OWNER = 'audi2014';
export const TARGET_REPO = 'draft-semantic-release-app';
export const GITHUB_API_BASE = 'https://api.github.com';
```

**To change package name or target repository:** 
1. Edit `constants.ts` - all scripts will automatically use the new values
2. Update the app repo's `renovate.json` (2 occurrences in `matchPackageNames`)
3. Update the app repo's `.github/workflows/renovate.yml` (1 occurrence in `RENOVATE_PACKAGE_RULES`)

## Scripts

### `get-package-info.ts`

Extracts package version and metadata from git tags for release workflows.

**Usage:**
```bash
BRANCH=hotfix/payment-bug npx ts-node .scripts/get-package-info.ts
# or
npx ts-node .scripts/get-package-info.ts hotfix/payment-bug
```

**Outputs (GITHUB_OUTPUT):**
- `branch` - The branch name
- `version` - Version from git tag (without 'v' prefix)
- `dist_tag` - NPM dist-tag for this branch
- `sanitized_tag` - Sanitized branch name for version strings

**Branch handling:**
- `master` - Exits early (not using Renovate for master)
- `hotfix/*` or `hotfix-*` - Processes as hotfix
- `betafix/*` or `betafix-*` - Processes as betafix
- Other patterns - Throws error

### `trigger-renovate.ts`

Checks if a branch exists in the app repository and triggers Renovate with dynamic configuration.

**Usage:**
```bash
BRANCH=hotfix/payment-bug \
VERSION=1.1.0-hotfix-payment-bug.1 \
DIST_TAG=hotfix-payment-bug \
SANITIZED_TAG=hotfix-payment-bug \
GH_TOKEN=ghp_xxx \
npx ts-node .scripts/trigger-renovate.ts
```

**Environment Variables:**
- `BRANCH` - Branch name to trigger for
- `VERSION` - Package version
- `DIST_TAG` - NPM dist-tag
- `SANITIZED_TAG` - Sanitized branch name
- `GH_TOKEN` or `GITHUB_TOKEN` - GitHub personal access token

**Behavior:**
1. Checks if branch exists in `audi2014/draft-semantic-release-app`
2. If not exists, exits gracefully (no error)
3. If exists, builds `allowedVersions` pattern
4. Triggers Renovate via repository_dispatch with payload

## Testing Locally

```bash
# Install dependencies
npm install

# Test get-package-info
BRANCH=hotfix/test npx ts-node .scripts/get-package-info.ts

# Test trigger-renovate (requires GH_TOKEN)
BRANCH=hotfix/test \
VERSION=1.0.0-hotfix-test.1 \
DIST_TAG=hotfix-test \
SANITIZED_TAG=hotfix-test \
GH_TOKEN=your_token \
npx ts-node .scripts/trigger-renovate.ts
```

## Dependencies

- `ts-node` - TypeScript execution
- `@types/node` - Node.js type definitions

Note: Uses native Node.js `fetch` API (available in Node.js 18+) for GitHub API calls, no external HTTP client needed.
