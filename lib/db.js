/**
 * SitePrompter Database Engine
 * Persistent, high-performance embedded JSON database with indexing and auto-initialization.
 * Manages users, workspaces, projects, designTokens, and apiKeys.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Default database path in project data folder
const DEFAULT_DB_PATH = path.join(__dirname, '..', 'data', 'store.json');

// Secret for key encryption
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || process.env.JWT_SECRET || 'siteprompter-production-secret-aes-key-32b!';
const KEY_BUFFER = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();

/**
 * Generate a unique ID with prefix and timestamp
 */
function generateId(prefix = 'id') {
  const timestamp = Date.now().toString(36);
  const randomStr = crypto.randomBytes(4).toString('hex');
  return `${prefix}_${timestamp}_${randomStr}`;
}

/**
 * Mask an API key for safe UI display
 */
function maskKey(key) {
  if (!key || typeof key !== 'string') return '';
  if (key.length <= 8) return '••••••••';
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
}

/**
 * AES-256-GCM Encryption helper
 */
function encryptSecret(plainText) {
  if (!plainText) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY_BUFFER, iv);
  let encrypted = cipher.update(String(plainText), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag,
  };
}

/**
 * AES-256-GCM Decryption helper
 */
function decryptSecret(encryptedHex, ivHex, tagHex) {
  if (!encryptedHex || !ivHex || !tagHex) return null;
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY_BUFFER, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('[DB] Failed to decrypt secret:', err.message);
    return null;
  }
}

/**
 * Embedded Database Class
 */
class Database {
  constructor(filePath = DEFAULT_DB_PATH, options = {}) {
    this.filePath = filePath;
    this.autoSave = options.autoSave !== undefined ? options.autoSave : true;
    this.inMemoryOnly = options.inMemoryOnly || false;

    // Collections
    this.collections = {
      users: [],
      workspaces: [],
      projects: [],
      designTokens: [],
      apiKeys: [],
    };

    // Fast lookup in-memory indices
    this.indices = {
      usersById: new Map(),
      usersByEmail: new Map(),
      workspacesById: new Map(),
      workspacesByUserId: new Map(),
      projectsById: new Map(),
      projectsByWorkspaceId: new Map(),
      designTokensById: new Map(),
      designTokensByProjectId: new Map(),
      apiKeysById: new Map(),
      apiKeysByUserId: new Map(),
    };

    this.init();
  }

