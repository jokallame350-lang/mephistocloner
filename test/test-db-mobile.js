/**
 * Test Suite: Full-Stack Database Generator & Multi-Platform Exporter
 * 
 * Verifies:
 * 1. Entity Inference (from Network Logs & UI Components)
 * 2. Prisma Schema Generation (PostgreSQL, SQLite, Relations, Enums)
 * 3. Drizzle ORM Schema Generation (Tables, Types, Relations)
 * 4. Supabase SQL Migration Generation (RLS Policies, Triggers, Enums)
 * 5. Next.js 15 Server Actions Generation (CRUD, Zod Validation, Revalidation)
 * 6. React Native Exporter (HTML/Tailwind to RN Primitives & StyleSheet)
 * 7. Figma Tokens Studio Exporter (W3C DTCG Format)
 * 8. Flutter Dart Exporter (Widget Tree & Styling)
 */

const assert = require('assert');
const {
  inferEntities,
  inferEntitiesFromNetworkLogs,
  inferEntitiesFromUI,
  generatePrismaSchema,
  generateDrizzleSchema,
  generateSupabaseMigration,
  generateNextJsServerActions,
  generateFullStackDatabaseBundle,
} = require('../lib/fullstack-db-generator');

const {
  exportToReactNative,
  exportToFigmaTokens,
  exportToFlutter,
  tailwindToReactNativeStyle,
  parseCssBoxShadow,
} = require('../lib/multi-platform-exporter');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    throw err;
  }
}

console.log('\n======================================================');
console.log('🧪 RUNNING FULL-STACK DB & MULTI-PLATFORM EXPORTER TESTS');
console.log('======================================================\n');

// ─── 1. ENTITY INFERENCE ENGINE ──────────────────────────────────────
console.log('📦 1. Entity Inference Engine Tests:');

test('infers entities from network payload logs with relations and types', () => {
  const networkLogs = [
    {
      url: 'https://api.example.com/v1/users',
      responseBody: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'alex@example.com',
          name: 'Alex Johnson',
          role: 'ADMIN',
          isActive: true,
          createdAt: '2026-01-15T08:30:00Z',
        },
      ],
    },
    {
      url: 'https://api.example.com/api/posts',
      responseBody: [
        {
          id: 'post_01',
          title: 'Mastering AI Web Generators',
          content: 'Deep dive into full-stack AST compilers and telemetry...',
          published: true,
          viewCount: 1250,
          userId: '123e4567-e89b-12d3-a456-426614174000',
          createdAt: '2026-02-01T12:00:00Z',
        },
      ],
    },
  ];

  const entities = inferEntities({ networkLogs });
  assert(entities.length >= 2, 'Should infer at least 2 entities (User, Post)');

  const user = entities.find((e) => e.name === 'User');
  const post = entities.find((e) => e.name === 'Post');

  assert(user, 'User entity must exist');
  assert(post, 'Post entity must exist');

  // Verify User fields
  const emailField = user.fields.find((f) => f.name === 'email');
  assert(emailField && emailField.isUnique, 'Email field should be unique string');

  const roleField = user.fields.find((f) => f.name === 'role');
  assert(roleField && roleField.type === 'Enum', 'Role field should be inferred as Enum');

  // Verify 1:N Relation between User and Post
  const userIdField = post.fields.find((f) => f.name === 'userId');
  assert(userIdField && userIdField.isForeignKey, 'Post.userId should be foreign key');
  assert.strictEqual(userIdField.foreignKeyTarget, 'User');

  const userPostsRel = user.fields.find((f) => f.name === 'posts');
  assert(userPostsRel && userPostsRel.isRelation, 'User should have posts[] relation field');
});

test('infers entities from UI forms and tables', () => {
  const uiComponents = {
    forms: [
      {
        title: 'Customer Feedback',
        inputs: [
          { name: 'customerEmail', type: 'email', required: true },
          { name: 'rating', type: 'number' },
          { name: 'comments', type: 'textarea' },
          { name: 'category', type: 'select', options: ['BUG', 'FEATURE', 'BILLING'] },
          { name: 'subscribed', type: 'checkbox' },
        ],
      },
    ],
    tables: [
      {
        title: 'Transactions',
        headers: ['Transaction ID', 'Customer Email', 'Amount', 'Status', 'Date'],
      },
    ],
  };

  const entities = inferEntities({ components: uiComponents });
  assert(entities.length >= 2, 'Should infer CustomerFeedback and Transaction entities');

  const feedback = entities.find((e) => e.name === 'CustomerFeedback' || e.name === 'Feedback');
  assert(feedback, 'CustomerFeedback entity should exist');

  const emailField = feedback.fields.find((f) => f.name === 'customerEmail');
  assert(emailField && emailField.type === 'String', 'customerEmail should be String');

  const commentsField = feedback.fields.find((f) => f.name === 'comments');
  assert(commentsField && commentsField.dbType === 'text', 'comments should be text');

  const categoryEnum = feedback.enums.find((en) => en.name.includes('Category'));
  assert(categoryEnum && categoryEnum.values.length === 3, 'Category Enum should have 3 options');
});

