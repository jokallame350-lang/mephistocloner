/**
 * SitePrompter - GitHub 1-Click Deployment Engine
 * Integrates with GitHub REST API (v2022-11-28 / Git Data API)
 * Supports Repository Creation, Tree/Blob Commit & Push, and Mock Offline Simulator
 */

const GITHUB_API_BASE = 'https://api.github.com';
const API_VERSION = '2022-11-28';
const USER_AGENT = 'SitePrompter-Deployer/2.0';

/**
 * Normalizes repository name to GitHub-valid format
 * Allowed: alphanumeric, hyphens, underscores, dots.
 */
function sanitizeRepoName(name = '') {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, '-')
    .replace(/[-_.]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'siteprompter-project';
}

/**
 * Normalizes file map into a standard object { [path]: string | Buffer }
 */
function normalizeFileMap(files) {
  if (!files) return {};
  if (typeof files === 'object' && !Array.isArray(files)) {
    const normalized = {};
    for (const [key, value] of Object.entries(files)) {
      const cleanKey = key.replace(/^[./\\]+/, '').replace(/\\/g, '/');
      normalized[cleanKey] = value;
    }
    return normalized;
  }
  if (Array.isArray(files)) {
    const normalized = {};
    for (const item of files) {
      if (item && (item.file || item.path)) {
        const p = (item.file || item.path).replace(/^[./\\]+/, '').replace(/\\/g, '/');
        normalized[p] = item.data !== undefined ? item.data : (item.content !== undefined ? item.content : '');
      }
    }
    return normalized;
  }
  return {};
}

/**
 * Creates default headers for GitHub API
 */
function getGitHubHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': API_VERSION,
    'User-Agent': USER_AGENT,
    'Content-Type': 'application/json',
  };
}

/**
 * Checks if running in mock mode
 */
function isMockMode(token, options = {}) {
  if (options.mock === true) return true;
  if (!token) return true;
  if (typeof token === 'string' && (token === 'mock' || token.startsWith('mock_') || token === 'test_token')) {
    return true;
  }
  return false;
}

/**
 * 1. Create a GitHub repository
 * @param {string} githubToken - Personal Access Token (classic with repo scope or fine-grained)
 * @param {string} repoName - Desired repository name
 * @param {object} options - { isPrivate: boolean, description: string, autoInit: boolean, mock: boolean }
 * @returns {Promise<{ success: boolean, repoUrl: string, cloneUrl: string, owner: string, name: string, isPrivate: boolean, defaultBranch: string, mock?: boolean }>}
 */
async function createRepository(githubToken, repoName, options = {}) {
  const cleanName = sanitizeRepoName(repoName);
  const isPrivate = Boolean(options.isPrivate);
  const description = options.description || 'Generated and deployed with SitePrompter Web';
  const autoInit = options.autoInit !== undefined ? options.autoInit : true;

  // Handle Mock Mode
  if (isMockMode(githubToken, options)) {
    const mockOwner = options.mockOwner || 'siteprompter-user';
    return {
      success: true,
      repoUrl: `https://github.com/${mockOwner}/${cleanName}`,
      cloneUrl: `https://github.com/${mockOwner}/${cleanName}.git`,
      owner: mockOwner,
      name: cleanName,
      isPrivate,
      defaultBranch: 'main',
      mock: true,
      message: 'Simulated repository creation (Mock Mode)',
      createdAt: new Date().toISOString(),
    };
  }

  const endpoint = `${GITHUB_API_BASE}/user/repos`;
  const body = {
    name: cleanName,
    private: isPrivate,
    description,
    auto_init: autoInit,
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: getGitHubHeaders(githubToken),
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.message || response.statusText;
    const errors = data.errors ? JSON.stringify(data.errors) : '';
    throw new Error(`GitHub API Error (${response.status}): ${errorMsg} ${errors}`.trim());
  }

  return {
    success: true,
    repoUrl: data.html_url,
    cloneUrl: data.clone_url,
    owner: data.owner?.login || '',
    name: data.name,
    isPrivate: Boolean(data.private),
    defaultBranch: data.default_branch || 'main',
    mock: false,
    createdAt: data.created_at,
  };
}

/**
 * 2. Creates a Git Blob
 * @param {string} githubToken
 * @param {string} repoOwner
 * @param {string} repoName
 * @param {string|Buffer} content
 * @param {string} encoding - 'utf-8' or 'base64'
 */
