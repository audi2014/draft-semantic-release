# Draft Semantic Release Demo

Demonstration project for semantic-release with multi-branch prerelease setup and automated conflict resolution.

## Branch Strategy

- **`master`** - Production releases (`1.x.x`)
- **`beta`** - Beta prerelease (`1.x.x-beta.x`)
- **`devel`** - Development prerelease (`1.x.x-devel.x`)

**Workflow:** `devel` → `beta` → `master`

## Features

### Automated Conflict Resolution

GitHub Actions automatically resolves semantic-release conflicts when creating PRs between branches.

**See:** [docs/AUTO_RESOLVE_CONFLICTS.md](docs/AUTO_RESOLVE_CONFLICTS.md)

### Conventional Commits

Uses commitizen for standardized commit messages.

```bash
npm run commit
```

## Setup

```bash
npm install
```

## Documentation

- [Auto-Resolve Conflicts](docs/AUTO_RESOLVE_CONFLICTS.md) - Workflow usage and configuration
- [CI Scripts Development](docs/CI_SCRIPTS.md) - TypeScript scripts development guide

## Configuration

- Semantic Release: `.releaserc`
- Commitizen: `package.json` → `config.commitizen`
- Auto-resolve workflow: `.github/workflows/auto-resolve-semantic-release-conflicts.yml`
- CI scripts: `.scripts/`

## Repository

- GitHub: https://github.com/audi2014/draft-semantic-release
- npm: [@audi2014/npmjs-test](https://www.npmjs.com/package/@audi2014/npmjs-test)

## License

MIT