// ─── 2. PRISMA SCHEMA GENERATOR ──────────────────────────────────────
console.log('\n📄 2. Prisma Schema Generator Tests:');

test('generates complete Prisma schema for PostgreSQL with directUrl and relations', () => {
  const sampleEntities = [
    {
      name: 'User',
      tableName: 'users',
      description: 'System user account',
      fields: [
        { name: 'id', type: 'String', dbType: 'uuid', isId: true, isUnique: true, defaultValue: 'uuid()' },
        { name: 'email', type: 'String', dbType: 'varchar', isUnique: true, isNullable: false },
        { name: 'role', type: 'Enum', enumName: 'UserRole', enumValues: ['USER', 'ADMIN'], defaultValue: 'USER' },
        { name: 'posts', type: 'Post[]', isRelation: true, relationTo: 'Post' },
      ],
      enums: [{ name: 'UserRole', values: ['USER', 'ADMIN'] }],
    },
    {
      name: 'Post',
      tableName: 'posts',
      fields: [
        { name: 'id', type: 'String', dbType: 'uuid', isId: true, isUnique: true, defaultValue: 'uuid()' },
        { name: 'title', type: 'String', isNullable: false },
        { name: 'authorId', type: 'String', dbType: 'uuid', isForeignKey: true, foreignKeyTarget: 'User' },
      ],
    },
  ];

  const schema = generatePrismaSchema(sampleEntities, {
    provider: 'postgresql',
    databaseUrlEnv: 'DATABASE_URL',
    directUrlEnv: 'DIRECT_URL',
  });

  assert(schema.includes('generator client {'), 'Should include generator client');
  assert(schema.includes('provider = "postgresql"'), 'Should set provider to postgresql');
  assert(schema.includes('directUrl = env("DIRECT_URL")'), 'Should set directUrl');
  assert(schema.includes('enum UserRole {'), 'Should define UserRole enum');
  assert(schema.includes('model User {'), 'Should define model User');
  assert(schema.includes('model Post {'), 'Should define model Post');
  assert(schema.includes('@relation(fields: [authorId], references: [id], onDelete: Cascade)'), 'Should configure relation with onDelete');
  assert(schema.includes('@@map("users")'), 'Should map table name');
});

test('generates SQLite-compatible Prisma schema without unsupported enums', () => {
  const sampleEntities = [
    {
      name: 'Product',
      tableName: 'products',
      fields: [
        { name: 'id', type: 'String', isId: true, defaultValue: 'cuid()' },
        { name: 'name', type: 'String', isNullable: false },
        { name: 'status', type: 'Enum', enumName: 'ProductStatus', defaultValue: 'ACTIVE' },
      ],
    },
  ];

  const schema = generatePrismaSchema(sampleEntities, { provider: 'sqlite' });
  assert(schema.includes('provider = "sqlite"'), 'Should set provider to sqlite');
  assert(!schema.includes('enum ProductStatus'), 'SQLite schema should omit enum blocks');
  assert(schema.includes('status String'), 'Enum field in SQLite should fall back to String');
});

// ─── 3. DRIZZLE ORM SCHEMA GENERATOR ─────────────────────────────────
console.log('\n💧 3. Drizzle ORM Schema Generator Tests:');

