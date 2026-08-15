/**
 * SitePrompter Authentication Engine
 * Lightweight, zero-dependency JWT & Session Management for SitePrompter.
 * Supports registered users and zero-friction guest sessions.
 */

const crypto = require('crypto');
const { db: defaultDb } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'siteprompter-jwt-production-secret-token-key-2025';
const TOKEN_EXPIRY_SECONDS = 30 * 24 * 3600; // 30 days session

/**
 * Base64 URL encode
 */
function base64UrlEncode(strOrBuffer) {
  const buf = Buffer.isBuffer(strOrBuffer) ? strOrBuffer : Buffer.from(strOrBuffer, 'utf8');
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

/**
 * Base64 URL decode
 */
function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Hash password with PBKDF2
 */
function hashPassword(password, salt) {
  if (!password) throw new Error('Password is required');
  const userSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, userSalt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: userSalt };
}

/**
 * Verify password against salt and stored hash
 */
function verifyPassword(password, storedHash, salt) {
  if (!password || !storedHash || !salt) return false;
  try {
    const calculatedHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(calculatedHash, 'hex'), Buffer.from(storedHash, 'hex'));
  } catch (err) {
    return false;
  }
}

/**
 * Generate a signed JWT token
 */
function signToken(payload, secret = JWT_SECRET, expiresInSec = TOKEN_EXPIRY_SECONDS) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const exp = now + expiresInSec;
  const fullPayload = { ...payload, iat: now, exp };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verify and decode a JWT token
 */
function verifyToken(token, secret = JWT_SECRET) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token is required');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token structure');
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  if (signature !== expectedSig) {
    throw new Error('Invalid token signature');
  }

  let payload;
  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload));
  } catch (e) {
    throw new Error('Malformed token payload');
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error('Token has expired');
  }

  return payload;
}

/**
 * Sanitize user object to avoid exposing sensitive password hash & salt
 */
function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, salt, ...safeUser } = user;
  return safeUser;
}

/**
 * Register a new user with email and password
 */
function registerUser({ email, password, name, plan = 'free' }, db = defaultDb) {
  if (!email || typeof email !== 'string') {
    throw new Error('A valid email address is required');
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  const cleanEmail = email.trim().toLowerCase();
  const existing = db.getUserByEmail(cleanEmail);
  if (existing) {
    throw new Error('A user with this email address already exists');
  }

  const { hash, salt } = hashPassword(password);
  const creditsByPlan = { free: 50, pro: 500, agency: 2000 };
  const credits = creditsByPlan[plan] || 50;

  const user = db.createUser({
    email: cleanEmail,
    name: name ? name.trim() : cleanEmail.split('@')[0],
    passwordHash: hash,
    salt,
    plan,
    credits,
    isGuest: false,
  });

  // Automatically create a default workspace
  const workspace = db.createWorkspace({
    userId: user.id,
    name: `${user.name}'s Workspace`,
    isDefault: true,
  });

  const token = signToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
    isGuest: false,
    defaultWorkspaceId: workspace.id,
  });

  return {
    user: sanitizeUser(user),
    workspace,
    token,
  };
}

/**
 * Authenticate existing user by email and password
 */
function loginUser({ email, password }, db = defaultDb) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const cleanEmail = email.trim().toLowerCase();
  const user = db.getUserByEmail(cleanEmail);

  if (!user || !user.passwordHash || !user.salt) {
    throw new Error('Invalid email or password');
  }

  const isValid = verifyPassword(password, user.passwordHash, user.salt);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  const defaultWs = db.getDefaultWorkspace(user.id) || (db.getWorkspacesByUserId(user.id)[0] || null);

  const token = signToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
    isGuest: Boolean(user.isGuest),
    defaultWorkspaceId: defaultWs ? defaultWs.id : null,
  });

  return {
    user: sanitizeUser(user),
    workspace: defaultWs,
    token,
  };
}

/**
 * Zero-friction guest session creator / retriever
 * Enables users to use SitePrompter immediately without sign-up friction.
 */
function getOrCreateGuestUser(guestId = null, db = defaultDb) {
  let existingUser = null;

  if (guestId) {
    existingUser = db.getUserByGuestId(guestId);
  }

  if (existingUser) {
    const defaultWs = db.getDefaultWorkspace(existingUser.id) || (db.getWorkspacesByUserId(existingUser.id)[0] || null);
    const token = signToken({
      userId: existingUser.id,
      email: existingUser.email,
      name: existingUser.name,
      plan: existingUser.plan,
      isGuest: true,
      guestId: existingUser.guestId,
      defaultWorkspaceId: defaultWs ? defaultWs.id : null,
    });

    return {
      user: sanitizeUser(existingUser),
      workspace: defaultWs,
      token,
      isNew: false,
    };
  }

  // Create fresh guest user
  const effectiveGuestId = guestId || `guest_${crypto.randomBytes(6).toString('hex')}`;
  const user = db.createUser({
    guestId: effectiveGuestId,
    email: `guest_${effectiveGuestId}@siteprompter.local`,
    name: 'Guest User',
    plan: 'free',
    credits: 25,
    isGuest: true,
  });

  const workspace = db.createWorkspace({
    userId: user.id,
    name: 'Guest Workspace',
    isDefault: true,
  });

  const token = signToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
    isGuest: true,
    guestId: effectiveGuestId,
    defaultWorkspaceId: workspace.id,
  });

  return {
    user: sanitizeUser(user),
    workspace,
    token,
    isNew: true,
  };
}

/**
 * Express Authentication Middleware (Strict - requires valid token)
 */
function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization || '';
    let token = null;

    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    } else if (req.headers['x-access-token']) {
      token = req.headers['x-access-token'];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please provide a valid token.',
      });
    }

    const payload = verifyToken(token);
    req.user = payload;
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: `Authentication failed: ${err.message}`,
    });
  }
}

/**
 * Express Authentication Middleware (Optional - attaches user if token exists)
 */
function optionalAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization || '';
    let token = null;

    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    } else if (req.headers['x-access-token']) {
      token = req.headers['x-access-token'];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (token) {
      const payload = verifyToken(token);
      req.user = payload;
      req.userId = payload.userId;
    } else {
      req.user = null;
      req.userId = null;
    }
  } catch (err) {
    req.user = null;
    req.userId = null;
  }
  next();
}

module.exports = {
  registerUser,
  loginUser,
  verifyToken,
  signToken,
  getOrCreateGuestUser,
  hashPassword,
  verifyPassword,
  sanitizeUser,
  authMiddleware,
  optionalAuthMiddleware,
  JWT_SECRET,
};
