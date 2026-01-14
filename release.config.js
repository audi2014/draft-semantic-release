const branch = process.env.CI_COMMIT_BRANCH;
if(!branch) {
  throw new Error('CI_COMMIT_BRANCH environment variable is not set.');
}

const isReleaseBranch = ['master'].includes(branch);

// Get sanitized branch name for unique npm dist-tags and version strings
const sanitizeBranchName = (name) => {
  return name.replace(/\//g, '-').replace(/[^a-z0-9-]/gi, '-').toLowerCase();
};

const branches = [
  "master",
  {
    name: "{hotfix,hot-fix}{-,/}*",
    prerelease: sanitizeBranchName(branch),
    channel: sanitizeBranchName(branch)
  },
  {
    name: "{betafix,beta-fix}{-,/}*",
    prerelease: sanitizeBranchName(branch),
    channel: sanitizeBranchName(branch)
  },
];

const pluginCommitAnalyzerConfig = [
  "@semantic-release/commit-analyzer",
  {
    "preset": "angular",
    "releaseRules": [
      {
        "type": "fix",
        "release": "patch",
      },
      {
        "type": "feat",
        "release": "minor",
      },
      {
        "type": "refactor",
        "release": "patch",
      },
      {
        "type": "perf",
        "release": "patch",
      },
      {
        "type": "chore",
        "release": "patch",
      },
    ],
  },
]

const plugins = [
  pluginCommitAnalyzerConfig,
  ...(isReleaseBranch ? [
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
  ] : []),
  "@semantic-release/npm",
  ...(isReleaseBranch ? [
    "@semantic-release/git",
  ] : []),
]

const config = {
  branches,
  plugins,
};

module.exports = config;
