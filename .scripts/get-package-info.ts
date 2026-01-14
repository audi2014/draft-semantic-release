#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import { appendFileSync } from 'fs';
import { PACKAGE_NAME } from './constants';

/**
 * Sanitizes branch name for use in npm dist-tags and version strings
 * Converts: hotfix/payment-bug -> hotfix-payment-bug
 */
function sanitizeBranchName(name: string): string {
  return name
    .replace(/\//g, '-')
    .replace(/[^a-z0-9-]/gi, '-')
    .toLowerCase();
}

/**
 * Determines dist-tag based on branch pattern
 */
function getDistTag(branch: string): { distTag: string; sanitizedTag: string } {
  if (branch === 'master') {
    return { distTag: 'latest', sanitizedTag: '' };
  }
  
  const hotfixPattern = /^(hotfix\/|hotfix-|hot-fix\/|hot-fix-)/;
  const betafixPattern = /^(betafix\/|betafix-|beta-fix\/|beta-fix-)/;
  
  if (hotfixPattern.test(branch)) {
    const sanitized = sanitizeBranchName(branch);
    return { distTag: sanitized, sanitizedTag: sanitized };
  }
  
  if (betafixPattern.test(branch)) {
    const sanitized = sanitizeBranchName(branch);
    return { distTag: sanitized, sanitizedTag: sanitized };
  }
  
  throw new Error(`❌ Unknown branch pattern: ${branch}`);
}

/**
 * Gets the latest git tag version
 */
function getLatestVersion(): string {
  try {
    execSync('git fetch --tags', { stdio: 'pipe' });
    const latestTag = execSync('git describe --tags --abbrev=0', { 
      encoding: 'utf-8' 
    }).trim();
    
    // Remove 'v' prefix if present
    return latestTag.startsWith('v') ? latestTag.slice(1) : latestTag;
  } catch (error) {
    throw new Error('❌ Failed to get version from git tag');
  }
}

/**
 * Appends output to GITHUB_OUTPUT file
 */
function setOutput(name: string, value: string): void {
  const githubOutput = process.env.GITHUB_OUTPUT;
  if (!githubOutput) {
    console.log(`${name}=${value}`);
    return;
  }
  
  appendFileSync(githubOutput, `${name}=${value}\n`);
}

/**
 * Main execution
 */
async function main() {
  try {
    const branch = process.env.BRANCH || process.argv[2];
    
    if (!branch) {
      throw new Error('Branch name is required. Set BRANCH env var or pass as argument.');
    }
    
    console.log(`Processing branch: ${branch}`);
    
    // Only process hotfix/betafix branches - skip master and others
    if (branch === 'master') {
      console.log('ℹ️  Master branch - skipping Renovate trigger (not using Renovate for master)');
      process.exit(0);
    }
    
    const { distTag, sanitizedTag } = getDistTag(branch);
    const version = getLatestVersion();
    
    setOutput('branch', branch);
    setOutput('dist_tag', distTag);
    setOutput('sanitized_tag', sanitizedTag);
    setOutput('version', version);
    
    console.log(`✅ Package ${PACKAGE_NAME}@${version} (dist-tag: ${distTag}) was published from branch ${branch}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }
}

main();
