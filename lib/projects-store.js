/**
 * SitePrompter Web - Multi-User Persistent Storage & Daily Quota Manager
 * Handles Auth, Workspaces, Projects, Billing, Daily Quotas & BYOK Keys
 */

// User storage map (in-memory + persistence fallback)
const usersStore = new Map();

// Plan Configurations
const PLAN_CONFIGS = {
  free: {
    id: 'free',
    name: 'Free Starter',
    dailyCredits: 150,
    costPerPrompt: 10,
    promptsPerDay: 15,
    priceMonthly: 0,
    features: ['150 Günlük Kredi (15 Site Analiz Hakkı)', 'React 19 & Vanilla HTML Çıktısı', 'Babel Canlı Sandbox', 'Topluluk Desteği']
  },
  pro: {
    id: 'pro',
    name: 'Pro Developer',
    dailyCredits: 600,
    costPerPrompt: 10,
    promptsPerDay: 60,
    priceMonthly: 19,
    features: ['600 Günlük Kredi (60 Site Analiz Hakkı)', 'Claude 3.7 & GPT-4o Canlı Akış', 'Tüm 5 Framework Desteği', '1-Click GitHub & Vercel Dağıtım', 'Çoklu Sayfa Tarayıcı']
  },
  agency: {
    id: 'agency',
    name: 'Agency & Scale',
    dailyCredits: 1500,
    costPerPrompt: 10,
    promptsPerDay: 150,
    priceMonthly: 79,
    features: ['1,500 Günlük Kredi (150 Site Analiz Hakkı)', 'Sınırsız Kendi API Anahtarın (BYOK)', 'Öncelikli SLA & Hızlı Sunucular', 'Sınırsız Çalışma Alanı']
  }
};

// Global DB Structure
const db = {
  workspaces: [
    { id: 'ws_default', name: 'Varsayılan Çalışma Alanı', icon: 'fa-layer-group', projectCount: 0, createdAt: new Date().toISOString() }
  ],
  projects: [],
  byokKeys: {
    anthropic: '',
    openai: '',
    deepseek: '',
    gemini: ''
  }
};

/**
 * Get or create a persistent user with daily quota tracking
 * @param {string} userId 
 * @returns {object}
 */
function getUser(userId = 'usr_guest_default') {
  const cleanId = String(userId || 'usr_guest_default').trim();
  
  if (!usersStore.has(cleanId)) {
    const now = Date.now();
    usersStore.set(cleanId, {
      id: cleanId,
      name: cleanId.startsWith('usr_guest') ? 'Misafir Kullanıcı' : 'Kullanıcı',
      email: `${cleanId}@siteprompter.io`,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      plan: 'Free Starter',
      planId: 'free',
      credits: 150,
      creditsLimit: 150,
      costPerPrompt: 10,
      workspaceId: 'ws_default',
      lastReset: now,
      nextReset: now + 24 * 60 * 60 * 1000,
      totalPromptsGenerated: 0,
      createdAt: new Date().toISOString()
    });
  }

  const user = usersStore.get(cleanId);
  const now = Date.now();

  // Automatic 24-Hour Quota Reset Check
  if (now >= user.nextReset) {
    const planConfig = PLAN_CONFIGS[user.planId] || PLAN_CONFIGS.free;
    user.credits = planConfig.dailyCredits;
    user.creditsLimit = planConfig.dailyCredits;
    user.lastReset = now;
    user.nextReset = now + 24 * 60 * 60 * 1000;
  }

  // Calculate live time remaining until reset
  user.timeUntilResetMs = Math.max(0, user.nextReset - now);
  user.remainingPrompts = Math.floor(user.credits / 10);

  return user;
}

/**
 * Update user details
 */
function updateUser(userId, updates = {}) {
  const user = getUser(userId);
  Object.assign(user, updates);
  return user;
}

/**
 * Deduct credits for a generation (default 10 credits per site prompt)
 */
