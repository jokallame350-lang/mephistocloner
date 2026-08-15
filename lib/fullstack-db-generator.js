/**
 * SitePrompter Full-Stack Database Generator Engine
 * 
 * Analyzes UI components (forms, tables, lists, cards) and network payload logs
 * to automatically infer relational database schemas.
 * 
 * Generates:
 * 1. Prisma Schema (PostgreSQL, MySQL, SQLite) with relations, indexes, enums
 * 2. Drizzle ORM Schema with typed columns, foreign keys, relations, inferred types
 * 3. Supabase SQL Migrations with RLS policies, triggers, custom enums
 * 4. Next.js 15 App Router Server Actions with Zod validation & type-safe CRUD
 */

// ============================================================================
// 1. HELPERS & UTILITIES
// ============================================================================

/**
 * Convert string to PascalCase (e.g. "user_profiles" -> "UserProfile", "cartItems" -> "CartItem")
 */
function toPascalCase(str) {
  if (!str) return '';
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toUpperCase());
}

/**
 * Convert string to camelCase (e.g. "user_id" -> "userId", "created_at" -> "createdAt")
 */
function toCamelCase(str) {
  if (!str) return '';
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

/**
 * Convert string to snake_case (e.g. "userId" -> "user_id", "UserProfile" -> "user_profiles")
 */
function toSnakeCase(str) {
  if (!str) return '';
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();
}

/**
 * Pluralize a table name in snake_case (e.g. "user" -> "users", "post" -> "posts")
 */
function toPluralSnake(str) {
  const snake = toSnakeCase(str);
  if (snake.endsWith('s') || snake.endsWith('x') || snake.endsWith('z') || snake.endsWith('ch') || snake.endsWith('sh')) {
    return `${snake}es`;
  }
  if (snake.endsWith('y') && !/[aeiou]y$/i.test(snake)) {
    return `${snake.slice(0, -1)}ies`;
  }
  return `${snake}s`;
}

/**
 * Format entity name nicely (Singular PascalCase)
 */
function sanitizeEntityName(rawName) {
  let name = String(rawName || 'Item').trim();
  // Remove api prefixes like /api/v1/
  name = name.replace(/^\/?(api|v\d+)\//gi, '');
  // Take last path segment if path
  if (name.includes('/')) {
    const parts = name.split('/').filter(Boolean);
    name = parts[parts.length - 1] || 'Item';
  }
  // Singularize common patterns
  let clean = toPascalCase(name);
  if (clean.endsWith('ies')) clean = clean.slice(0, -3) + 'y';
  else if (clean.endsWith('ses') || clean.endsWith('xes')) clean = clean.slice(0, -2);
  else if (clean.endsWith('s') && !clean.endsWith('ss') && !clean.endsWith('us') && !clean.endsWith('is')) {
    clean = clean.slice(0, -1);
  }
  return clean || 'Item';
}

// ============================================================================
// 2. ENTITY INFERENCE ENGINE
// ============================================================================

/**
 * Infer field data type from field name and sample value
 */
function inferFieldType(fieldName, sampleValue) {
  const name = fieldName.toLowerCase();

  // ID fields
  if (name === 'id' || name === '_id') {
    return { type: 'String', dbType: 'uuid', isId: true, isUnique: true, defaultValue: 'uuid()' };
  }

  // Foreign keys
  if (name.endsWith('id') || name.endsWith('_id')) {
    const relatedEntity = sanitizeEntityName(name.replace(/_?id$/i, ''));
    return {
      type: 'String',
      dbType: 'uuid',
      isForeignKey: true,
      foreignKeyTarget: relatedEntity,
    };
  }

  // Booleans
  if (
    typeof sampleValue === 'boolean' ||
    name.startsWith('is_') ||
    name.startsWith('is') ||
    name.startsWith('has_') ||
    name.startsWith('has') ||
    name === 'published' ||
    name === 'active' ||
    name === 'verified' ||
    name === 'enabled' ||
    name === 'archived'
  ) {
    return {
      type: 'Boolean',
      dbType: 'boolean',
      defaultValue: sampleValue === true ? 'true' : 'false',
    };
  }

  // Dates & Timestamps
  if (
    sampleValue instanceof Date ||
    (typeof sampleValue === 'string' && /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(sampleValue)) ||
    name.endsWith('at') ||
    name.endsWith('_at') ||
    name.endsWith('date') ||
    name.endsWith('_date') ||
    name === 'timestamp'
  ) {
    const isCreatedAt = name.includes('created') || name.includes('inserted');
    const isUpdatedAt = name.includes('updated') || name.includes('modified');
    return {
      type: 'DateTime',
      dbType: 'timestamp',
      isCreatedAt,
      isUpdatedAt,
      defaultValue: isCreatedAt ? 'now()' : undefined,
    };
  }

  // Numbers (Integers vs Float/Decimal)
  if (typeof sampleValue === 'number' || name.includes('count') || name.includes('total') || name.includes('price') || name.includes('amount') || name.includes('rating') || name.includes('age') || name.includes('quantity') || name.includes('stock')) {
    const isFloat =
      (typeof sampleValue === 'number' && !Number.isInteger(sampleValue)) ||
      name.includes('price') ||
      name.includes('amount') ||
      name.includes('total') ||
      name.includes('rate') ||
      name.includes('balance') ||
      name.includes('fee') ||
      name.includes('discount');

    if (isFloat) {
      return { type: 'Float', dbType: 'decimal', precision: 10, scale: 2, defaultValue: '0.00' };
    }
    return { type: 'Int', dbType: 'integer', defaultValue: '0' };
  }

  // Arrays
  if (Array.isArray(sampleValue)) {
    if (sampleValue.length > 0 && typeof sampleValue[0] === 'string') {
      return { type: 'String[]', dbType: 'text_array' };
    }
    return { type: 'Json', dbType: 'jsonb' };
  }

  // JSON Objects
  if (sampleValue !== null && typeof sampleValue === 'object') {
    return { type: 'Json', dbType: 'jsonb' };
  }

  // Specific String Semantics: Email
  if (name.includes('email') || (typeof sampleValue === 'string' && sampleValue.includes('@') && sampleValue.includes('.'))) {
    return { type: 'String', dbType: 'varchar', maxLength: 255, isUnique: true, isEmail: true };
  }

  // Specific String Semantics: Enums & Statuses
  if (name === 'status' || name === 'role' || name === 'type' || name === 'category' || name === 'priority' || name === 'state') {
    let enumVals = ['ACTIVE', 'INACTIVE', 'PENDING'];
    if (name === 'role') enumVals = ['USER', 'ADMIN', 'EDITOR', 'MEMBER'];
    if (name === 'status') enumVals = ['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'ARCHIVED'];
    if (name === 'priority') enumVals = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

    if (typeof sampleValue === 'string' && sampleValue.length < 30) {
      const upper = sampleValue.toUpperCase();
      if (!enumVals.includes(upper)) enumVals.unshift(upper);
    }

    return {
      type: 'Enum',
      dbType: 'enum',
      enumName: `${toPascalCase(fieldName)}Enum`,
      enumValues: enumVals,
      defaultValue: enumVals[0],
    };
  }

  // Text vs Varchar
  if (name.includes('content') || name.includes('description') || name.includes('body') || name.includes('bio') || name.includes('comment') || name.includes('notes') || (typeof sampleValue === 'string' && sampleValue.length > 255)) {
    return { type: 'String', dbType: 'text' };
  }

  if (name.includes('url') || name.includes('image') || name.includes('avatar') || name.includes('link') || name.includes('slug')) {
    return { type: 'String', dbType: 'varchar', maxLength: 512, isUnique: name.includes('slug') };
  }

  // Default string
  return { type: 'String', dbType: 'varchar', maxLength: 255 };
}

/**
 * Infer entities from network payload logs (XHR/Fetch responses)
 */
function inferEntitiesFromNetworkLogs(networkLogs = [], options = {}) {
  const entitiesMap = new Map();

  for (const log of networkLogs) {
    const url = log.url || log.path || '';
    const body = log.responseBody || log.data || log.body || log.payload;
    if (!body) continue;

    // Determine entity name from URL
    const entityName = sanitizeEntityName(url);
    if (!entityName || entityName === 'Api') continue;

    let sampleItem = null;
    if (Array.isArray(body) && body.length > 0) {
      sampleItem = body[0];
    } else if (typeof body === 'object' && body !== null) {
      // Check if wrapped in data or items
      if (Array.isArray(body.data) && body.data.length > 0) sampleItem = body.data[0];
      else if (Array.isArray(body.items) && body.items.length > 0) sampleItem = body.items[0];
      else if (Array.isArray(body.results) && body.results.length > 0) sampleItem = body.results[0];
      else sampleItem = body;
    }

    if (!sampleItem || typeof sampleItem !== 'object') continue;

    if (!entitiesMap.has(entityName)) {
      entitiesMap.set(entityName, {
        name: entityName,
        tableName: toPluralSnake(entityName),
        description: `Entity derived from endpoint ${url}`,
        fields: [],
        enums: [],
        indexes: [],
        rlsPolicies: [],
      });
    }

    const entity = entitiesMap.get(entityName);
    const existingFieldNames = new Set(entity.fields.map((f) => f.name));

    // Ensure ID field exists
    if (!existingFieldNames.has('id')) {
      entity.fields.push({
        name: 'id',
        type: 'String',
        dbType: 'uuid',
        isId: true,
        isUnique: true,
        isNullable: false,
        defaultValue: 'uuid()',
      });
      existingFieldNames.add('id');
    }

    // Inspect properties
    for (const [key, value] of Object.entries(sampleItem)) {
      const camelKey = toCamelCase(key);
      if (existingFieldNames.has(camelKey)) continue;

      const fieldMeta = inferFieldType(key, value);
      const fieldDef = {
        name: camelKey,
        originalKey: key,
        dbColumn: toSnakeCase(key),
        type: fieldMeta.type,
        dbType: fieldMeta.dbType,
        isNullable: value === null || value === undefined,
        isUnique: !!fieldMeta.isUnique,
        defaultValue: fieldMeta.defaultValue,
        maxLength: fieldMeta.maxLength,
        isForeignKey: !!fieldMeta.isForeignKey,
        foreignKeyTarget: fieldMeta.foreignKeyTarget,
      };

      if (fieldMeta.type === 'Enum' && fieldMeta.enumName) {
        fieldDef.enumName = `${entityName}${fieldMeta.enumName}`;
        fieldDef.enumValues = fieldMeta.enumValues;
        if (!entity.enums.some((e) => e.name === fieldDef.enumName)) {
          entity.enums.push({ name: fieldDef.enumName, values: fieldMeta.enumValues });
        }
      }

      entity.fields.push(fieldDef);
      existingFieldNames.add(camelKey);
    }
  }

  return Array.from(entitiesMap.values());
}

/**
 * Infer entities from UI forms, tables, and lists
 */
function inferEntitiesFromUI(components = {}, options = {}) {
  const entities = [];
  const forms = components.forms || [];
  const tables = components.tables || [];
  const cards = components.cards || [];

  // 1. Process UI Forms
  forms.forEach((form, idx) => {
    const rawName = form.title || form.name || form.id || form.section || `Form${idx + 1}`;
    const entityName = sanitizeEntityName(rawName);
    const fields = [
      {
        name: 'id',
        type: 'String',
        dbType: 'uuid',
        isId: true,
        isUnique: true,
        isNullable: false,
        defaultValue: 'uuid()',
      },
    ];
    const enums = [];

    const inputs = form.inputs || form.fields || [];
    inputs.forEach((input) => {
      const fieldName = toCamelCase(input.name || input.label || input.placeholder || 'field');
      if (fields.some((f) => f.name === fieldName)) return;

      const inputType = (input.type || 'text').toLowerCase();
      let type = 'String';
      let dbType = 'varchar';
      let defaultValue = undefined;
      let isUnique = false;

      if (inputType === 'email' || fieldName.includes('email')) {
        type = 'String';
        dbType = 'varchar';
        isUnique = true;
      } else if (inputType === 'number') {
        type = fieldName.includes('price') || fieldName.includes('amount') ? 'Float' : 'Int';
        dbType = type === 'Float' ? 'decimal' : 'integer';
      } else if (inputType === 'checkbox') {
        type = 'Boolean';
        dbType = 'boolean';
        defaultValue = 'false';
      } else if (inputType === 'date' || inputType === 'datetime-local') {
        type = 'DateTime';
        dbType = 'timestamp';
      } else if (inputType === 'textarea') {
        type = 'String';
        dbType = 'text';
      } else if (inputType === 'select' && input.options && input.options.length > 0) {
        type = 'Enum';
        dbType = 'enum';
        const enumName = `${entityName}${toPascalCase(fieldName)}Enum`;
        const enumValues = input.options.map((o) => (typeof o === 'string' ? o.toUpperCase() : (o.value || o.label || '').toUpperCase())).filter(Boolean);
        enums.push({ name: enumName, values: enumValues });
      }

      fields.push({
        name: fieldName,
        dbColumn: toSnakeCase(fieldName),
        type,
        dbType,
        isNullable: !input.required,
        isUnique,
        defaultValue,
      });
    });

    // Add standard timestamps
    fields.push({
      name: 'createdAt',
      dbColumn: 'created_at',
      type: 'DateTime',
      dbType: 'timestamp',
      isCreatedAt: true,
      defaultValue: 'now()',
      isNullable: false,
    });
    fields.push({
      name: 'updatedAt',
      dbColumn: 'updated_at',
      type: 'DateTime',
      dbType: 'timestamp',
      isUpdatedAt: true,
      defaultValue: 'now()',
      isNullable: false,
    });

    entities.push({
      name: entityName,
      tableName: toPluralSnake(entityName),
      description: `Inferred from UI Form: ${form.title || form.name || entityName}`,
      fields,
      enums,
      indexes: [],
      rlsPolicies: [],
    });
  });

  // 2. Process UI Tables
  tables.forEach((table, idx) => {
    const rawName = table.title || table.name || table.id || `TableData${idx + 1}`;
    const entityName = sanitizeEntityName(rawName);
    if (entities.some((e) => e.name === entityName)) return;

    const headers = table.headers || table.columns || [];
    const fields = [
      {
        name: 'id',
        type: 'String',
        dbType: 'uuid',
        isId: true,
        isUnique: true,
        isNullable: false,
        defaultValue: 'uuid()',
      },
    ];
    const enums = [];

    headers.forEach((hdr) => {
      const headerStr = typeof hdr === 'string' ? hdr : hdr.name || hdr.label || hdr.key || 'column';
      if (headerStr.toLowerCase() === 'actions' || headerStr.toLowerCase() === 'id') return;

      const fieldName = toCamelCase(headerStr);
      if (fields.some((f) => f.name === fieldName)) return;

      const meta = inferFieldType(fieldName, null);
      fields.push({
        name: fieldName,
        dbColumn: toSnakeCase(fieldName),
        type: meta.type,
        dbType: meta.dbType,
        isNullable: true,
        isUnique: !!meta.isUnique,
        defaultValue: meta.defaultValue,
      });

      if (meta.type === 'Enum' && meta.enumName) {
        const enumName = `${entityName}${meta.enumName}`;
        if (!enums.some((e) => e.name === enumName)) {
          enums.push({ name: enumName, values: meta.enumValues });
        }
      }
    });

    // Timestamps
    fields.push({
      name: 'createdAt',
      dbColumn: 'created_at',
      type: 'DateTime',
      dbType: 'timestamp',
      isCreatedAt: true,
      defaultValue: 'now()',
      isNullable: false,
    });
    fields.push({
      name: 'updatedAt',
      dbColumn: 'updated_at',
      type: 'DateTime',
      dbType: 'timestamp',
      isUpdatedAt: true,
      defaultValue: 'now()',
      isNullable: false,
    });

    entities.push({
      name: entityName,
      tableName: toPluralSnake(entityName),
      description: `Inferred from UI Table: ${table.title || entityName}`,
      fields,
      enums,
      indexes: [],
      rlsPolicies: [],
    });
  });

  return entities;
}

/**
 * Normalizes, connects relations, and enriches inferred entities
 */
function normalizeEntities(rawEntities = []) {
  if (!Array.isArray(rawEntities) || rawEntities.length === 0) {
    // Default fallback entities if none discovered
    return [
      {
        name: 'User',
        tableName: 'users',
        description: 'User accounts and authentication',
        fields: [
          { name: 'id', type: 'String', dbType: 'uuid', isId: true, isUnique: true, isNullable: false, defaultValue: 'uuid()' },
          { name: 'email', type: 'String', dbType: 'varchar', isUnique: true, isNullable: false },
          { name: 'name', type: 'String', dbType: 'text', isNullable: true },
          { name: 'role', type: 'Enum', enumName: 'UserRole', enumValues: ['USER', 'ADMIN', 'EDITOR'], defaultValue: 'USER', isNullable: false },
          { name: 'isActive', type: 'Boolean', dbType: 'boolean', defaultValue: 'true', isNullable: false },
          { name: 'createdAt', type: 'DateTime', dbType: 'timestamp', isCreatedAt: true, defaultValue: 'now()', isNullable: false },
          { name: 'updatedAt', type: 'DateTime', dbType: 'timestamp', isUpdatedAt: true, defaultValue: 'now()', isNullable: false },
        ],
        enums: [{ name: 'UserRole', values: ['USER', 'ADMIN', 'EDITOR'] }],
        indexes: [{ fields: ['email'], unique: true }],
        rlsPolicies: [
          { name: 'Users can read own profile', operation: 'SELECT', using: 'auth.uid() = id' },
          { name: 'Users can update own profile', operation: 'UPDATE', using: 'auth.uid() = id' },
        ],
      },
      {
        name: 'Post',
        tableName: 'posts',
        description: 'Articles, products, or content items',
        fields: [
          { name: 'id', type: 'String', dbType: 'uuid', isId: true, isUnique: true, isNullable: false, defaultValue: 'uuid()' },
          { name: 'title', type: 'String', dbType: 'varchar', maxLength: 255, isNullable: false },
          { name: 'content', type: 'String', dbType: 'text', isNullable: true },
          { name: 'published', type: 'Boolean', dbType: 'boolean', defaultValue: 'false', isNullable: false },
          { name: 'authorId', type: 'String', dbType: 'uuid', isForeignKey: true, foreignKeyTarget: 'User', isNullable: false },
          { name: 'createdAt', type: 'DateTime', dbType: 'timestamp', isCreatedAt: true, defaultValue: 'now()', isNullable: false },
          { name: 'updatedAt', type: 'DateTime', dbType: 'timestamp', isUpdatedAt: true, defaultValue: 'now()', isNullable: false },
        ],
        enums: [],
        indexes: [{ fields: ['authorId'] }],
        rlsPolicies: [
          { name: 'Public read published posts', operation: 'SELECT', using: 'published = true OR auth.uid() = author_id' },
          { name: 'Authors can create posts', operation: 'INSERT', check: 'auth.uid() = author_id' },
          { name: 'Authors can update own posts', operation: 'UPDATE', using: 'auth.uid() = author_id' },
          { name: 'Authors can delete own posts', operation: 'DELETE', using: 'auth.uid() = author_id' },
        ],
      },
    ];
  }

  const entitiesByName = new Map();
  rawEntities.forEach((e) => {
    const cleanName = sanitizeEntityName(e.name);
    entitiesByName.set(cleanName, {
      ...e,
      name: cleanName,
      tableName: e.tableName || toPluralSnake(cleanName),
      fields: e.fields || [],
      enums: e.enums || [],
      indexes: e.indexes || [],
      rlsPolicies: e.rlsPolicies || [],
    });
  });

  // Ensure timestamps and ID on all entities
  for (const entity of entitiesByName.values()) {
    const fieldNames = new Set(entity.fields.map((f) => f.name));

    if (!fieldNames.has('id')) {
      entity.fields.unshift({
        name: 'id',
        type: 'String',
        dbType: 'uuid',
        isId: true,
        isUnique: true,
        isNullable: false,
        defaultValue: 'uuid()',
      });
    }

    if (!fieldNames.has('createdAt')) {
      entity.fields.push({
        name: 'createdAt',
        dbColumn: 'created_at',
        type: 'DateTime',
        dbType: 'timestamp',
        isCreatedAt: true,
        defaultValue: 'now()',
        isNullable: false,
      });
    }

    if (!fieldNames.has('updatedAt')) {
      entity.fields.push({
        name: 'updatedAt',
        dbColumn: 'updated_at',
        type: 'DateTime',
        dbType: 'timestamp',
        isUpdatedAt: true,
        defaultValue: 'now()',
        isNullable: false,
      });
    }

    // Default RLS policies if empty
    if (entity.rlsPolicies.length === 0) {
      if (entity.name === 'User') {
        entity.rlsPolicies.push(
          { name: 'Users can read own profile', operation: 'SELECT', using: 'auth.uid() = id' },
          { name: 'Users can update own profile', operation: 'UPDATE', using: 'auth.uid() = id' }
        );
      } else {
        const hasAuthor = entity.fields.some((f) => f.name === 'authorId' || f.name === 'userId');
        const authorField = entity.fields.find((f) => f.name === 'authorId' || f.name === 'userId');
        const authorCol = authorField ? (authorField.dbColumn || toSnakeCase(authorField.name)) : 'user_id';

        if (hasAuthor) {
          entity.rlsPolicies.push(
            { name: `Users can view own ${entity.tableName}`, operation: 'SELECT', using: `auth.uid() = ${authorCol}` },
            { name: `Users can insert ${entity.tableName}`, operation: 'INSERT', check: `auth.uid() = ${authorCol}` },
            { name: `Users can update own ${entity.tableName}`, operation: 'UPDATE', using: `auth.uid() = ${authorCol}` },
            { name: `Users can delete own ${entity.tableName}`, operation: 'DELETE', using: `auth.uid() = ${authorCol}` }
          );
        } else {
          entity.rlsPolicies.push(
            { name: `Public read for ${entity.tableName}`, operation: 'SELECT', using: 'true' },
            { name: `Authenticated users can manage ${entity.tableName}`, operation: 'ALL', using: 'auth.role() = \'authenticated\'' }
          );
        }
      }
    }
  }

  // Cross-link Foreign Keys and 1:N relations
  for (const entity of entitiesByName.values()) {
    for (const field of entity.fields) {
      if (field.isForeignKey && field.foreignKeyTarget) {
        const targetEntity = entitiesByName.get(field.foreignKeyTarget);
        if (targetEntity) {
          // Add 1:N relation array on target entity if not exists
          const relationName = toCamelCase(entity.tableName);
          if (!targetEntity.fields.some((f) => f.name === relationName)) {
            targetEntity.fields.push({
              name: relationName,
              type: `${entity.name}[]`,
              isRelation: true,
              relationType: 'one-to-many',
              relationTo: entity.name,
              relationField: field.name,
            });
          }
        }
      }
    }
  }

  return Array.from(entitiesByName.values());
}

/**
 * Universal entity inference combining telemetry, network logs, and UI components
 */
function inferEntities(source = {}, options = {}) {
  let rawList = [];

  if (Array.isArray(source)) {
    rawList = source;
  } else if (source.networkLogs || source.networkTraffic) {
    const netEntities = inferEntitiesFromNetworkLogs(source.networkLogs || source.networkTraffic, options);
    rawList = rawList.concat(netEntities);
  }

  if (source.components || source.forms || source.tables) {
    const uiEntities = inferEntitiesFromUI(source.components || source, options);
    rawList = rawList.concat(uiEntities);
  }

  if (source.telemetry) {
    const fromTel = inferEntities(source.telemetry, options);
    rawList = rawList.concat(fromTel);
  }

  return normalizeEntities(rawList);
}

// ============================================================================
// 3. PRISMA SCHEMA GENERATOR
// ============================================================================

/**
 * Generates production-ready Prisma schema
 * @param {Array} rawEntities
 * @param {Object} options
 * @returns {string} prisma/schema.prisma content
 */
function generatePrismaSchema(rawEntities, options = {}) {
  const entities = normalizeEntities(rawEntities);
  const provider = (options.provider || 'postgresql').toLowerCase();
  const databaseUrlEnv = options.databaseUrlEnv || 'DATABASE_URL';
  const directUrlEnv = options.directUrlEnv || (provider === 'postgresql' ? 'DIRECT_URL' : null);

  const lines = [
    '// This is your Prisma schema file,',
    '// generated automatically by SitePrompter Full-Stack Database Generator.',
    '// Learn more: https://pris.ly/d/prisma-schema',
    '',
    'generator client {',
    '  provider = "prisma-client-js"',
    '}',
    '',
    'datasource db {',
    `  provider = "${provider}"`,
    `  url      = env("${databaseUrlEnv}")`,
  ];

  if (directUrlEnv && provider === 'postgresql') {
    lines.push(`  directUrl = env("${directUrlEnv}")`);
  }
  lines.push('}');
  lines.push('');

  // Collect all unique enums across entities (only for PG & MySQL)
  const allEnums = new Map();
  if (provider !== 'sqlite') {
    entities.forEach((entity) => {
      (entity.enums || []).forEach((en) => {
        if (!allEnums.has(en.name)) {
          allEnums.set(en.name, en.values || ['ACTIVE', 'INACTIVE']);
        }
      });
    });

    if (allEnums.size > 0) {
      lines.push('// ==========================================');
      lines.push('// ENUMS');
      lines.push('// ==========================================');
      for (const [enumName, values] of allEnums.entries()) {
        lines.push(`enum ${enumName} {`);
        values.forEach((val) => {
          lines.push(`  ${val}`);
        });
        lines.push('}');
        lines.push('');
      }
    }
  }

  // Generate Models
  lines.push('// ==========================================');
  lines.push('// MODELS');
  lines.push('// ==========================================');

  entities.forEach((entity) => {
    if (entity.description) {
      lines.push(`/// ${entity.description}`);
    }
    lines.push(`model ${entity.name} {`);

    const scalarFields = [];
    const relationFields = [];
    const indexes = [];

    entity.fields.forEach((field) => {
      // 1. Array / Virtual relation field
      if (field.isRelation && field.relationTo) {
        relationFields.push(`  ${field.name} ${field.type}`);
        return;
      }

      // 2. Foreign key scalar & object relation
      if (field.isForeignKey && field.foreignKeyTarget) {
        const fkType = provider === 'sqlite' ? 'String' : 'String';
        scalarFields.push(`  ${field.name} ${fkType}`);
        const relObjName = toCamelCase(field.foreignKeyTarget);
        relationFields.push(
          `  ${relObjName} ${field.foreignKeyTarget} @relation(fields: [${field.name}], references: [id], onDelete: Cascade)`
        );
        indexes.push(`  @@index([${field.name}])`);
        return;
      }

      // 3. Regular scalar fields
      let fieldType = field.type;
      let attributes = [];

      if (field.isId) {
        attributes.push('@id');
        if (field.defaultValue === 'uuid()') attributes.push('@default(uuid())');
        else if (field.defaultValue === 'cuid()') attributes.push('@default(cuid())');
        else if (field.defaultValue === 'autoincrement()') attributes.push('@default(autoincrement())');
        else attributes.push('@default(uuid())');
      } else {
        if (field.isUnique) attributes.push('@unique');

        if (field.isCreatedAt) {
          attributes.push('@default(now())');
        } else if (field.isUpdatedAt) {
          attributes.push('@updatedAt');
        } else if (field.defaultValue !== undefined && field.defaultValue !== null) {
          if (field.type === 'Boolean') attributes.push(`@default(${field.defaultValue})`);
          else if (field.type === 'Int' || field.type === 'Float') attributes.push(`@default(${field.defaultValue})`);
          else if (field.type === 'Enum' && provider !== 'sqlite') attributes.push(`@default(${field.defaultValue})`);
          else if (field.type === 'String') attributes.push(`@default("${field.defaultValue}")`);
        }
      }

      // Handle SQLite Enum fallback (SQLite doesn't support native enums in Prisma)
      if (field.type === 'Enum' && provider === 'sqlite') {
        fieldType = 'String';
      }

      // Nullable marker
      const nullableSuffix = field.isNullable && !field.isId ? '?' : '';
      const attrStr = attributes.length > 0 ? ` ${attributes.join(' ')}` : '';

      scalarFields.push(`  ${field.name} ${fieldType}${nullableSuffix}${attrStr}`);
    });

    // Append scalar fields
    scalarFields.forEach((f) => lines.push(f));

    // Append relation object fields
    if (relationFields.length > 0) {
      lines.push('');
      relationFields.forEach((r) => lines.push(r));
    }

    // Append indexes and map table name
    if (indexes.length > 0 || entity.tableName) {
      lines.push('');
      indexes.forEach((idx) => lines.push(idx));
      if (entity.tableName) {
        lines.push(`  @@map("${entity.tableName}")`);
      }
    }

    lines.push('}');
    lines.push('');
  });

  return lines.join('\n');
}

// ============================================================================
// 4. DRIZZLE ORM SCHEMA GENERATOR
// ============================================================================

/**
 * Generates production-ready Drizzle ORM schema (`db/schema.ts`)
 * @param {Array} rawEntities
 * @param {Object} options
 * @returns {string} db/schema.ts content
 */
function generateDrizzleSchema(rawEntities, options = {}) {
  const entities = normalizeEntities(rawEntities);
  const dialect = (options.dialect || 'pg').toLowerCase();

  const lines = [
    '/**',
    ' * Drizzle ORM Schema',
    ' * Generated automatically by SitePrompter Full-Stack Database Generator.',
    ' */',
    '',
  ];

  if (dialect === 'pg' || dialect === 'postgresql') {
    lines.push(
      "import { pgTable, text, varchar, integer, boolean, timestamp, uuid, decimal, jsonb, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core';"
    );
    lines.push("import { relations } from 'drizzle-orm';");
    lines.push('');

    // 1. Enums
    const allEnums = new Map();
    entities.forEach((e) => {
      (e.enums || []).forEach((en) => {
        if (!allEnums.has(en.name)) {
          allEnums.set(en.name, en.values);
        }
      });
    });

    if (allEnums.size > 0) {
      lines.push('// --- ENUMS ---');
      for (const [enumName, values] of allEnums.entries()) {
        const snakeName = toSnakeCase(enumName);
        const valArrayStr = JSON.stringify(values);
        lines.push(`export const ${toCamelCase(enumName)} = pgEnum('${snakeName}', ${valArrayStr});`);
      }
      lines.push('');
    }

    // 2. Tables
    lines.push('// --- TABLES ---');
    entities.forEach((entity) => {
      const varName = toCamelCase(entity.tableName || entity.name);
      lines.push(`export const ${varName} = pgTable('${entity.tableName}', {`);

      entity.fields.forEach((field) => {
        if (field.isRelation) return;

        const colName = field.dbColumn || toSnakeCase(field.name);
        let colDef = '';

        if (field.isId) {
          colDef = `uuid('${colName}').defaultRandom().primaryKey()`;
        } else if (field.isForeignKey && field.foreignKeyTarget) {
          const targetVar = toCamelCase(toPluralSnake(field.foreignKeyTarget));
          colDef = `uuid('${colName}').references(() => ${targetVar}.id, { onDelete: 'cascade' })`;
        } else if (field.type === 'Enum' && field.enumName) {
          colDef = `${toCamelCase(field.enumName)}('${colName}')`;
        } else if (field.type === 'Boolean') {
          colDef = `boolean('${colName}')`;
        } else if (field.type === 'Int') {
          colDef = `integer('${colName}')`;
        } else if (field.type === 'Float') {
          colDef = `decimal('${colName}', { precision: 10, scale: 2 })`;
        } else if (field.type === 'DateTime') {
          colDef = `timestamp('${colName}')`;
        } else if (field.type === 'Json') {
          colDef = `jsonb('${colName}')`;
        } else if (field.dbType === 'text') {
          colDef = `text('${colName}')`;
        } else {
          colDef = `varchar('${colName}', { length: ${field.maxLength || 255} })`;
        }

        // Modifiers
        if (!field.isNullable && !field.isId) {
          colDef += '.notNull()';
        }
        if (field.isUnique && !field.isId) {
          colDef += '.unique()';
        }
        if (field.isCreatedAt) {
          colDef += '.defaultNow()';
        } else if (field.defaultValue !== undefined && field.defaultValue !== null && !field.isId) {
          if (field.type === 'Boolean') colDef += `.default(${field.defaultValue})`;
          else if (field.type === 'Int' || field.type === 'Float') colDef += `.default('${field.defaultValue}')`;
          else if (field.type === 'String' || field.type === 'Enum') colDef += `.default('${field.defaultValue}')`;
        }

        lines.push(`  ${field.name}: ${colDef},`);
      });

      lines.push('});');
      lines.push('');
    });

    // 3. Relations
    lines.push('// --- RELATIONS ---');
    entities.forEach((entity) => {
      const varName = toCamelCase(entity.tableName || entity.name);
      const foreignKeys = entity.fields.filter((f) => f.isForeignKey && f.foreignKeyTarget);
      const childRelations = entity.fields.filter((f) => f.isRelation);

      if (foreignKeys.length > 0 || childRelations.length > 0) {
        lines.push(`export const ${varName}Relations = relations(${varName}, ({ one, many }) => ({`);

        foreignKeys.forEach((fk) => {
          const targetVar = toCamelCase(toPluralSnake(fk.foreignKeyTarget));
          const relProp = toCamelCase(fk.foreignKeyTarget);
          lines.push(`  ${relProp}: one(${targetVar}, {`);
          lines.push(`    fields: [${varName}.${fk.name}],`);
          lines.push(`    references: [${targetVar}.id],`);
          lines.push('  }),');
        });

        childRelations.forEach((cr) => {
          const targetVar = toCamelCase(toPluralSnake(cr.relationTo));
          lines.push(`  ${cr.name}: many(${targetVar}),`);
        });

        lines.push('}));');
        lines.push('');
      }
    });

    // 4. Inferred TypeScript Types
    lines.push('// --- INFERRED TYPES ---');
    entities.forEach((entity) => {
      const varName = toCamelCase(entity.tableName || entity.name);
      lines.push(`export type ${entity.name} = typeof ${varName}.$inferSelect;`);
      lines.push(`export type New${entity.name} = typeof ${varName}.$inferInsert;`);
    });
    lines.push('');
  }

  return lines.join('\n');
}

// ============================================================================
// 5. SUPABASE MIGRATION GENERATOR
// ============================================================================

/**
 * Generates production-ready Supabase SQL Migration with RLS and trigger functions
 * @param {Array} rawEntities
 * @param {Object} options
 * @returns {string} SQL migration string
 */
function generateSupabaseMigration(rawEntities, options = {}) {
  const entities = normalizeEntities(rawEntities);
  const migrationName = options.migrationName || '001_init';
  const enableRls = options.enableRls !== false;

  const lines = [
    `-- Migration: ${migrationName}.sql`,
    '-- Generated by SitePrompter Full-Stack Database Generator',
    '-- Supabase PostgreSQL with Row Level Security (RLS) & Timestamps Triggers',
    '',
    '-- 1. Enable Core PostgreSQL Extensions',
    'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
    'CREATE EXTENSION IF NOT EXISTS "pgcrypto";',
    '',
  ];

  // 2. Custom Enums
  const allEnums = new Map();
  entities.forEach((e) => {
    (e.enums || []).forEach((en) => {
      if (!allEnums.has(en.name)) {
        allEnums.set(en.name, en.values);
      }
    });
  });

  if (allEnums.size > 0) {
    lines.push('-- 2. Custom Enum Types');
    for (const [enumName, values] of allEnums.entries()) {
      const snakeName = toSnakeCase(enumName);
      const valsStr = values.map((v) => `'${v}'`).join(', ');
      lines.push('DO $$ BEGIN');
      lines.push(`  CREATE TYPE public.${snakeName} AS ENUM (${valsStr});`);
      lines.push('EXCEPTION');
      lines.push('  WHEN duplicate_object THEN null;');
      lines.push('END $$;');
      lines.push('');
    }
  }

  // 3. Automated timestamp trigger function
  lines.push('-- 3. Automated Updated_At Trigger Function');
  lines.push('CREATE OR REPLACE FUNCTION public.handle_updated_at()');
  lines.push('RETURNS TRIGGER AS $$');
  lines.push('BEGIN');
  lines.push('  NEW.updated_at = NOW();');
  lines.push('  RETURN NEW;');
  lines.push('END;');
  lines.push("$$ LANGUAGE plpgsql SECURITY DEFINER;");
  lines.push('');

  // 4. Tables Creation
  lines.push('-- 4. Table Definitions');
  entities.forEach((entity) => {
    lines.push(`CREATE TABLE IF NOT EXISTS public.${entity.tableName} (`);

    const colDefs = [];
    entity.fields.forEach((field) => {
      if (field.isRelation) return;

      const colName = field.dbColumn || toSnakeCase(field.name);
      let colSql = `  ${colName}`;

      if (field.isId) {
        colSql += ' UUID PRIMARY KEY DEFAULT gen_random_uuid()';
      } else if (field.isForeignKey && field.foreignKeyTarget) {
        const targetTable = toPluralSnake(field.foreignKeyTarget);
        colSql += ` UUID REFERENCES public.${targetTable}(id) ON DELETE CASCADE`;
      } else if (field.type === 'Enum' && field.enumName) {
        colSql += ` public.${toSnakeCase(field.enumName)}`;
      } else if (field.type === 'Boolean') {
        colSql += ' BOOLEAN';
      } else if (field.type === 'Int') {
        colSql += ' INTEGER';
      } else if (field.type === 'Float') {
        colSql += ' DECIMAL(10, 2)';
      } else if (field.type === 'DateTime') {
        colSql += ' TIMESTAMPTZ';
      } else if (field.type === 'Json') {
        colSql += ' JSONB';
      } else if (field.dbType === 'text') {
        colSql += ' TEXT';
      } else {
        colSql += ` VARCHAR(${field.maxLength || 255})`;
      }

      if (!field.isNullable && !field.isId) {
        colSql += ' NOT NULL';
      }
      if (field.isUnique && !field.isId) {
        colSql += ' UNIQUE';
      }
      if (field.isCreatedAt || field.defaultValue === 'now()') {
        colSql += ' DEFAULT NOW()';
      } else if (field.defaultValue !== undefined && field.defaultValue !== null && !field.isId) {
        if (field.type === 'Boolean') colSql += ` DEFAULT ${field.defaultValue}`;
        else if (field.type === 'Int' || field.type === 'Float') colSql += ` DEFAULT ${field.defaultValue}`;
        else if (field.type === 'Enum') colSql += ` DEFAULT '${field.defaultValue}'`;
        else if (field.type === 'String') colSql += ` DEFAULT '${field.defaultValue}'`;
      }

      colDefs.push(colSql);
    });

    lines.push(colDefs.join(',\n'));
    lines.push(');');
    lines.push('');
  });

  // 5. Indexes
  lines.push('-- 5. Performance Indexes');
  entities.forEach((entity) => {
    entity.fields.forEach((field) => {
      if (field.isForeignKey) {
        const colName = field.dbColumn || toSnakeCase(field.name);
        lines.push(
          `CREATE INDEX IF NOT EXISTS idx_${entity.tableName}_${colName} ON public.${entity.tableName}(${colName});`
        );
      }
    });
  });
  lines.push('');

  // 6. Updated_At Triggers
  lines.push('-- 6. Updated_At Triggers');
  entities.forEach((entity) => {
    lines.push(`DROP TRIGGER IF EXISTS trg_${entity.tableName}_updated_at ON public.${entity.tableName};`);
    lines.push(`CREATE TRIGGER trg_${entity.tableName}_updated_at`);
    lines.push(`  BEFORE UPDATE ON public.${entity.tableName}`);
    lines.push(`  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();`);
    lines.push('');
  });

  // 7. Row Level Security (RLS) & Policies
  if (enableRls) {
    lines.push('-- 7. Row Level Security (RLS) & Policies');
    entities.forEach((entity) => {
      lines.push(`ALTER TABLE public.${entity.tableName} ENABLE ROW LEVEL SECURITY;`);

      (entity.rlsPolicies || []).forEach((pol, idx) => {
        const polName = pol.name || `${entity.name} policy ${idx + 1}`;
        const op = pol.operation || 'SELECT';
        const usingClause = pol.using ? ` USING (${pol.using})` : '';
        const checkClause = pol.check ? ` WITH CHECK (${pol.check})` : '';

        lines.push(`DROP POLICY IF EXISTS "${polName}" ON public.${entity.tableName};`);
        lines.push(
          `CREATE POLICY "${polName}" ON public.${entity.tableName} FOR ${op}${usingClause}${checkClause};`
        );
      });
      lines.push('');
    });
  }

  return lines.join('\n');
}

// ============================================================================
// 6. NEXT.JS 15 APP ROUTER SERVER ACTIONS GENERATOR
// ============================================================================

/**
 * Generates type-safe CRUD Server Actions for Next.js 15 App Router
 * @param {Array} rawEntities
 * @param {Object} options
 * @returns {string} app/actions/[entity].ts content
 */
function generateNextJsServerActions(rawEntities, options = {}) {
  const entities = normalizeEntities(rawEntities);
  const orm = (options.orm || 'prisma').toLowerCase();

  const lines = [
    "'use server';",
    '',
    '/**',
    ' * Next.js 15 App Router Server Actions',
    ' * Generated automatically by SitePrompter Full-Stack Database Generator.',
    ' */',
    '',
    "import { revalidatePath } from 'next/cache';",
    "import { z } from 'zod';",
  ];

  if (orm === 'prisma') {
    lines.push("import { prisma } from '@/lib/prisma';");
  } else if (orm === 'drizzle') {
    lines.push("import { db } from '@/db';");
    lines.push("import { eq, desc } from 'drizzle-orm';");
    const tableImports = entities.map((e) => toCamelCase(e.tableName || e.name)).join(', ');
    lines.push(`import { ${tableImports} } from '@/db/schema';`);
  }
  lines.push('');

  entities.forEach((entity) => {
    const entityName = entity.name;
    const pluralName = toPascalCase(entity.tableName);
    const varName = toCamelCase(entity.name);
    const tableVar = toCamelCase(entity.tableName);

    lines.push('// ============================================================================');
    lines.push(`// ${entityName.toUpperCase()} ACTIONS & VALIDATION SCHEMAS`);
    lines.push('// ============================================================================');
    lines.push('');

    // Zod Schema Generation
    lines.push(`export const Create${entityName}Schema = z.object({`);
    entity.fields.forEach((field) => {
      if (field.isId || field.isCreatedAt || field.isUpdatedAt || field.isRelation) return;

      let zodType = 'z.string()';
      if (field.type === 'String') {
        if (field.isEmail) zodType = 'z.string().email()';
        else if (field.maxLength) zodType = `z.string().max(${field.maxLength})`;
        else zodType = 'z.string()';
      } else if (field.type === 'Int') {
        zodType = 'z.coerce.number().int()';
      } else if (field.type === 'Float') {
        zodType = 'z.coerce.number()';
      } else if (field.type === 'Boolean') {
        zodType = 'z.coerce.boolean()';
      } else if (field.type === 'DateTime') {
        zodType = 'z.coerce.date()';
      } else if (field.type === 'Json') {
        zodType = 'z.record(z.any())';
      } else if (field.type === 'Enum' && field.enumValues) {
        const vals = field.enumValues.map((v) => `'${v}'`).join(', ');
        zodType = `z.enum([${vals}])`;
      }

      if (field.isNullable) {
        zodType += '.optional()';
      }
      if (field.defaultValue !== undefined && field.defaultValue !== null) {
        if (field.type === 'Boolean') zodType += `.default(${field.defaultValue})`;
        else if (field.type === 'Enum') zodType += `.default('${field.defaultValue}')`;
      }

      lines.push(`  ${field.name}: ${zodType},`);
    });
    lines.push('});');
    lines.push('');
    lines.push(`export const Update${entityName}Schema = Create${entityName}Schema.partial();`);
    lines.push(`export type Create${entityName}Input = z.infer<typeof Create${entityName}Schema>;`);
    lines.push(`export type Update${entityName}Input = z.infer<typeof Update${entityName}Schema>;`);
    lines.push('');

    // List Action (Read all / paginate)
    lines.push(`export async function list${pluralName}(params?: { limit?: number; offset?: number }) {`);
    lines.push('  try {');
    lines.push('    const take = params?.limit || 50;');
    lines.push('    const skip = params?.offset || 0;');
    if (orm === 'prisma') {
      lines.push(`    const items = await prisma.${varName}.findMany({`);
      lines.push('      take,');
      lines.push('      skip,');
      lines.push('      orderBy: { createdAt: "desc" },');
      lines.push('    });');
    } else {
      lines.push(`    const items = await db.select().from(${tableVar}).limit(take).offset(skip).orderBy(desc(${tableVar}.createdAt));`);
    }
    lines.push('    return { success: true, data: items };');
    lines.push('  } catch (error) {');
    lines.push(`    console.error('Failed to list ${pluralName}:', error);`);
    lines.push("    return { success: false, error: error instanceof Error ? error.message : 'Database error' };");
    lines.push('  }');
    lines.push('}');
    lines.push('');

    // Get Single by ID Action
    lines.push(`export async function get${entityName}ById(id: string) {`);
    lines.push('  try {');
    if (orm === 'prisma') {
      lines.push(`    const item = await prisma.${varName}.findUnique({ where: { id } });`);
    } else {
      lines.push(`    const [item] = await db.select().from(${tableVar}).where(eq(${tableVar}.id, id)).limit(1);`);
    }
    lines.push(`    if (!item) return { success: false, error: '${entityName} not found' };`);
    lines.push('    return { success: true, data: item };');
    lines.push('  } catch (error) {');
    lines.push(`    console.error('Failed to get ${entityName}:', error);`);
    lines.push("    return { success: false, error: error instanceof Error ? error.message : 'Database error' };");
    lines.push('  }');
    lines.push('}');
    lines.push('');

    // Create Action
    lines.push(`export async function create${entityName}(input: Create${entityName}Input | FormData) {`);
    lines.push('  try {');
    lines.push('    const raw = input instanceof FormData ? Object.fromEntries(input.entries()) : input;');
    lines.push(`    const validated = Create${entityName}Schema.parse(raw);`);
    if (orm === 'prisma') {
      lines.push(`    const created = await prisma.${varName}.create({ data: validated });`);
    } else {
      lines.push(`    const [created] = await db.insert(${tableVar}).values(validated).returning();`);
    }
    lines.push(`    revalidatePath('/${entity.tableName}');`);
    lines.push("    revalidatePath('/');");
    lines.push('    return { success: true, data: created };');
    lines.push('  } catch (error) {');
    lines.push('    if (error instanceof z.ZodError) {');
    lines.push("      return { success: false, error: 'Validation failed', fieldErrors: error.flatten().fieldErrors };");
    lines.push('    }');
    lines.push(`    console.error('Failed to create ${entityName}:', error);`);
    lines.push("    return { success: false, error: error instanceof Error ? error.message : 'Creation failed' };");
    lines.push('  }');
    lines.push('}');
    lines.push('');

    // Update Action
    lines.push(`export async function update${entityName}(id: string, input: Update${entityName}Input | FormData) {`);
    lines.push('  try {');
    lines.push('    const raw = input instanceof FormData ? Object.fromEntries(input.entries()) : input;');
    lines.push(`    const validated = Update${entityName}Schema.parse(raw);`);
    if (orm === 'prisma') {
      lines.push(`    const updated = await prisma.${varName}.update({ where: { id }, data: validated });`);
    } else {
      lines.push(`    const [updated] = await db.update(${tableVar}).set(validated).where(eq(${tableVar}.id, id)).returning();`);
    }
    lines.push(`    revalidatePath('/${entity.tableName}');`);
    lines.push(`    revalidatePath(\`/${entity.tableName}/\${id}\`);`);
    lines.push('    return { success: true, data: updated };');
    lines.push('  } catch (error) {');
    lines.push('    if (error instanceof z.ZodError) {');
    lines.push("      return { success: false, error: 'Validation failed', fieldErrors: error.flatten().fieldErrors };");
    lines.push('    }');
    lines.push(`    console.error('Failed to update ${entityName}:', error);`);
    lines.push("    return { success: false, error: error instanceof Error ? error.message : 'Update failed' };");
    lines.push('  }');
    lines.push('}');
    lines.push('');

    // Delete Action
    lines.push(`export async function delete${entityName}(id: string) {`);
    lines.push('  try {');
    if (orm === 'prisma') {
      lines.push(`    await prisma.${varName}.delete({ where: { id } });`);
    } else {
      lines.push(`    await db.delete(${tableVar}).where(eq(${tableVar}.id, id));`);
    }
    lines.push(`    revalidatePath('/${entity.tableName}');`);
    lines.push("    revalidatePath('/');");
    lines.push('    return { success: true, id };');
    lines.push('  } catch (error) {');
    lines.push(`    console.error('Failed to delete ${entityName}:', error);`);
    lines.push("    return { success: false, error: error instanceof Error ? error.message : 'Deletion failed' };");
    lines.push('  }');
    lines.push('}');
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Orchestrator: Generate all full-stack database artifacts in a single bundle
 */
function generateFullStackDatabaseBundle(source, options = {}) {
  const entities = inferEntities(source, options);

  return {
    entities,
    prisma: generatePrismaSchema(entities, options.prisma || options),
    drizzle: generateDrizzleSchema(entities, options.drizzle || options),
    supabase: generateSupabaseMigration(entities, options.supabase || options),
    serverActions: generateNextJsServerActions(entities, options.serverActions || options),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  inferEntities,
  inferEntitiesFromTelemetry: inferEntities,
  inferEntitiesFromNetworkLogs,
  inferEntitiesFromUI,
  normalizeEntities,
  generatePrismaSchema,
  generateDrizzleSchema,
  generateSupabaseMigration,
  generateNextJsServerActions,
  generateFullStackDatabaseBundle,
  toPascalCase,
  toCamelCase,
  toSnakeCase,
  toPluralSnake,
};