test('generates complete Drizzle ORM schema with tables, relations, and types', () => {
  const sampleEntities = [
    {
      name: 'User',
      tableName: 'users',
      fields: [
        { name: 'id', type: 'String', dbType: 'uuid', isId: true },
        { name: 'email', type: 'String', isUnique: true, isNullable: false },
        { name: 'role', type: 'Enum', enumName: 'UserRole', enumValues: ['USER', 'ADMIN'] },
        { name: 'posts', type: 'Post[]', isRelation: true, relationTo: 'Post' },
      ],
      enums: [{ name: 'UserRole', values: ['USER', 'ADMIN'] }],
    },
    {
      name: 'Post',
      tableName: 'posts',
      fields: [
        { name: 'id', type: 'String', dbType: 'uuid', isId: true },
        { name: 'title', type: 'String', isNullable: false },
        { name: 'authorId', type: 'String', dbType: 'uuid', isForeignKey: true, foreignKeyTarget: 'User' },
      ],
    },
  ];

  const drizzleCode = generateDrizzleSchema(sampleEntities, { dialect: 'pg' });

  assert(drizzleCode.includes("import { pgTable"), 'Should import pgTable');
  assert(drizzleCode.includes("import { relations } from 'drizzle-orm'"), 'Should import relations');
  assert(drizzleCode.includes("export const userRole = pgEnum('user_role', [\"USER\",\"ADMIN\"]);"), 'Should declare pgEnum');
  assert(drizzleCode.includes("export const users = pgTable('users'"), 'Should declare users pgTable');
  assert(drizzleCode.includes("export const posts = pgTable('posts'"), 'Should declare posts pgTable');
  assert(drizzleCode.includes("export const usersRelations = relations(users"), 'Should declare usersRelations');
  assert(drizzleCode.includes("export type User = typeof users.$inferSelect;"), 'Should export inferred Select type');
  assert(drizzleCode.includes("export type NewUser = typeof users.$inferInsert;"), 'Should export inferred Insert type');
});

// ─── 4. SUPABASE SQL MIGRATIONS GENERATOR ────────────────────────────
console.log('\n⚡ 4. Supabase SQL Migration Generator Tests:');

test('generates Supabase SQL migration with RLS, updated_at trigger, and security policies', () => {
  const sampleEntities = [
    {
      name: 'User',
      tableName: 'users',
      fields: [
        { name: 'id', type: 'String', dbType: 'uuid', isId: true },
        { name: 'email', type: 'String', isUnique: true, isNullable: false },
        { name: 'role', type: 'Enum', enumName: 'UserRole', enumValues: ['USER', 'ADMIN'] },
      ],
      enums: [{ name: 'UserRole', values: ['USER', 'ADMIN'] }],
      rlsPolicies: [
        { name: 'Users can view own profile', operation: 'SELECT', using: 'auth.uid() = id' },
      ],
    },
    {
      name: 'Article',
      tableName: 'articles',
      fields: [
        { name: 'id', type: 'String', dbType: 'uuid', isId: true },
        { name: 'title', type: 'String', isNullable: false },
        { name: 'authorId', type: 'String', dbType: 'uuid', isForeignKey: true, foreignKeyTarget: 'User' },
      ],
    },
  ];

  const sql = generateSupabaseMigration(sampleEntities, { migrationName: '001_init', enableRls: true });

  assert(sql.includes('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'), 'Should enable uuid extension');
  assert(sql.includes('CREATE TYPE public.user_role AS ENUM'), 'Should create custom enum type');
  assert(sql.includes('CREATE OR REPLACE FUNCTION public.handle_updated_at()'), 'Should define updated_at trigger function');
  assert(sql.includes('CREATE TABLE IF NOT EXISTS public.users ('), 'Should create users table');
  assert(sql.includes('CREATE TABLE IF NOT EXISTS public.articles ('), 'Should create articles table');
  assert(sql.includes('REFERENCES public.users(id) ON DELETE CASCADE'), 'Should add foreign key cascade');
  assert(sql.includes('CREATE INDEX IF NOT EXISTS idx_articles_author_id'), 'Should create index on foreign key');
  assert(sql.includes('ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;'), 'Should enable RLS on users');
  assert(sql.includes('ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;'), 'Should enable RLS on articles');
  assert(sql.includes('CREATE POLICY "Users can view own profile"'), 'Should create specific RLS policy');
});

// ─── 5. NEXT.JS 15 SERVER ACTIONS GENERATOR ──────────────────────────
console.log('\n🚀 5. Next.js 15 Server Actions Generator Tests:');

