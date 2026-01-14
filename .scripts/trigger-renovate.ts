#!/usr/bin/env ts-node

import { PACKAGE_NAME, TARGET_OWNER, TARGET_REPO, GITHUB_API_BASE } from './constants';

/**
 * Checks if a branch exists in the target repository
 */
async function checkBranchExists(
  token: string,
  owner: string,
  repo: string,
  branch: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/branches/${branch}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${token}`,
          'User-Agent': 'renovate-trigger-script',
        },
      }
    );
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Triggers Renovate in the app repository
 */
async function triggerRenovate(
  token: string,
  owner: string,
  repo: string,
  payload: {
    package: string;
    version: string;
    branch: string;
    dist_tag: string;
    allowedVersions?: string;
  }
): Promise<void> {
  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/dispatches`,
    {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'renovate-trigger-script',
      },
      body: JSON.stringify({
        event_type: 'renovate-trigger',
        client_payload: payload,
      }),
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to trigger Renovate: ${response.status} ${response.statusText}`);
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    // Get inputs from environment or args
    const branch = process.env.BRANCH || process.argv[2];
    const version = process.env.VERSION || process.argv[3];
    const distTag = process.env.DIST_TAG || process.argv[4];
    const sanitizedTag = process.env.SANITIZED_TAG || process.argv[5];
    const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
    
    if (!branch || !version || !distTag) {
      throw new Error('Missing required parameters: BRANCH, VERSION, DIST_TAG');
    }
    
    if (!token) {
      throw new Error('Missing GH_TOKEN or GITHUB_TOKEN');
    }
    
    console.log(`Processing branch: ${branch}`);
    console.log(`Version: ${version}`);
    console.log(`Dist-tag: ${distTag}`);
    
    // Check if branch exists in app repo
    console.log(`Checking if branch ${branch} exists in app repo...`);
    const branchExists = await checkBranchExists(token, TARGET_OWNER, TARGET_REPO, branch);
    
    if (!branchExists) {
      console.log(`⚠️  Branch ${branch} does not exist in app repo, skipping Renovate trigger`);
      return;
    }
    
    console.log(`✅ Branch ${branch} exists in app repo`);
    
    // Build version pattern for allowedVersions
    // Matches: 1.1.0-hotfix-payment-bug.1, 1.1.0-hotfix-payment-bug.2, etc.
    const allowedVersions = sanitizedTag 
      ? `.+-${sanitizedTag}\\\\..+`
      : undefined;
    
    if (allowedVersions) {
      console.log(`Triggering Renovate with version filter: ${allowedVersions}`);
    }
    
    // Send payload with version filter
    const payload: any = {
      package: PACKAGE_NAME,
      version,
      branch,
      dist_tag: distTag,
    };
    
    if (allowedVersions) {
      payload.allowedVersions = allowedVersions;
    }
    
    await triggerRenovate(token, TARGET_OWNER, TARGET_REPO, payload);
    
    console.log('✅ Renovate triggered with version filter!');
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Error: ${error.message}`);
    }
    process.exit(1);
  }
}

main();
