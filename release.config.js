const branch = process.env.CI_COMMIT_BRANCH;
if(!branch) {
  throw new Error('CI_COMMIT_BRANCH environment variable is not set.');
}

const isReleaseBranch = ['master'].includes(branch);

const branches = [
  "master",
  {
    "name": "beta",
    "prerelease": true,
  },
  {
    "name": "devel",
    "prerelease": true,
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
  "@semantic-release/git",
]

const config = {
  branches,
  plugins,
};

module.exports = config;