function deductCredits(userId, amount = 10) {
  const user = getUser(userId);
  
  if (user.credits < amount) {
    return {
      success: false,
      error: 'INSUFFICIENT_CREDITS',
      message: 'Kredi limiti tükendi! Günlük ücretsiz analiz hakkınızı (150 kredi) kullandınız.',
      credits: user.credits,
      creditsLimit: user.creditsLimit,
      required: amount,
      timeUntilResetMs: user.timeUntilResetMs,
      nextReset: user.nextReset
    };
  }

  user.credits -= amount;
  user.totalPromptsGenerated += 1;

  return {
    success: true,
    credits: user.credits,
    creditsLimit: user.creditsLimit,
    remainingPrompts: Math.floor(user.credits / 10),
    timeUntilResetMs: user.timeUntilResetMs,
    nextReset: user.nextReset
  };
}

/**
 * Upgrade plan & add credits
 */
function upgradePlan(userId, planId = 'pro') {
  const user = getUser(userId);
  const config = PLAN_CONFIGS[planId] || PLAN_CONFIGS.pro;

  user.planId = config.id;
  user.plan = config.name;
  user.credits = config.dailyCredits;
  user.creditsLimit = config.dailyCredits;
  user.costPerPrompt = config.costPerPrompt;
  user.nextReset = Date.now() + 24 * 60 * 60 * 1000;
  user.remainingPrompts = Math.floor(user.credits / 10);

  return {
    success: true,
    user,
    plan: config
  };
}

module.exports = {
  getUser,
  updateUser,
  deductCredits,
  upgradePlan,
  PLAN_CONFIGS,
  getWorkspaces: () => db.workspaces,
  createWorkspace: (name) => {
    const ws = {
      id: `ws_${Date.now()}`,
      name: name || 'Yeni Çalışma Alanı',
      icon: 'fa-folder',
      projectCount: 0,
      createdAt: new Date().toISOString()
    };
    db.workspaces.push(ws);
    return ws;
  },
  getProjects: (workspaceId) => {
    if (workspaceId) {
      return db.projects.filter(p => p.workspaceId === workspaceId);
    }
    return db.projects;
  },
  getProjectById: (id) => db.projects.find(p => p.id === id),
  saveProject: (project) => {
    const existingIndex = db.projects.findIndex(p => p.id === project.id);
    if (existingIndex >= 0) {
      db.projects[existingIndex] = {
        ...db.projects[existingIndex],
        ...project,
        updatedAt: new Date().toISOString()
      };
      return db.projects[existingIndex];
    } else {
      const newProj = {
        id: project.id || `proj_${Date.now()}`,
        title: project.title || 'İsimsiz Proje',
        url: project.url || 'https://example.com',
        framework: project.framework || 'react-tailwind',
        workspaceId: project.workspaceId || 'ws_default',
        favorite: !!project.favorite,
        tokensEstimate: project.tokensEstimate || 3500,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pages: project.pages || ['/'],
        previewUrl: project.previewUrl || '',
        tags: project.tags || ['React', 'Tailwind'],
        code: project.code || ''
      };
      db.projects.unshift(newProj);
      return newProj;
    }
  },
  deleteProject: (id) => {
    const initialLen = db.projects.length;
    db.projects = db.projects.filter(p => p.id !== id);
    return db.projects.length < initialLen;
  },
  toggleFavorite: (id) => {
    const proj = db.projects.find(p => p.id === id);
    if (proj) {
      proj.favorite = !proj.favorite;
      proj.updatedAt = new Date().toISOString();
      return proj;
    }
    return null;
  },
  getByokKeys: () => {
    const masked = {};
    for (const [provider, key] of Object.entries(db.byokKeys)) {
      if (key && key.length > 8) {
        masked[provider] = `${key.slice(0, 4)}...${key.slice(-4)}`;
      } else if (key) {
        masked[provider] = '••••••••';
      } else {
        masked[provider] = '';
      }
    }
    return { keys: masked, configured: Object.keys(db.byokKeys).filter(k => !!db.byokKeys[k]) };
  },
  saveByokKeys: (newKeys = {}) => {
    for (const [provider, key] of Object.entries(newKeys)) {
      if (key !== undefined) {
        db.byokKeys[provider] = key ? key.trim() : '';
      }
    }
    return true;
  },
  getRawByokKey: (provider) => db.byokKeys[provider] || ''
};
