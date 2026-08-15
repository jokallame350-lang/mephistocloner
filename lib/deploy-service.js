/**
 * SitePrompter Web - Production 1-Click Deployment Service
 * Connects directly to GitHub REST API (Tree/Blob/Commit) and Vercel REST API (v13 Deployments)
 */

const { deployToGitHub: realDeployToGitHub, mockDeployGitHub } = require('./github-deployer');
const { deployToVercel: realDeployToVercel, mockDeployVercel } = require('./vercel-deployer');
const { generateNextjsProjectFileMap } = require('./nextjs-project-packager');

/**
 * Deploys project to GitHub
 */
async function deployToGitHub(body = {}) {
  const {
    githubToken = process.env.GITHUB_TOKEN,
    repoName = 'site-clone-project',
    isPrivate = false,
    commitMessage = 'feat: launch full-stack clone via SitePrompter AI',
    code = '',
    telemetry = {},
    framework = 'react-tailwind'
  } = body;

  const fileMap = generateNextjsProjectFileMap(code, telemetry, { title: repoName });

  if (githubToken && !githubToken.startsWith('mock_') && githubToken !== 'mock') {
    return await realDeployToGitHub(githubToken, repoName, fileMap, {
      isPrivate,
      commitMessage,
      autoInit: true
    });
  }

  // Fallback to standalone deploy simulator if no user token is provided
  return mockDeployGitHub(repoName, fileMap, { isPrivate, commitMessage });
}

/**
 * Deploys project to Vercel
 */
async function deployToVercel(body = {}) {
  const {
    vercelToken = process.env.VERCEL_TOKEN,
    projectName = 'site-clone-preview',
    code = '',
    telemetry = {},
    framework = 'react-tailwind'
  } = body;

  const fileMap = generateNextjsProjectFileMap(code, telemetry, { title: projectName });

  if (vercelToken && !vercelToken.startsWith('mock_') && vercelToken !== 'mock') {
    return await realDeployToVercel(vercelToken, projectName, fileMap, {
      framework: 'nextjs',
      poll: false
    });
  }

  // Fallback to standalone deploy simulator if no user token is provided
  return mockDeployVercel(projectName, fileMap, 'nextjs');
}

module.exports = {
  deployToGitHub,
  deployToVercel
};