test('generates type-safe CRUD server actions with Zod schemas and revalidatePath', () => {
  const sampleEntities = [
    {
      name: 'Project',
      tableName: 'projects',
      fields: [
        { name: 'id', type: 'String', dbType: 'uuid', isId: true },
        { name: 'name', type: 'String', isNullable: false, maxLength: 100 },
        { name: 'status', type: 'Enum', enumName: 'ProjectStatus', enumValues: ['ACTIVE', 'ARCHIVED'] },
        { name: 'budget', type: 'Float', isNullable: true },
      ],
    },
  ];

  const actionsCode = generateNextJsServerActions(sampleEntities, { orm: 'prisma' });

  assert(actionsCode.includes("'use server';"), "Must begin with 'use server'");
  assert(actionsCode.includes("import { revalidatePath } from 'next/cache';"), 'Should import revalidatePath');
  assert(actionsCode.includes("import { z } from 'zod';"), 'Should import Zod');
  assert(actionsCode.includes('export const CreateProjectSchema = z.object({'), 'Should export CreateProjectSchema');
  assert(actionsCode.includes('export const UpdateProjectSchema = CreateProjectSchema.partial();'), 'Should export UpdateProjectSchema');
  assert(actionsCode.includes('export async function listProjects('), 'Should generate listProjects action');
  assert(actionsCode.includes('export async function getProjectById(id: string)'), 'Should generate getProjectById action');
  assert(actionsCode.includes('export async function createProject('), 'Should generate createProject action');
  assert(actionsCode.includes('export async function updateProject('), 'Should generate updateProject action');
  assert(actionsCode.includes('export async function deleteProject('), 'Should generate deleteProject action');
  assert(actionsCode.includes("revalidatePath('/projects');"), 'Should revalidate path on mutations');
});

// ─── 6. REACT NATIVE EXPORTER ────────────────────────────────────────
console.log('\n📱 6. React Native Exporter Tests:');

test('converts HTML elements and Tailwind classes into React Native primitives and StyleSheet', () => {
  const webJsx = `
    <div className="flex flex-col p-6 bg-slate-900 rounded-2xl shadow-lg max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
      <p className="text-sm text-slate-400 mb-6">Sign in to your account</p>
      <input type="email" placeholder="name@example.com" className="p-4 bg-slate-800 rounded-lg text-white mb-4" />
      <input type="password" placeholder="••••••••" className="p-4 bg-slate-800 rounded-lg text-white mb-6" />
      <button onClick={() => handleLogin()} className="py-4 bg-blue-600 rounded-lg items-center justify-center">
        <span className="text-white font-semibold">Sign In</span>
      </button>
      <img src="https://example.com/logo.png" alt="Logo" className="w-12 h-12 mt-4 self-center" />
    </div>
  `;

  const rnCode = exportToReactNative(webJsx, { componentName: 'LoginScreen', styling: 'stylesheet' });

  assert(rnCode.includes("import React"), 'Should import React');
  assert(rnCode.includes("from 'react-native';"), 'Should import React Native primitives');
  assert(rnCode.includes('<SafeAreaView'), 'Should wrap in SafeAreaView');
  assert(rnCode.includes('<ScrollView'), 'Should wrap in ScrollView');
  assert(rnCode.includes('<TextInput'), 'Should transform <input> to <TextInput>');
  assert(rnCode.includes('secureTextEntry'), 'Password input should have secureTextEntry');
  assert(rnCode.includes('keyboardType="email-address"'), 'Email input should have keyboardType');
  assert(rnCode.includes('<TouchableOpacity'), 'Should transform <button> to <TouchableOpacity>');
  assert(rnCode.includes('<Image'), 'Should transform <img> to <Image>');
  assert(rnCode.includes("source={{ uri: 'https://example.com/logo.png' }}"), 'Image should have uri source');
  assert(rnCode.includes('const styles = StyleSheet.create('), 'Should generate StyleSheet');
  assert(rnCode.includes('backgroundColor'), 'StyleSheet should contain mapped background colors');
});

test('transforms Tailwind utility classes to valid React Native style objects', () => {
  const styles = tailwindToReactNativeStyle('flex flex-row items-center justify-between p-4 bg-blue-600 rounded-xl shadow-md');

  assert.strictEqual(styles.display, 'flex');
  assert.strictEqual(styles.flexDirection, 'row');
  assert.strictEqual(styles.alignItems, 'center');
  assert.strictEqual(styles.justifyContent, 'space-between');
  assert.strictEqual(styles.padding, 16);
  assert.strictEqual(styles.backgroundColor, '#2563eb');
  assert.strictEqual(styles.borderRadius, 12);
  assert.strictEqual(styles.elevation, 3);
});

// ─── 7. FIGMA TOKENS STUDIO (W3C DTCG) EXPORTER ──────────────────────
console.log('\n🎨 7. Figma Tokens Studio (W3C DTCG) Exporter Tests:');

