# CI Scripts Development Guide

TypeScript-based scripts for GitHub Actions workflows.

## Structure

```
.scripts/
├── auto-resolve-conflicts.ts  # Semantic-release conflict resolver
└── tsconfig.json              # TypeScript config for scripts
```

## TypeScript Configuration

Scripts use Node.js-optimized TypeScript settings:
- Target: ES2020
- Module: CommonJS
- Strict type checking enabled
- Node.js types included

## Development

### Setup

```bash
npm install
```

### Running Scripts Locally

```bash
# Set required environment variables
export BASE_BRANCH=beta
export HEAD_BRANCH=devel

# Execute with ts-node
npx ts-node .scripts/auto-resolve-conflicts.ts
```

### Adding New Scripts

1. Create `.ts` file in `.scripts/` directory
2. Add shebang: `#!/usr/bin/env ts-node`
3. Document environment variables and behavior
4. Update this guide
5. Use in workflows: `npx ts-node .scripts/your-script.ts`

## Best Practices

- **Type safety** - Use strict TypeScript
- **Error handling** - Always catch and log errors
- **Exit codes** - 0 = success, 1 = error
- **Logging** - Clear, descriptive console output
- **Environment** - Read config from env vars
- **Idempotent** - Safe to run multiple times
- **Testing** - Test locally before CI use

## Scripts Reference

### `auto-resolve-conflicts.ts`

Resolves merge conflicts in semantic-release managed files.

**Environment Variables:**
- `BASE_BRANCH` - Target branch (required)
- `HEAD_BRANCH` - Source branch (required)

**Exit Codes:**
- `0` - No conflicts or successfully resolved
- `1` - Cannot auto-resolve (conflicts in non-semantic-release files)

**Outputs:**
- `has_conflicts` - Boolean
- `resolved` - Boolean

**Files Managed:**
- `CHANGELOG.md`
- `package.json`
- `package-lock.json`

**See:** [docs/AUTO_RESOLVE_CONFLICTS.md](./AUTO_RESOLVE_CONFLICTS.md) for workflow usage

## Dependencies

Required dev dependencies in root `package.json`:
- `typescript` - TypeScript compiler
- `ts-node` - Execute TypeScript directly
- `@types/node` - Node.js type definitions
