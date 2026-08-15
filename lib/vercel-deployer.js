/**
 * SitePrompter - Vercel 1-Click Deployment Engine
 * Integrates with Vercel REST API (v13 Deployments)
 * Supports file payload serialization, framework presets, status polling, and mock mode
 */

const VERCEL_API_BASE = 'https://api.vercel.com';

/**
 * Supported Framework Presets for Vercel
 */
const FRAMEWORK_PRESETS = {
  'nextjs': 'nextjs',
  'nextjs-shadcn': 'nextjs',
  'next': 'nextjs',
  'react-tailwind': 'vite',
  'vite': 'vite',
  'vue3-tailwind': 'vite',
  'svelte': 'sveltekit',
  'vanilla-html': null, // static
};

/**
 * Sanitizes project name to Vercel requirements
 * Allowed: lowercase letters, numbers, and hyphens (up to 100 chars)
 */
function sanitizeProjectName(name = '') {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100) || 'siteprompter-clone';
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
 * Converts various file representations into Vercel API files array
 * Structure: [ { file: 'path/to/file.ext', data: 'content', encoding: 'utf-8' | 'base64' } ]
 */
function formatVercelFiles(filesMap) {
  if (!filesMap) return [];
  const filesList = [];

  if (Array.isArray(filesMap)) {
    for (const item of filesMap) {
      if (!item) continue;
      const filePath = (item.file || item.path || '').replace(/^[./\\]+/, '').replace(/\\/g, '/');
      if (!filePath) continue;

      const isBuffer = Buffer.isBuffer(item.data !== undefined ? item.data : item.content);
      const content = item.data !== undefined ? item.data : (item.content !== undefined ? item.content : '');

      if (isBuffer) {
        filesList.push({
          file: filePath,
          data: content.toString('base64'),
          encoding: 'base64',
        });
      } else {
        filesList.push({
          file: filePath,
          data: String(content),
          encoding: 'utf-8',
        });
      }
    }
    return filesList;
  }

  if (typeof filesMap === 'object') {
    for (const [key, value] of Object.entries(filesMap)) {
      const filePath = key.replace(/^[./\\]+/, '').replace(/\\/g, '/');
      if (!filePath) continue;

      const isBuffer = Buffer.isBuffer(value);
      if (isBuffer) {
        filesList.push({
          file: filePath,
          data: value.toString('base64'),
          encoding: 'base64',
        });
      } else {
        filesList.push({
          file: filePath,
          data: String(value),
          encoding: 'utf-8',
        });
      }
    }
  }

  return filesList;
}

/**
 * Creates headers for Vercel REST API requests
 */
function getVercelHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * 1. Create a Vercel Deployment via REST API
 * @param {string} vercelToken - Vercel API Token
 * @param {string} projectName - Project name
 * @param {object|Array} filesMap - Project files
 * @param {string} framework - Framework identifier (e.g. 'nextjs', 'vite', 'vanilla-html')
 * @param {object} options - { target: 'production', teamId: string, mock: boolean, projectSettings: object }
 * @returns {Promise<{ success: boolean, id: string, name: string, url: string, deploymentUrl: string, readyState: string, framework: string, mock?: boolean }>}
 */
async function createVercelDeployment(vercelToken, projectName, filesMap, framework = 'nextjs', options = {}) {
  const cleanName = sanitizeProjectName(projectName);
  const formattedFiles = formatVercelFiles(filesMap);

  if (formattedFiles.length === 0) {
    throw new Error('Cannot deploy empty project: filesMap must contain at least one file');
  }

  const vercelFramework = FRAMEWORK_PRESETS[framework] !== undefined
    ? FRAMEWORK_PRESETS[framework]
    : framework;

  // Handle Mock Mode
  if (isMockMode(vercelToken, options)) {
    const mockId = `dpl_${Math.random().toString(36).substring(2, 12)}`;
    const mockHost = `${cleanName}-${Math.random().toString(36).substring(2, 6)}.vercel.app`;
    return {
      success: true,
      id: mockId,
      name: cleanName,
      url: mockHost,
      deploymentUrl: `https://${mockHost}`,
      inspectorUrl: `https://vercel.com/siteprompter-team/${cleanName}/${mockId}`,
      readyState: 'READY',
      framework: vercelFramework || 'static',
      filesCount: formattedFiles.length,
      target: options.target || 'production',
      mock: true,
      createdAt: Date.now(),
      message: 'Simulated Vercel deployment (Mock Mode)',
    };
  }

  let endpoint = `${VERCEL_API_BASE}/v13/deployments`;
  if (options.teamId) {
    endpoint += `?teamId=${encodeURIComponent(options.teamId)}`;
  }

  const payload = {
    name: cleanName,
    project: cleanName,
    files: formattedFiles,
    target: options.target || 'production',
  };

  if (vercelFramework) {
    payload.projectSettings = {
      framework: vercelFramework,
      ...(options.projectSettings || {}),
    };
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: getVercelHeaders(vercelToken),
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.error?.message || response.statusText;
    const errorCode = data.error?.code ? ` [${data.error.code}]` : '';
    throw new Error(`Vercel API Error (${response.status}): ${errorMsg}${errorCode}`);
  }

  const deploymentHost = data.url || `${cleanName}.vercel.app`;

  return {
    success: true,
    id: data.id,
    name: data.name || cleanName,
    url: deploymentHost,
    deploymentUrl: `https://${deploymentHost}`,
    inspectorUrl: data.inspectorUrl || `https://vercel.com/deployments/${data.id}`,
    readyState: data.readyState || 'INITIALIZING',
    framework: vercelFramework || 'static',
    filesCount: formattedFiles.length,
    mock: false,
    createdAt: data.createdAt || Date.now(),
  };
}

