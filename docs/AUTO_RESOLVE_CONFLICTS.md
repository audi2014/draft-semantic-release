# Auto-Resolve Semantic Release Conflicts

## Overview

This project uses a GitHub Actions workflow to automatically resolve merge conflicts caused by semantic-release when creating PRs between branches.

## How It Works

### The Problem

Semantic-release commits version updates and changelog changes to each branch:
- `devel` → gets `1.x.x-devel.1` + changelog entry
- `beta` → gets `1.x.x-beta.1` + changelog entry  
- `master` → gets `1.x.x` + changelog entry

When merging `devel` → `beta` → `master`, these files conflict.

### The Solution

The workflow (`.github/workflows/auto-resolve-semantic-release-conflicts.yml`) automatically:

1. **Triggers** on PRs to `beta` and `master` branches
2. **Detects** merge conflicts
3. **Validates** conflicts are only in semantic-release managed files:
   - `CHANGELOG.md`
   - `package.json`
   - `package-lock.json`
4. **Resolves** by keeping the source branch version (using `git checkout --ours`)
5. **Commits** and pushes the resolution
6. **Comments** on the PR to notify reviewers

## Strategy

The workflow uses the `--ours` strategy, which keeps the **source branch** version:
- PR from `devel` → `beta`: keeps `devel` versions
- PR from `beta` → `master`: keeps `beta` versions

**Why this works:**
- Semantic-release will regenerate correct versions on the target branch
- CHANGELOG will be rebuilt with proper history
- No manual intervention needed

## Workflow Triggers

```yaml
on:
  pull_request:
    branches:
      - beta
      - master
    types: [opened, synchronize, reopened]
```

## Safety Features

1. **Only auto-resolves semantic-release files** - fails if other files have conflicts
2. **Adds descriptive commit message** - explains what was resolved
3. **Comments on PR** - notifies team of auto-resolution
4. **Skips CI** - uses `[skip ci]` to avoid triggering semantic-release

## Permissions Required

The workflow needs:
- `contents: write` - to push conflict resolutions
- `pull-requests: write` - to comment on PRs

## Manual Override

If you need to manually resolve conflicts:

1. Checkout your PR branch
2. Merge the target branch: `git merge origin/beta`
3. Resolve conflicts manually
4. Commit and push

The workflow will detect the push and won't interfere.

## Architecture

```
.github/workflows/auto-resolve-semantic-release-conflicts.yml
└─ calls → .scripts/auto-resolve-conflicts.ts (TypeScript)
```

**Benefits:**
- Type-safe conflict resolution
- Testable locally
- Maintainable code

**See:** [CI_SCRIPTS.md](./CI_SCRIPTS.md) for development details

## Testing Workflow

1. Create commit on `devel` → semantic-release creates `1.x.x-devel.1`
2. Create commit on `beta` → semantic-release creates `1.x.x-beta.1`
3. Create PR from `devel` → `beta`
4. Workflow auto-resolves conflicts ✨

**Local testing:** See [CI_SCRIPTS.md](./CI_SCRIPTS.md)

## Extending

Add files to auto-resolve list in `.scripts/auto-resolve-conflicts.ts`:

```typescript
const SEMANTIC_RELEASE_FILES = ['CHANGELOG.md', 'package.json', 'package-lock.json'];
```

## Troubleshooting

### Workflow doesn't trigger
- Ensure the PR targets `beta` or `master`
- Check workflow is enabled in repository settings
- Verify GitHub Actions has write permissions

### Auto-resolve fails
- Check if conflicts exist in non-semantic-release files
- Review workflow logs for specific error
- May require manual conflict resolution

### Commit not pushed
- Verify `GITHUB_TOKEN` has `contents: write` permission
- Check branch protection rules don't block bot commits
- May need to configure branch protection to allow github-actions[bot]
