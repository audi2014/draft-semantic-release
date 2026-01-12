#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import { existsSync } from 'fs';

/**
 * Configuration for semantic-release managed files
 */
const SEMANTIC_RELEASE_FILES = ['CHANGELOG.md', 'package.json', 'package-lock.json'];

/**
 * Execute shell command and return output
 */
function exec(command: string, options: { ignoreError?: boolean } = {}): string {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
  } catch (error) {
    if (!options.ignoreError) {
      throw error;
    }
    return '';
  }
}

/**
 * Configure git with bot identity
 */
function configureGit(): void {
  exec('git config user.name "github-actions[bot]"');
  exec('git config user.email "github-actions[bot]@users.noreply.github.com"');
}

/**
 * Get list of conflicted files
 */
function getConflictedFiles(): string[] {
  const output = exec('git diff --name-only --diff-filter=U', { ignoreError: true });
  return output.trim().split('\n').filter(Boolean);
}

/**
 * Check if all conflicted files are in the allowed list
 */
function canAutoResolve(conflictedFiles: string[]): boolean {
  for (const file of conflictedFiles) {
    if (!SEMANTIC_RELEASE_FILES.includes(file)) {
      console.log(`⚠️  Cannot auto-resolve: conflict in non-semantic-release file: ${file}`);
      return false;
    }
  }
  return true;
}

/**
 * Resolve conflicts by keeping source branch version
 */
function resolveConflicts(conflictedFiles: string[]): void {
  for (const file of conflictedFiles) {
    if (existsSync(file)) {
      console.log(`✓ Resolving ${file} - keeping source branch version`);
      exec(`git checkout --ours "${file}"`);
      exec(`git add "${file}"`);
    }
  }
}

/**
 * Create commit message for conflict resolution
 */
function createCommitMessage(
  conflictedFiles: string[],
  headBranch: string,
  baseBranch: string
): string {
  return `chore: auto-resolve semantic-release conflicts

Automatically resolved conflicts in semantic-release managed files:
${conflictedFiles.map((f) => `- ${f}`).join('\n')}

Strategy: Kept source branch (${headBranch}) versions
Target branch: ${baseBranch}

[skip ci]`;
}

/**
 * Main function to handle conflict resolution
 */
async function main(): Promise<void> {
  const baseBranch = process.env.BASE_BRANCH || process.argv[2]
  const headBranch = process.env.HEAD_BRANCH || process.argv[3]

  if (!baseBranch || !headBranch) {
    console.error('❌ BASE_BRANCH and HEAD_BRANCH environment variables are required');
    process.exit(1);
  }

  console.log(`Base branch: ${baseBranch}`);
  console.log(`Head branch: ${headBranch}`);

  configureGit();

  // Fetch the latest base branch
  console.log(`\nFetching origin/${baseBranch}...`);
  exec(`git fetch origin ${baseBranch}`);

  // Try to merge base into head
  console.log('\nAttempting merge...');
  const mergeResult = exec(`git merge origin/${baseBranch} --no-commit --no-ff`, {
    ignoreError: true,
  });

  // Check if merge was successful (no conflicts)
  const mergeStatus = exec('git status --porcelain', { ignoreError: true });
  const hasConflicts = mergeStatus.includes('UU ') || mergeStatus.includes('AA ');

  if (!hasConflicts) {
    console.log('✓ No conflicts detected');
    exec('git merge --abort', { ignoreError: true });
    console.log('::set-output name=has_conflicts::false');
    process.exit(0);
  }

  console.log('\n⚠️  Conflicts detected');

  // Get conflicted files
  const conflictedFiles = getConflictedFiles();
  console.log('\nConflicted files:');
  conflictedFiles.forEach((file) => console.log(`  - ${file}`));

  // Check if we can auto-resolve
  if (!canAutoResolve(conflictedFiles)) {
    console.error('\n❌ Cannot auto-resolve: conflicts in non-semantic-release files');
    exec('git merge --abort', { ignoreError: true });
    console.log('::set-output name=has_conflicts::true');
    console.log('::set-output name=resolved::false');
    process.exit(1);
  }

  console.log('\n✓ All conflicts are in semantic-release managed files');

  // Resolve conflicts
  console.log('\nResolving conflicts...');
  resolveConflicts(conflictedFiles);

  // Commit the resolution
  const commitMessage = createCommitMessage(conflictedFiles, headBranch, baseBranch);
  exec(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`);

  // Push the resolution
  console.log('\nPushing resolution...');
  exec(`git push origin ${headBranch}`);

  console.log('\n✅ Conflicts automatically resolved and pushed');
  console.log('::set-output name=has_conflicts::true');
  console.log('::set-output name=resolved::true');
}

// Run main function
main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