test('exports telemetry to valid W3C Design Tokens standard JSON format', () => {
  const telemetry = {
    meta: { title: 'Enterprise Design System' },
    colors: [
      { color: '#0f172a', role: 'background', frequency: 100 },
      { color: '#3b82f6', role: 'primary', frequency: 80 },
      { color: '#10b981', role: 'success', frequency: 40 },
    ],
    fonts: {
      families: ['Inter, sans-serif', 'JetBrains Mono, monospace'],
      sizes: ['14px', '16px', '20px', '24px'],
    },
    shadows: ['0 4px 6px -1px rgba(0, 0, 0, 0.1)'],
    borderRadius: ['4px', '8px', '16px', '9999px'],
  };

  const jsonStr = exportToFigmaTokens(telemetry);
  assert.doesNotThrow(() => JSON.parse(jsonStr), 'Tokens output must be valid JSON');

  const tokens = JSON.parse(jsonStr);
  assert.strictEqual(tokens.version, '2.0.0');
  assert(tokens.$metadata && Array.isArray(tokens.$metadata.tokenSetOrder), 'Should contain $metadata with tokenSetOrder');
  assert(tokens.global && tokens.global.color, 'Should contain global color tokens');
  assert.strictEqual(tokens.global.color['brand-primary'].$type, 'color');
  assert.strictEqual(tokens.global.color['brand-primary'].$value, '#3b82f6');
  assert(tokens.global.fontFamily.sans, 'Should contain font family sans');
  assert(tokens.global.boxShadow.sm || tokens.global.boxShadow['shadow-1'], 'Should contain shadow tokens');
  assert(tokens.light && tokens.dark, 'Should include light and dark theme sets');
});

test('parses CSS box-shadow string to structured Figma box shadow token', () => {
  const parsed = parseCssBoxShadow('0 10px 15px -3px rgba(0, 0, 0, 0.2)');
  assert.strictEqual(parsed.type, 'dropShadow');
  assert.strictEqual(parsed.x, '0px');
  assert.strictEqual(parsed.y, '10px');
  assert.strictEqual(parsed.blur, '15px');
  assert.strictEqual(parsed.spread, '-3px');
  assert.strictEqual(parsed.color, 'rgba(0, 0, 0, 0.2)');
});

// ─── 8. FLUTTER DART EXPORTER ────────────────────────────────────────
console.log('\n🐦 8. Flutter Dart Exporter Tests:');

test('generates valid Flutter Dart widget tree from Web JSX', () => {
  const webJsx = `<div className="p-4 bg-slate-900"><h1 className="text-xl text-white">Dashboard</h1></div>`;
  const flutterCode = exportToFlutter(webJsx, { widgetName: 'DashboardScreen' });

  assert(flutterCode.includes("import 'package:flutter/material.dart';"), 'Should import flutter/material.dart');
  assert(flutterCode.includes('class DashboardScreen extends StatelessWidget {'), 'Should declare StatelessWidget');
  assert(flutterCode.includes('Widget build(BuildContext context) {'), 'Should implement build method');
  assert(flutterCode.includes('Scaffold('), 'Should return Scaffold widget');
  assert(flutterCode.includes('SingleChildScrollView('), 'Should contain SingleChildScrollView');
  assert(flutterCode.includes('ElevatedButton('), 'Should contain ElevatedButton');
  assert(flutterCode.includes('TextField('), 'Should contain TextField');
});

// ─── 9. FULL-STACK DATABASE BUNDLE ORCHESTRATOR ──────────────────────
console.log('\n📦 9. Full-Stack Database Bundle Orchestrator Tests:');

test('generates all database artifacts in one comprehensive bundle', () => {
  const bundle = generateFullStackDatabaseBundle({
    networkLogs: [
      {
        url: '/api/v1/workspaces',
        responseBody: [{ id: 'ws-1', name: 'Main Team', isPrivate: false, createdAt: '2026-01-01' }],
      },
    ],
  });

  assert(bundle.entities.length >= 1, 'Bundle should contain inferred entities');
  assert(bundle.prisma && bundle.prisma.includes('model Workspace'), 'Bundle should contain Prisma schema');
  assert(bundle.drizzle && bundle.drizzle.includes('export const workspaces'), 'Bundle should contain Drizzle schema');
  assert(bundle.supabase && bundle.supabase.includes('CREATE TABLE IF NOT EXISTS public.workspaces'), 'Bundle should contain Supabase SQL');
  assert(bundle.serverActions && bundle.serverActions.includes('export async function createWorkspace'), 'Bundle should contain Server Actions');
});

console.log('\n======================================================');
console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY (0 ERRORS)!`);
console.log('======================================================\n');