  /**
   * Initialize database and load data from disk
   */
  init() {
    if (this.inMemoryOnly) {
      this.rebuildIndices();
      return;
    }

    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.filePath)) {
        const rawData = fs.readFileSync(this.filePath, 'utf8');
        if (rawData.trim()) {
          const parsed = JSON.parse(rawData);
          this.collections = {
            users: Array.isArray(parsed.users) ? parsed.users : [],
            workspaces: Array.isArray(parsed.workspaces) ? parsed.workspaces : [],
            projects: Array.isArray(parsed.projects) ? parsed.projects : [],
            designTokens: Array.isArray(parsed.designTokens) ? parsed.designTokens : [],
            apiKeys: Array.isArray(parsed.apiKeys) ? parsed.apiKeys : [],
          };
        }
      } else {
        // Create initial empty structure
        this.save();
      }
    } catch (err) {
      console.warn(`[DB] Error initializing database from ${this.filePath}:`, err.message);
      // Fallback to fresh collections
    }

    this.rebuildIndices();
  }

  /**
   * Rebuild all in-memory index maps for O(1) lookups
   */
  rebuildIndices() {
    this.indices.usersById.clear();
    this.indices.usersByEmail.clear();
    for (const u of this.collections.users) {
      this.indices.usersById.set(u.id, u);
      if (u.email) {
        this.indices.usersByEmail.set(u.email.toLowerCase(), u);
      }
    }

    this.indices.workspacesById.clear();
    this.indices.workspacesByUserId.clear();
    for (const w of this.collections.workspaces) {
      this.indices.workspacesById.set(w.id, w);
      const list = this.indices.workspacesByUserId.get(w.userId) || [];
      list.push(w);
      this.indices.workspacesByUserId.set(w.userId, list);
    }

    this.indices.projectsById.clear();
    this.indices.projectsByWorkspaceId.clear();
    for (const p of this.collections.projects) {
      this.indices.projectsById.set(p.id, p);
      const list = this.indices.projectsByWorkspaceId.get(p.workspaceId) || [];
      list.push(p);
      this.indices.projectsByWorkspaceId.set(p.workspaceId, list);
    }

    this.indices.designTokensById.clear();
    this.indices.designTokensByProjectId.clear();
    for (const t of this.collections.designTokens) {
      this.indices.designTokensById.set(t.id, t);
      this.indices.designTokensByProjectId.set(t.projectId, t);
    }

    this.indices.apiKeysById.clear();
    this.indices.apiKeysByUserId.clear();
    for (const k of this.collections.apiKeys) {
      this.indices.apiKeysById.set(k.id, k);
      const list = this.indices.apiKeysByUserId.get(k.userId) || [];
      list.push(k);
      this.indices.apiKeysByUserId.set(k.userId, list);
    }
  }

  /**
   * Persist state to disk atomically
   */
  save() {
    if (this.inMemoryOnly) return;
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const tempFile = `${this.filePath}.${Date.now()}.${Math.random().toString(36).slice(2, 7)}.tmp`;
      const dataStr = JSON.stringify(this.collections, null, 2);
      fs.writeFileSync(tempFile, dataStr, 'utf8');
      fs.renameSync(tempFile, this.filePath);
    } catch (err) {
      console.error(`[DB] Error saving to ${this.filePath}:`, err.message);
    }
  }

  /**
   * Reset database collections
   */
  clear() {
    this.collections = {
      users: [],
      workspaces: [],
      projects: [],
      designTokens: [],
      apiKeys: [],
    };
    this.rebuildIndices();
    if (this.autoSave) {
      this.save();
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // USER CRUD & QUERIES
  // ───────────────────────────────────────────────────────────────────────────

  createUser(data) {
    if (!data) throw new Error('User data is required');

    const id = data.id || generateId('usr');
    const now = new Date().toISOString();
    const email = data.email ? data.email.trim().toLowerCase() : null;

    if (email && this.getUserByEmail(email)) {
      throw new Error(`User with email "${email}" already exists`);
    }

    const plan = ['free', 'pro', 'agency'].includes(data.plan) ? data.plan : 'free';
    const credits = typeof data.credits === 'number' ? data.credits : (plan === 'agency' ? 2000 : plan === 'pro' ? 500 : 50);

    const newUser = {
      id,
      email,
      name: data.name || (email ? email.split('@')[0] : 'Anonymous User'),
      passwordHash: data.passwordHash || null,
      salt: data.salt || null,
      plan,
      credits,
      isGuest: Boolean(data.isGuest),
      guestId: data.guestId || null,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };

    this.collections.users.push(newUser);
    this.rebuildIndices();
    if (this.autoSave) this.save();

    return { ...newUser };
  }

  getUserById(id) {
    if (!id) return null;
    const user = this.indices.usersById.get(id);
    return user ? { ...user } : null;
  }

  getUserByEmail(email) {
    if (!email) return null;
    const user = this.indices.usersByEmail.get(email.toLowerCase());
    return user ? { ...user } : null;
  }

  getUserByGuestId(guestId) {
    if (!guestId) return null;
    const user = this.collections.users.find(u => u.isGuest && (u.guestId === guestId || u.id === guestId));
    return user ? { ...user } : null;
  }

  updateUser(id, updates) {
    const user = this.indices.usersById.get(id);
    if (!user) return null;

    if (updates.email && updates.email.toLowerCase() !== user.email?.toLowerCase()) {
      const existing = this.getUserByEmail(updates.email);
      if (existing && existing.id !== id) {
        throw new Error(`Email "${updates.email}" is already in use`);
      }
      user.email = updates.email.trim().toLowerCase();
    }

    if (updates.name !== undefined) user.name = updates.name;
    if (updates.plan !== undefined && ['free', 'pro', 'agency'].includes(updates.plan)) user.plan = updates.plan;
    if (updates.credits !== undefined) user.credits = Number(updates.credits);
    if (updates.passwordHash !== undefined) user.passwordHash = updates.passwordHash;
    if (updates.salt !== undefined) user.salt = updates.salt;
    if (updates.isGuest !== undefined) user.isGuest = Boolean(updates.isGuest);

    user.updatedAt = new Date().toISOString();

    this.rebuildIndices();
    if (this.autoSave) this.save();

    return { ...user };
  }

  deleteUser(id) {
    const idx = this.collections.users.findIndex(u => u.id === id);
    if (idx === -1) return false;

    this.collections.users.splice(idx, 1);

    // Also delete user workspaces & associated projects
    const userWorkspaces = this.getWorkspacesByUserId(id);
    for (const ws of userWorkspaces) {
      this.deleteWorkspace(ws.id);
    }

    // Delete api keys
    this.collections.apiKeys = this.collections.apiKeys.filter(k => k.userId !== id);

    this.rebuildIndices();
    if (this.autoSave) this.save();

    return true;
  }

  listUsers(query = {}) {
    let list = this.collections.users.map(u => ({ ...u }));
    if (query.isGuest !== undefined) {
      list = list.filter(u => u.isGuest === query.isGuest);
    }
    if (query.plan) {
      list = list.filter(u => u.plan === query.plan);
    }
    return list;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // WORKSPACE CRUD & QUERIES
  // ───────────────────────────────────────────────────────────────────────────

  createWorkspace(data) {
    if (!data || !data.userId) throw new Error('Workspace requires a userId');

    const id = data.id || generateId('ws');
    const now = new Date().toISOString();
    const isDefault = Boolean(data.isDefault);

    if (isDefault) {
      // Unset previous defaults for this user
      for (const w of this.collections.workspaces) {
        if (w.userId === data.userId && w.isDefault) {
          w.isDefault = false;
        }
      }
    }

    const newWorkspace = {
      id,
      userId: data.userId,
      name: data.name || 'Default Workspace',
      isDefault,
      settings: data.settings || {},
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };

    this.collections.workspaces.push(newWorkspace);
    this.rebuildIndices();
    if (this.autoSave) this.save();

    return { ...newWorkspace };
  }

  getWorkspaceById(id) {
    if (!id) return null;
    const ws = this.indices.workspacesById.get(id);
    return ws ? { ...ws } : null;
  }

  getWorkspacesByUserId(userId) {
    if (!userId) return [];
    const list = this.indices.workspacesByUserId.get(userId) || [];
    return list.map(w => ({ ...w }));
  }

  getDefaultWorkspace(userId) {
    if (!userId) return null;
    const list = this.getWorkspacesByUserId(userId);
    const def = list.find(w => w.isDefault);
    return def || (list.length > 0 ? list[0] : null);
  }

  updateWorkspace(id, updates) {
    const ws = this.indices.workspacesById.get(id);
    if (!ws) return null;

    if (updates.name !== undefined) ws.name = updates.name;
    if (updates.settings !== undefined) ws.settings = { ...ws.settings, ...updates.settings };

    if (updates.isDefault) {
      for (const w of this.collections.workspaces) {
        if (w.userId === ws.userId) {
          w.isDefault = (w.id === id);
        }
      }
    }

    ws.updatedAt = new Date().toISOString();

    this.rebuildIndices();
    if (this.autoSave) this.save();

    return { ...ws };
  }

  deleteWorkspace(id) {
    const idx = this.collections.workspaces.findIndex(w => w.id === id);
    if (idx === -1) return false;

    this.collections.workspaces.splice(idx, 1);

    // Delete projects in this workspace
    const workspaceProjects = this.getProjectsByWorkspaceId(id);
    for (const p of workspaceProjects) {
      this.deleteProject(p.id);
    }

    this.rebuildIndices();
    if (this.autoSave) this.save();

    return true;
  }

  listWorkspaces(query = {}) {
    let list = this.collections.workspaces.map(w => ({ ...w }));
    if (query.userId) {
      list = list.filter(w => w.userId === query.userId);
    }
    return list;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PROJECT CRUD & QUERIES
  // ───────────────────────────────────────────────────────────────────────────

  createProject(data) {
    if (!data || !data.workspaceId) throw new Error('Project requires a workspaceId');

    const id = data.id || generateId('proj');
    const now = new Date().toISOString();

    const newProject = {
      id,
      workspaceId: data.workspaceId,
      userId: data.userId || null,
      title: data.title || data.targetUrl || 'Untitled Project',
      targetUrl: data.targetUrl || '',
      framework: data.framework || 'react-tailwind',
      telemetryData: data.telemetryData || null,
      generatedCode: data.generatedCode || null,
      multiPageData: data.multiPageData || null,
      isFavorite: Boolean(data.isFavorite),
      tags: Array.isArray(data.tags) ? data.tags : [],
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };

    this.collections.projects.push(newProject);
    this.rebuildIndices();
    if (this.autoSave) this.save();

    return { ...newProject };
  }

  getProjectById(id) {
    if (!id) return null;
    const project = this.indices.projectsById.get(id);
    return project ? { ...project } : null;
  }

  getProjectsByWorkspaceId(workspaceId, options = {}) {
    if (!workspaceId) return [];
    let list = this.indices.projectsByWorkspaceId.get(workspaceId) || [];
    list = list.map(p => ({ ...p }));

    if (options.isFavorite !== undefined) {
      list = list.filter(p => p.isFavorite === options.isFavorite);
    }

    if (options.framework) {
      list = list.filter(p => p.framework === options.framework);
    }

    if (options.search) {
      const q = options.search.toLowerCase();
      list = list.filter(p => 
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.targetUrl && p.targetUrl.toLowerCase().includes(q)) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    // Sort order (default: newest first)
    const sortBy = options.sortBy || 'createdAt';
    const sortDir = options.sortDir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      const valA = a[sortBy] || '';
      const valB = b[sortBy] || '';
      return valA > valB ? sortDir : (valA < valB ? -sortDir : 0);
    });

    if (options.limit && options.limit > 0) {
      const offset = options.offset || 0;
      list = list.slice(offset, offset + options.limit);
    }

    return list;
  }

  updateProject(id, updates) {
    const project = this.indices.projectsById.get(id);
    if (!project) return null;

    const fields = [
      'workspaceId', 'userId', 'title', 'targetUrl', 'framework',
      'telemetryData', 'generatedCode', 'multiPageData', 'isFavorite', 'tags'
    ];

    for (const field of fields) {
      if (updates[field] !== undefined) {
        project[field] = updates[field];
      }
    }

    project.updatedAt = new Date().toISOString();

    this.rebuildIndices();
    if (this.autoSave) this.save();

    return { ...project };
  }

  toggleFavorite(id) {
    const project = this.indices.projectsById.get(id);
    if (!project) return null;
    project.isFavorite = !project.isFavorite;
    project.updatedAt = new Date().toISOString();

    this.rebuildIndices();
    if (this.autoSave) this.save();

    return { ...project };
  }

  deleteProject(id) {
    const idx = this.collections.projects.findIndex(p => p.id === id);
    if (idx === -1) return false;

    this.collections.projects.splice(idx, 1);

    // Delete associated design tokens
    this.deleteDesignTokensByProjectId(id);

    this.rebuildIndices();
    if (this.autoSave) this.save();

    return true;
  }

  listProjects(query = {}) {
    let list = this.collections.projects.map(p => ({ ...p }));
    if (query.workspaceId) {
      list = list.filter(p => p.workspaceId === query.workspaceId);
    }
    if (query.userId) {
      list = list.filter(p => p.userId === query.userId);
    }
    if (query.framework) {
      list = list.filter(p => p.framework === query.framework);
    }
    if (query.isFavorite !== undefined) {
      list = list.filter(p => p.isFavorite === query.isFavorite);
    }
    return list;
  }

  searchProjects(searchTerm, workspaceId = null) {
    if (!searchTerm) return [];
    const q = searchTerm.toLowerCase();
    let list = this.collections.projects;
    if (workspaceId) {
      list = list.filter(p => p.workspaceId === workspaceId);
    }
    return list
      .filter(p => 
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.targetUrl && p.targetUrl.toLowerCase().includes(q)) ||
        (p.framework && p.framework.toLowerCase().includes(q)) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
      )
      .map(p => ({ ...p }));
  }

  // ───────────────────────────────────────────────────────────────────────────
  // DESIGN TOKENS CRUD
  // ───────────────────────────────────────────────────────────────────────────

  createOrUpdateDesignTokens(data) {
    if (!data || !data.projectId) throw new Error('Design tokens require a projectId');

    const now = new Date().toISOString();
    let tokenRecord = this.indices.designTokensByProjectId.get(data.projectId);

    if (tokenRecord) {
      if (data.tailwindConfig !== undefined) tokenRecord.tailwindConfig = data.tailwindConfig;
      if (data.figmaTokens !== undefined) tokenRecord.figmaTokens = data.figmaTokens;
      if (data.cssTheme !== undefined) tokenRecord.cssTheme = data.cssTheme;
      if (data.colors !== undefined) tokenRecord.colors = data.colors;
      if (data.typography !== undefined) tokenRecord.typography = data.typography;
      tokenRecord.updatedAt = now;
    } else {
      const id = data.id || generateId('tok');
      tokenRecord = {
        id,
        projectId: data.projectId,
        tailwindConfig: data.tailwindConfig || null,
        figmaTokens: data.figmaTokens || null,
        cssTheme: data.cssTheme || null,
        colors: data.colors || [],
        typography: data.typography || {},
        createdAt: data.createdAt || now,
        updatedAt: data.updatedAt || now,
      };
      this.collections.designTokens.push(tokenRecord);
    }

    this.rebuildIndices();
    if (this.autoSave) this.save();

    return { ...tokenRecord };
  }

  getDesignTokensByProjectId(projectId) {
    if (!projectId) return null;
    const tokens = this.indices.designTokensByProjectId.get(projectId);
    return tokens ? { ...tokens } : null;
  }

  getDesignTokensById(id) {
    if (!id) return null;
    const tokens = this.indices.designTokensById.get(id);
    return tokens ? { ...tokens } : null;
  }

  deleteDesignTokens(id) {
    const idx = this.collections.designTokens.findIndex(t => t.id === id);
    if (idx === -1) return false;

    this.collections.designTokens.splice(idx, 1);
    this.rebuildIndices();
    if (this.autoSave) this.save();

    return true;
  }

  deleteDesignTokensByProjectId(projectId) {
    const idx = this.collections.designTokens.findIndex(t => t.projectId === projectId);
    if (idx === -1) return false;

    this.collections.designTokens.splice(idx, 1);
    this.rebuildIndices();
    if (this.autoSave) this.save();

    return true;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // API KEYS CRUD (ENCRYPTED STORAGE)
  // ───────────────────────────────────────────────────────────────────────────

  saveApiKey({ userId, provider, apiKey }) {
    if (!userId || !provider || !apiKey) {
      throw new Error('userId, provider, and apiKey are required');
    }

    const validProviders = ['anthropic', 'openai', 'deepseek', 'gemini'];
    const normProvider = provider.toLowerCase();
    if (!validProviders.includes(normProvider)) {
      throw new Error(`Provider must be one of: ${validProviders.join(', ')}`);
    }

    const now = new Date().toISOString();
    const encrypted = encryptSecret(apiKey);
    if (!encrypted) throw new Error('Encryption failed');

    // Check if key for same user + provider already exists
    let keyRecord = this.collections.apiKeys.find(
      k => k.userId === userId && k.provider === normProvider
    );

    if (keyRecord) {
      keyRecord.encryptedKey = encrypted.encrypted;
      keyRecord.iv = encrypted.iv;
      keyRecord.tag = encrypted.tag;
      keyRecord.maskedKey = maskKey(apiKey);
      keyRecord.updatedAt = now;
    } else {
      const id = generateId('key');
      keyRecord = {
        id,
        userId,
        provider: normProvider,
        encryptedKey: encrypted.encrypted,
        iv: encrypted.iv,
        tag: encrypted.tag,
        maskedKey: maskKey(apiKey),
        createdAt: now,
        updatedAt: now,
      };
      this.collections.apiKeys.push(keyRecord);
    }

    this.rebuildIndices();
    if (this.autoSave) this.save();

    return {
      id: keyRecord.id,
      userId: keyRecord.userId,
      provider: keyRecord.provider,
      maskedKey: keyRecord.maskedKey,
      createdAt: keyRecord.createdAt,
      updatedAt: keyRecord.updatedAt,
    };
  }

  getApiKeysByUserId(userId, includeDecrypted = false) {
    if (!userId) return [];
    const list = this.indices.apiKeysByUserId.get(userId) || [];
    return list.map(k => {
      const res = {
        id: k.id,
        userId: k.userId,
        provider: k.provider,
        maskedKey: k.maskedKey,
        createdAt: k.createdAt,
        updatedAt: k.updatedAt,
      };
      if (includeDecrypted) {
        res.apiKey = decryptSecret(k.encryptedKey, k.iv, k.tag);
      }
      return res;
    });
  }

  getApiKeyByProvider(userId, provider, decrypt = true) {
    if (!userId || !provider) return null;
    const list = this.indices.apiKeysByUserId.get(userId) || [];
    const record = list.find(k => k.provider === provider.toLowerCase());
    if (!record) return null;

    const res = {
      id: record.id,
      userId: record.userId,
      provider: record.provider,
      maskedKey: record.maskedKey,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };

    if (decrypt) {
      res.apiKey = decryptSecret(record.encryptedKey, record.iv, record.tag);
    }
    return res;
  }

  deleteApiKey(userId, provider) {
    const normProvider = provider.toLowerCase();
    const idx = this.collections.apiKeys.findIndex(
      k => k.userId === userId && k.provider === normProvider
    );
    if (idx === -1) return false;

    this.collections.apiKeys.splice(idx, 1);
    this.rebuildIndices();
    if (this.autoSave) this.save();

    return true;
  }

  deleteApiKeyById(id) {
    const idx = this.collections.apiKeys.findIndex(k => k.id === id);
    if (idx === -1) return false;

    this.collections.apiKeys.splice(idx, 1);
    this.rebuildIndices();
    if (this.autoSave) this.save();

    return true;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // GENERIC QUERY HELPERS
  // ───────────────────────────────────────────────────────────────────────────

  find(collectionName, predicate) {
    const coll = this.collections[collectionName];
    if (!coll) return [];
    if (!predicate) return coll.map(item => ({ ...item }));
    return coll.filter(predicate).map(item => ({ ...item }));
  }

  findOne(collectionName, predicate) {
    const coll = this.collections[collectionName];
    if (!coll) return null;
    const item = coll.find(predicate);
    return item ? { ...item } : null;
  }

  count(collectionName, predicate) {
    const coll = this.collections[collectionName];
    if (!coll) return 0;
    if (!predicate) return coll.length;
    return coll.filter(predicate).length;
  }

  exportData() {
    return JSON.parse(JSON.stringify(this.collections));
  }

  importData(data) {
    if (!data) return;
    this.collections = {
      users: Array.isArray(data.users) ? data.users : [],
      workspaces: Array.isArray(data.workspaces) ? data.workspaces : [],
      projects: Array.isArray(data.projects) ? data.projects : [],
      designTokens: Array.isArray(data.designTokens) ? data.designTokens : [],
      apiKeys: Array.isArray(data.apiKeys) ? data.apiKeys : [],
    };
    this.rebuildIndices();
    if (this.autoSave) this.save();
  }
}

// Default singleton instance
const defaultDb = new Database(DEFAULT_DB_PATH);

module.exports = {
  db: defaultDb,
  Database,
  createDatabase: (filePath, options) => new Database(filePath, options),
  generateId,
  maskKey,
  encryptSecret,
  decryptSecret,
};