async function createBlob(githubToken, repoOwner, repoName, content, encoding = 'utf-8') {
  if (isMockMode(githubToken)) {
    return {
      sha: `mock_blob_sha_${Math.random().toString(36).substring(2, 10)}`,
      url: `https://api.github.com/repos/${repoOwner}/${repoName}/git/blobs/mock_sha`,
      mock: true,
    };
  }

  const isBuffer = Buffer.isBuffer(content);
  const base64Content = isBuffer
    ? content.toString('base64')
    : encoding === 'base64'
      ? content
      : Buffer.from(content, 'utf8').toString('base64');

  const endpoint = `${GITHUB_API_BASE}/repos/${repoOwner}/${repoName}/git/blobs`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: getGitHubHeaders(githubToken),
    body: JSON.stringify({
      content: base64Content,
      encoding: 'base64',
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to create Git blob (${response.status}): ${data.message || response.statusText}`);
  }

  return {
    sha: data.sha,
    url: data.url,
  };
}

/**
 * 3. Push project files to repository (Creates Tree, Commit, and Updates Branch Reference)
 * @param {string} githubToken
 * @param {string} repoOwner
 * @param {string} repoName
 * @param {object|Array} fileMap - Object { 'app/page.tsx': '...' } or Array of { path, content }
 * @param {string} commitMessage
 * @param {object} options - { branch: string, mock: boolean }
 * @returns {Promise<{ success: boolean, commitSha: string, commitUrl: string, filesPushed: number, branch: string, mock?: boolean }>}
 */
async function pushProjectFiles(githubToken, repoOwner, repoName, fileMap, commitMessage = 'Initial commit from SitePrompter', options = {}) {
  const normalizedFiles = normalizeFileMap(fileMap);
  const fileKeys = Object.keys(normalizedFiles);

  if (fileKeys.length === 0) {
    throw new Error('Cannot push empty project: fileMap must contain at least one file');
  }

  const branch = options.branch || 'main';

  // Handle Mock Mode
  if (isMockMode(githubToken, options)) {
    const mockSha = `mock_sha_${Math.random().toString(36).substring(2, 12)}`;
    return {
      success: true,
      commitSha: mockSha,
      commitUrl: `https://github.com/${repoOwner}/${repoName}/commit/${mockSha}`,
      filesPushed: fileKeys.length,
      fileList: fileKeys,
      branch,
      mock: true,
      message: `Pushed ${fileKeys.length} files to ${branch} branch (Mock Mode)`,
      timestamp: new Date().toISOString(),
    };
  }

  const headers = getGitHubHeaders(githubToken);

  // 1. Get the current commit SHA of the target branch
  let baseCommitSha = null;
  let baseTreeSha = null;

  try {
    const refRes = await fetch(`${GITHUB_API_BASE}/repos/${repoOwner}/${repoName}/git/ref/heads/${branch}`, {
      headers,
    });
    if (refRes.ok) {
      const refData = await refRes.json();
      baseCommitSha = refData.object?.sha;
    }
  } catch (err) {
    // If ref doesn't exist yet, we will create orphan commit or initial commit
  }

  if (baseCommitSha) {
    const commitRes = await fetch(`${GITHUB_API_BASE}/repos/${repoOwner}/${repoName}/git/commits/${baseCommitSha}`, {
      headers,
    });
    if (commitRes.ok) {
      const commitData = await commitRes.json();
      baseTreeSha = commitData.tree?.sha;
    }
  }

  // 2. Build Tree items array
  const treeItems = [];
  for (const filePath of fileKeys) {
    const content = normalizedFiles[filePath];
    const isBuffer = Buffer.isBuffer(content);

    if (isBuffer || (typeof content === 'string' && content.length > 50000)) {
      // Create blob for binary or large files
      const blobResult = await createBlob(githubToken, repoOwner, repoName, content, isBuffer ? 'base64' : 'utf-8');
      treeItems.push({
        path: filePath,
        mode: '100644',
        type: 'blob',
        sha: blobResult.sha,
      });
    } else {
      // Inline UTF-8 string content
      treeItems.push({
        path: filePath,
        mode: '100644',
        type: 'blob',
        content: String(content),
      });
    }
  }

  // 3. Create Git Tree
  const treePayload = {
    tree: treeItems,
  };
  if (baseTreeSha) {
    treePayload.base_tree = baseTreeSha;
  }

  const treeRes = await fetch(`${GITHUB_API_BASE}/repos/${repoOwner}/${repoName}/git/trees`, {
    method: 'POST',
    headers,
    body: JSON.stringify(treePayload),
  });

  const treeData = await treeRes.json();
  if (!treeRes.ok) {
    throw new Error(`Failed to create Git Tree (${treeRes.status}): ${treeData.message || treeRes.statusText}`);
  }
  const newTreeSha = treeData.sha;

  // 4. Create Git Commit
  const commitPayload = {
    message: commitMessage,
    tree: newTreeSha,
    parents: baseCommitSha ? [baseCommitSha] : [],
  };

  const newCommitRes = await fetch(`${GITHUB_API_BASE}/repos/${repoOwner}/${repoName}/git/commits`, {
    method: 'POST',
    headers,
    body: JSON.stringify(commitPayload),
  });

  const newCommitData = await newCommitRes.json();
  if (!newCommitRes.ok) {
    throw new Error(`Failed to create Git Commit (${newCommitRes.status}): ${newCommitData.message || newCommitRes.statusText}`);
  }
  const newCommitSha = newCommitData.sha;

  // 5. Update Branch Reference
  let refUpdateRes = await fetch(`${GITHUB_API_BASE}/repos/${repoOwner}/${repoName}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      sha: newCommitSha,
      force: true,
    }),
  });

  if (!refUpdateRes.ok) {
    // If ref doesn't exist yet, create it
    refUpdateRes = await fetch(`${GITHUB_API_BASE}/repos/${repoOwner}/${repoName}/git/refs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ref: `refs/heads/${branch}`,
        sha: newCommitSha,
      }),
    });
  }

  if (!refUpdateRes.ok) {
    const refData = await refUpdateRes.json();
    throw new Error(`Failed to update Git branch ref (${refUpdateRes.status}): ${refData.message || refUpdateRes.statusText}`);
  }

  return {
    success: true,
    commitSha: newCommitSha,
    commitUrl: `https://github.com/${repoOwner}/${repoName}/commit/${newCommitSha}`,
    filesPushed: fileKeys.length,
    fileList: fileKeys,
    branch,
    mock: false,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 4. Full 1-Click Deployment to GitHub
 * Creates repo and pushes all files in one seamless operation
 */
async function deployToGitHub({
  githubToken,
  repoName,
  fileMap,
  isPrivate = false,
  description = '',
  commitMessage = 'Initial commit from SitePrompter Web',
  branch = 'main',
  mock = false,
}) {
  const repoResult = await createRepository(githubToken, repoName, { isPrivate, description, mock });
  const pushResult = await pushProjectFiles(githubToken, repoResult.owner, repoResult.name, fileMap, commitMessage, { branch, mock });

  return {
    success: true,
    repoUrl: repoResult.repoUrl,
    cloneUrl: repoResult.cloneUrl,
    commitUrl: pushResult.commitUrl,
    commitSha: pushResult.commitSha,
    owner: repoResult.owner,
    name: repoResult.name,
    filesPushed: pushResult.filesPushed,
    branch: pushResult.branch,
    mock: Boolean(repoResult.mock || pushResult.mock),
  };
}

/**
 * 5. Standalone Mock Simulator for offline testing
 */
function mockDeployGitHub(repoName, fileMap, options = {}) {
  const cleanName = sanitizeRepoName(repoName);
  const normalized = normalizeFileMap(fileMap);
  const fileKeys = Object.keys(normalized);
  const mockSha = `mock_sha_${Math.random().toString(36).substring(2, 10)}`;

  return {
    success: true,
    repoUrl: `https://github.com/siteprompter-demo/${cleanName}`,
    cloneUrl: `https://github.com/siteprompter-demo/${cleanName}.git`,
    commitUrl: `https://github.com/siteprompter-demo/${cleanName}/commit/${mockSha}`,
    commitSha: mockSha,
    owner: 'siteprompter-demo',
    name: cleanName,
    filesPushed: fileKeys.length,
    fileList: fileKeys,
    branch: options.branch || 'main',
    mock: true,
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  sanitizeRepoName,
  normalizeFileMap,
  createRepository,
  createBlob,
  pushProjectFiles,
  deployToGitHub,
  mockDeployGitHub,
  isMockMode,
};