/**
 * 2. Polls Vercel deployment until READY or ERROR
 * @param {string} vercelToken
 * @param {string} deploymentId
 * @param {object} options - { maxAttempts: number, intervalMs: number, teamId: string, mock: boolean }
 * @returns {Promise<{ readyState: string, url: string, deploymentUrl: string, id: string, mock?: boolean }>}
 */
async function pollDeploymentStatus(vercelToken, deploymentId, options = {}) {
  const maxAttempts = options.maxAttempts || 30;
  const intervalMs = options.intervalMs || 2000;

  if (isMockMode(vercelToken, options)) {
    return {
      success: true,
      id: deploymentId,
      readyState: 'READY',
      url: options.url || 'mock-app.vercel.app',
      deploymentUrl: options.deploymentUrl || 'https://mock-app.vercel.app',
      mock: true,
      message: 'Deployment is READY (Mock Poll)',
    };
  }

  let endpoint = `${VERCEL_API_BASE}/v13/deployments/${deploymentId}`;
  if (options.teamId) {
    endpoint += `?teamId=${encodeURIComponent(options.teamId)}`;
  }

  const headers = getVercelHeaders(vercelToken);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(endpoint, { headers });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Failed to check deployment status (${response.status}): ${data.error?.message || response.statusText}`);
    }

    const state = data.readyState; // INITIALIZING, ANALYZING, BUILDING, DEPLOYING, READY, ERROR, CANCELED

    if (state === 'READY') {
      const finalHost = data.url || `${data.name}.vercel.app`;
      return {
        success: true,
        id: data.id,
        name: data.name,
        readyState: 'READY',
        url: finalHost,
        deploymentUrl: `https://${finalHost}`,
        inspectorUrl: data.inspectorUrl,
        alias: data.alias || [],
        mock: false,
      };
    }

    if (state === 'ERROR' || state === 'CANCELED') {
      throw new Error(`Deployment failed with state: ${state}. ${data.errorMessage || ''}`);
    }

    // Wait before next poll attempt
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Deployment polling timed out after ${maxAttempts} attempts (~${(maxAttempts * intervalMs) / 1000}s)`);
}

/**
 * 3. Full 1-Click Deployment to Vercel
 * Creates deployment and optionally polls until ready
 */
async function deployToVercel({
  vercelToken,
  projectName,
  filesMap,
  framework = 'nextjs',
  poll = true,
  target = 'production',
  teamId = null,
  mock = false,
  pollOptions = {},
}) {
  const initial = await createVercelDeployment(vercelToken, projectName, filesMap, framework, {
    target,
    teamId,
    mock,
  });

  if (initial.mock || !poll || initial.readyState === 'READY') {
    return initial;
  }

  const polled = await pollDeploymentStatus(vercelToken, initial.id, {
    teamId,
    mock,
    url: initial.url,
    deploymentUrl: initial.deploymentUrl,
    ...pollOptions,
  });

  return {
    ...initial,
    ...polled,
  };
}

/**
 * 4. Standalone Mock Simulator for offline testing
 */
function mockDeployVercel(projectName, filesMap, framework = 'nextjs') {
  const cleanName = sanitizeProjectName(projectName);
  const formatted = formatVercelFiles(filesMap);
  const mockId = `dpl_${Math.random().toString(36).substring(2, 12)}`;
  const mockUrl = `${cleanName}.vercel.app`;

  return {
    success: true,
    id: mockId,
    name: cleanName,
    url: mockUrl,
    deploymentUrl: `https://${mockUrl}`,
    inspectorUrl: `https://vercel.com/demo/${cleanName}/${mockId}`,
    readyState: 'READY',
    framework: FRAMEWORK_PRESETS[framework] || framework,
    filesCount: formatted.length,
    mock: true,
    createdAt: Date.now(),
  };
}

module.exports = {
  sanitizeProjectName,
  formatVercelFiles,
  FRAMEWORK_PRESETS,
  createVercelDeployment,
  pollDeploymentStatus,
  deployToVercel,
  mockDeployVercel,
  isMockMode,
};
