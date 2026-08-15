/**
 * SitePrompter Multi-Platform Mobile & Figma Exporter Engine
 * 
 * Converts React / Next.js / HTML web components and telemetry into:
 * 1. React Native (TypeScript / TSX) with NativeWind & StyleSheet mapping
 * 2. W3C Standard Design Tokens (Figma Tokens Studio compatible JSON)
 * 3. Flutter Dart Widget Tree (StatelessWidget / StatefulWidget)
 */

// ============================================================================
// 1. TAILWIND COLOR PALETTE & STYLE MAPPER
// ============================================================================

const TAILWIND_COLORS = {
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
  'current': 'currentColor',
  'slate-50': '#f8fafc',
  'slate-100': '#f1f5f9',
  'slate-200': '#e2e8f0',
  'slate-300': '#cbd5e1',
  'slate-400': '#94a3b8',
  'slate-500': '#64748b',
  'slate-600': '#475569',
  'slate-700': '#334155',
  'slate-800': '#1e293b',
  'slate-900': '#0f172a',
  'slate-950': '#020617',
  'gray-50': '#f9fafb',
  'gray-100': '#f3f4f6',
  'gray-200': '#e5e7eb',
  'gray-300': '#d1d5db',
  'gray-400': '#9ca3af',
  'gray-500': '#6b7280',
  'gray-600': '#4b5563',
  'gray-700': '#374151',
  'gray-800': '#1f2937',
  'gray-900': '#111827',
  'gray-950': '#030712',
  'zinc-50': '#fafafa',
  'zinc-100': '#f4f4f5',
  'zinc-200': '#e4e4e7',
  'zinc-700': '#3f3f46',
  'zinc-800': '#27272a',
  'zinc-900': '#18181b',
  'blue-50': '#eff6ff',
  'blue-100': '#dbeafe',
  'blue-500': '#3b82f6',
  'blue-600': '#2563eb',
  'blue-700': '#1d4ed8',
  'indigo-50': '#eef2ff',
  'indigo-100': '#e0e7ff',
  'indigo-500': '#6366f1',
  'indigo-600': '#4f46e5',
  'indigo-700': '#4338ca',
  'violet-500': '#8b5cf6',
  'violet-600': '#7c3aed',
  'purple-500': '#a855f7',
  'purple-600': '#9333ea',
  'emerald-500': '#10b981',
  'emerald-600': '#059669',
  'green-500': '#22c55e',
  'green-600': '#16a34a',
  'red-500': '#ef4444',
  'red-600': '#dc2626',
  'rose-500': '#f43f5e',
  'rose-600': '#e11d48',
  'amber-500': '#f59e0b',
  'amber-600': '#d97706',
  'cyan-500': '#06b6d4',
  'cyan-600': '#0891b2',
  'sky-500': '#0ea5e9',
  'sky-600': '#0284c7',
};

const SPACING_MAP = {
  '0': 0,
  '0.5': 2,
  '1': 4,
  '1.5': 6,
  '2': 8,
  '2.5': 10,
  '3': 12,
  '3.5': 14,
  '4': 16,
  '5': 20,
  '6': 24,
  '7': 28,
  '8': 32,
  '9': 36,
  '10': 40,
  '11': 44,
  '12': 48,
  '14': 56,
  '16': 64,
  '20': 80,
  '24': 96,
  '28': 112,
  '32': 128,
  '36': 144,
  '40': 160,
  '48': 192,
  '56': 224,
  '64': 256,
};

const FONT_SIZE_MAP = {
  'xs': { fontSize: 12, lineHeight: 16 },
  'sm': { fontSize: 14, lineHeight: 20 },
  'base': { fontSize: 16, lineHeight: 24 },
  'lg': { fontSize: 18, lineHeight: 28 },
  'xl': { fontSize: 20, lineHeight: 28 },
  '2xl': { fontSize: 24, lineHeight: 32 },
  '3xl': { fontSize: 30, lineHeight: 36 },
  '4xl': { fontSize: 36, lineHeight: 40 },
  '5xl': { fontSize: 48, lineHeight: 48 },
  '6xl': { fontSize: 60, lineHeight: 60 },
};

const FONT_WEIGHT_MAP = {
  'thin': '100',
  'extralight': '200',
  'light': '300',
  'normal': '400',
  'medium': '500',
  'semibold': '600',
  'bold': '700',
  'extrabold': '800',
  'black': '900',
};

const BORDER_RADIUS_MAP = {
  'none': 0,
  'sm': 2,
  'DEFAULT': 4,
  'md': 6,
  'lg': 8,
  'xl': 12,
  '2xl': 16,
  '3xl': 24,
  'full': 9999,
};

/**
 * Resolve color name or arbitrary hex [#[a-f0-9]+] to hex string
 */
function resolveColor(token) {
  if (!token) return undefined;
  if (token.startsWith('[#') && token.endsWith(']')) {
    return token.slice(1, -1);
  }
  if (token.startsWith('#')) return token;
  if (TAILWIND_COLORS[token]) return TAILWIND_COLORS[token];
  // Check prefix match
  const found = Object.keys(TAILWIND_COLORS).find((k) => k === token || token.startsWith(k));
  if (found) return TAILWIND_COLORS[found];
  return undefined;
}

/**
 * Parses Tailwind utility classes into React Native style properties
 * @param {string} classNames
 * @returns {Object} React Native style object
 */
function tailwindToReactNativeStyle(classNames = '') {
  const styles = {};
  if (!classNames || typeof classNames !== 'string') return styles;

  const tokens = classNames.split(/\s+/).filter(Boolean);

  for (const token of tokens) {
    // 1. Flex & Layout
    if (token === 'flex') styles.display = 'flex';
    else if (token === 'flex-row') styles.flexDirection = 'row';
    else if (token === 'flex-col') styles.flexDirection = 'column';
    else if (token === 'flex-row-reverse') styles.flexDirection = 'row-reverse';
    else if (token === 'flex-col-reverse') styles.flexDirection = 'column-reverse';
    else if (token === 'flex-1') styles.flex = 1;
    else if (token === 'flex-initial') styles.flex = 0;
    else if (token === 'flex-wrap') styles.flexWrap = 'wrap';
    else if (token === 'flex-nowrap') styles.flexWrap = 'nowrap';
    else if (token === 'items-center') styles.alignItems = 'center';
    else if (token === 'items-start') styles.alignItems = 'flex-start';
    else if (token === 'items-end') styles.alignItems = 'flex-end';
    else if (token === 'items-stretch') styles.alignItems = 'stretch';
    else if (token === 'items-baseline') styles.alignItems = 'baseline';
    else if (token === 'justify-center') styles.justifyContent = 'center';
    else if (token === 'justify-between') styles.justifyContent = 'space-between';
    else if (token === 'justify-around') styles.justifyContent = 'space-around';
    else if (token === 'justify-evenly') styles.justifyContent = 'space-evenly';
    else if (token === 'justify-start') styles.justifyContent = 'flex-start';
    else if (token === 'justify-end') styles.justifyContent = 'flex-end';
    else if (token === 'self-center') styles.alignSelf = 'center';
    else if (token === 'self-start') styles.alignSelf = 'flex-start';
    else if (token === 'self-end') styles.alignSelf = 'flex-end';

    // Gap
    else if (token.startsWith('gap-')) {
      const g = token.replace('gap-', '');
      if (SPACING_MAP[g] !== undefined) styles.gap = SPACING_MAP[g];
    } else if (token.startsWith('gap-x-')) {
      const g = token.replace('gap-x-', '');
      if (SPACING_MAP[g] !== undefined) styles.columnGap = SPACING_MAP[g];
    } else if (token.startsWith('gap-y-')) {
      const g = token.replace('gap-y-', '');
      if (SPACING_MAP[g] !== undefined) styles.rowGap = SPACING_MAP[g];
    }

    // 2. Padding & Margin
    else if (token.startsWith('p-')) {
      const val = SPACING_MAP[token.replace('p-', '')];
      if (val !== undefined) styles.padding = val;
    } else if (token.startsWith('px-')) {
      const val = SPACING_MAP[token.replace('px-', '')];
      if (val !== undefined) styles.paddingHorizontal = val;
    } else if (token.startsWith('py-')) {
      const val = SPACING_MAP[token.replace('py-', '')];
      if (val !== undefined) styles.paddingVertical = val;
    } else if (token.startsWith('pt-')) {
      const val = SPACING_MAP[token.replace('pt-', '')];
      if (val !== undefined) styles.paddingTop = val;
    } else if (token.startsWith('pb-')) {
      const val = SPACING_MAP[token.replace('pb-', '')];
      if (val !== undefined) styles.paddingBottom = val;
    } else if (token.startsWith('pl-')) {
      const val = SPACING_MAP[token.replace('pl-', '')];
      if (val !== undefined) styles.paddingLeft = val;
    } else if (token.startsWith('pr-')) {
      const val = SPACING_MAP[token.replace('pr-', '')];
      if (val !== undefined) styles.paddingRight = val;
    }

    else if (token.startsWith('m-')) {
      const val = SPACING_MAP[token.replace('m-', '')];
      if (val !== undefined) styles.margin = val;
    } else if (token === 'mx-auto') {
      styles.alignSelf = 'center';
    } else if (token.startsWith('mx-')) {
      const val = SPACING_MAP[token.replace('mx-', '')];
      if (val !== undefined) styles.marginHorizontal = val;
    } else if (token.startsWith('my-')) {
      const val = SPACING_MAP[token.replace('my-', '')];
      if (val !== undefined) styles.marginVertical = val;
    } else if (token.startsWith('mt-')) {
      const val = SPACING_MAP[token.replace('mt-', '')];
      if (val !== undefined) styles.marginTop = val;
    } else if (token.startsWith('mb-')) {
      const val = SPACING_MAP[token.replace('mb-', '')];
      if (val !== undefined) styles.marginBottom = val;
    } else if (token.startsWith('ml-')) {
      const val = SPACING_MAP[token.replace('ml-', '')];
      if (val !== undefined) styles.marginLeft = val;
    } else if (token.startsWith('mr-')) {
      const val = SPACING_MAP[token.replace('mr-', '')];
      if (val !== undefined) styles.marginRight = val;
    }

    // 3. Sizing
    else if (token === 'w-full') styles.width = '100%';
    else if (token === 'w-screen') styles.width = '100%';
    else if (token === 'w-1/2') styles.width = '50%';
    else if (token === 'w-1/3') styles.width = '33.333%';
    else if (token === 'w-2/3') styles.width = '66.666%';
    else if (token === 'w-1/4') styles.width = '25%';
    else if (token === 'w-3/4') styles.width = '75%';
    else if (token.startsWith('w-') && SPACING_MAP[token.replace('w-', '')] !== undefined) {
      styles.width = SPACING_MAP[token.replace('w-', '')];
    }
    else if (token === 'h-full') styles.height = '100%';
    else if (token === 'h-screen') styles.height = '100%';
    else if (token.startsWith('h-') && SPACING_MAP[token.replace('h-', '')] !== undefined) {
      styles.height = SPACING_MAP[token.replace('h-', '')];
    }
    else if (token.startsWith('min-h-')) {
      if (token === 'min-h-screen') styles.minHeight = '100%';
      else if (SPACING_MAP[token.replace('min-h-', '')] !== undefined) styles.minHeight = SPACING_MAP[token.replace('min-h-', '')];
    }
    else if (token.startsWith('max-w-')) {
      const mw = token.replace('max-w-', '');
      if (mw === 'xs') styles.maxWidth = 320;
      else if (mw === 'sm') styles.maxWidth = 384;
      else if (mw === 'md') styles.maxWidth = 448;
      else if (mw === 'lg') styles.maxWidth = 512;
      else if (mw === 'xl') styles.maxWidth = 576;
      else if (mw === '2xl') styles.maxWidth = 672;
      else if (mw === '4xl') styles.maxWidth = 896;
      else if (mw === '7xl') styles.maxWidth = 1280;
    }

    // 4. Background Colors
    else if (token.startsWith('bg-')) {
      const colorToken = token.replace('bg-', '');
      const color = resolveColor(colorToken);
      if (color) styles.backgroundColor = color;
    }

    // 5. Text Styling
    else if (token.startsWith('text-')) {
      const textVal = token.replace('text-', '');
      if (FONT_SIZE_MAP[textVal]) {
        styles.fontSize = FONT_SIZE_MAP[textVal].fontSize;
        styles.lineHeight = FONT_SIZE_MAP[textVal].lineHeight;
      } else if (textVal === 'center') {
        styles.textAlign = 'center';
      } else if (textVal === 'left') {
        styles.textAlign = 'left';
      } else if (textVal === 'right') {
        styles.textAlign = 'right';
      } else {
        const color = resolveColor(textVal);
        if (color) styles.color = color;
      }
    } else if (token.startsWith('font-')) {
      const weight = token.replace('font-', '');
      if (FONT_WEIGHT_MAP[weight]) {
        styles.fontWeight = FONT_WEIGHT_MAP[weight];
      }
    }

    // 6. Borders & Radius
    else if (token === 'rounded') {
      styles.borderRadius = BORDER_RADIUS_MAP.DEFAULT;
    } else if (token.startsWith('rounded-')) {
      const r = token.replace('rounded-', '');
      if (BORDER_RADIUS_MAP[r] !== undefined) {
        styles.borderRadius = BORDER_RADIUS_MAP[r];
      } else if (r === 'full') {
        styles.borderRadius = 9999;
      }
    } else if (token === 'border') {
      styles.borderWidth = 1;
    } else if (token.startsWith('border-')) {
      const bVal = token.replace('border-', '');
      if (['0', '2', '4', '8'].includes(bVal)) {
        styles.borderWidth = parseInt(bVal, 10);
      } else if (bVal === 't') styles.borderTopWidth = 1;
      else if (bVal === 'b') styles.borderBottomWidth = 1;
      else if (bVal === 'l') styles.borderLeftWidth = 1;
      else if (bVal === 'r') styles.borderRightWidth = 1;
      else {
        const color = resolveColor(bVal);
        if (color) styles.borderColor = color;
      }
    }

    // 7. Shadows
    else if (token === 'shadow' || token === 'shadow-md') {
      styles.shadowColor = '#000000';
      styles.shadowOffset = { width: 0, height: 2 };
      styles.shadowOpacity = 0.1;
      styles.shadowRadius = 4;
      styles.elevation = 3;
    } else if (token === 'shadow-lg' || token === 'shadow-xl' || token === 'shadow-2xl') {
      styles.shadowColor = '#000000';
      styles.shadowOffset = { width: 0, height: 6 };
      styles.shadowOpacity = 0.15;
      styles.shadowRadius = 12;
      styles.elevation = 8;
    } else if (token === 'shadow-sm') {
      styles.shadowColor = '#000000';
      styles.shadowOffset = { width: 0, height: 1 };
      styles.shadowOpacity = 0.05;
      styles.shadowRadius = 2;
      styles.elevation = 1;
    }

    // 8. Overflow & Opacity
    else if (token === 'overflow-hidden') {
      styles.overflow = 'hidden';
    } else if (token.startsWith('opacity-')) {
      const op = parseInt(token.replace('opacity-', ''), 10);
      if (!isNaN(op)) styles.opacity = op / 100;
    }
  }

  return styles;
}

// ============================================================================
// 2. REACT NATIVE EXPORTER
// ============================================================================

/**
 * Converts JSX web code into React Native components with NativeWind and/or StyleSheet styles
 * @param {string} jsxWebCode
 * @param {Object} options
 * @returns {string} React Native TSX source code
 */
function exportToReactNative(jsxWebCode = '', options = {}) {
  const componentName = options.componentName || 'ExportedScreen';
  const styling = (options.styling || 'both').toLowerCase(); // 'stylesheet', 'nativewind', 'both'
  const useSafeArea = options.useSafeArea !== false;
  const useScrollView = options.useScrollView !== false;

  let code = String(jsxWebCode || '');

  // Extract component name if already present in code
  const fnMatch = code.match(/export\s+default\s+function\s+([A-Za-z0-9_]+)/) || code.match(/function\s+([A-Za-z0-9_]+)/);
  const actualName = fnMatch ? fnMatch[1] : componentName;

  // Extract collected classNames to build StyleSheet
  const extractedStyles = {};
  let styleCounter = 1;

  // Helper to replace HTML elements with React Native primitives
  let rnBody = code;

  // Remove next.js specific imports or HTML scripts
  rnBody = rnBody.replace(/import\s+[^;]+from\s+['"]next\/[^'"]+['"];?/g, '');
  rnBody = rnBody.replace(/import\s+['"][^'"]+\.css['"];?/g, '');

  // Transform elements
  // 1. Inputs: <input ... /> -> <TextInput ... />
  rnBody = rnBody.replace(/<input([^>]*?)(\/?>)/gi, (match, attrs, close) => {
    let newAttrs = attrs;
    let placeholderColor = ' placeholderTextColor="#9ca3af"';
    if (newAttrs.includes('type="password"')) {
      newAttrs = newAttrs.replace(/type="password"/g, 'secureTextEntry');
    }
    if (newAttrs.includes('type="number"') || newAttrs.includes('type="tel"')) {
      newAttrs = newAttrs.replace(/type="[^"]+"/g, 'keyboardType="numeric"');
    } else if (newAttrs.includes('type="email"')) {
      newAttrs = newAttrs.replace(/type="email"/g, 'keyboardType="email-address" autoCapitalize="none"');
    } else {
      newAttrs = newAttrs.replace(/type="[^"]+"/g, '');
    }
    return `<TextInput${placeholderColor}${newAttrs} />`;
  });

  // 2. Textarea: <textarea ... >...</textarea> -> <TextInput multiline numberOfLines={4} ... />
  rnBody = rnBody.replace(/<textarea([^>]*?)>([\s\S]*?)<\/textarea>/gi, (match, attrs, inner) => {
    return `<TextInput multiline numberOfLines={4} textAlignVertical="top"${attrs}>${inner}</TextInput>`;
  });

  // 3. Images: <img src="..." alt="..." /> -> <Image source={{ uri: "..." }} resizeMode="cover" ... />
  rnBody = rnBody.replace(/<img([^>]*?)src=(['"])(.*?)\2([^>]*?)(\/?>)/gi, (match, before, q, src, after) => {
    return `<Image source={{ uri: '${src}' }} resizeMode="cover"${before}${after} />`;
  });

  // 4. Buttons: <button onClick={...}>...</button> -> <TouchableOpacity activeOpacity={0.8} onPress={...}>...</TouchableOpacity>
  rnBody = rnBody.replace(/<button([^>]*?)onClick=({[^}]+}|"[^"]+")([^>]*?)>([\s\S]*?)<\/button>/gi, '<TouchableOpacity activeOpacity={0.8}$1onPress=$2$3><Text>$4</Text></TouchableOpacity>');
  rnBody = rnBody.replace(/<button([^>]*?)>([\s\S]*?)<\/button>/gi, '<TouchableOpacity activeOpacity={0.8}$1><Text>$2</Text></TouchableOpacity>');
  rnBody = rnBody.replace(/<\/button>/gi, '</TouchableOpacity>');

  // 5. Links: <a href="..." ...> -> <TouchableOpacity onPress={() => Linking.openURL(...)}><Text ...>...</Text></TouchableOpacity>
  rnBody = rnBody.replace(/<a([^>]*?)href=(['"])(.*?)\2([^>]*?)>([\s\S]*?)<\/a>/gi, (match, before, q, href, after, inner) => {
    return `<TouchableOpacity onPress={() => Linking.openURL('${href}')}${before}${after}><Text>${inner}</Text></TouchableOpacity>`;
  });

  // 6. Text Elements: <p>, <span>, <h1>-<h6>, <label>, <b>, <strong>, <i>, <em> -> <Text>
  const textTags = ['p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'label', 'b', 'strong', 'i', 'em', 'small'];
  textTags.forEach((tag) => {
    const openRegex = new RegExp(`<${tag}(\\s[^>]*)?>`, 'gi');
    const closeRegex = new RegExp(`</${tag}>`, 'gi');
    rnBody = rnBody.replace(openRegex, (match, attrs) => `<Text${attrs || ''}>`);
    rnBody = rnBody.replace(closeRegex, '</Text>');
  });

  // 7. Structural / Container tags: <div>, <section>, <article>, <main>, <header>, <footer>, <nav>, <aside>, <ul>, <ol>, <li> -> <View>
  const viewTags = ['div', 'section', 'article', 'main', 'header', 'footer', 'nav', 'aside', 'ul', 'ol', 'li', 'form', 'table', 'thead', 'tbody', 'tr', 'th', 'td'];
  viewTags.forEach((tag) => {
    const openRegex = new RegExp(`<${tag}(\\s[^>]*)?>`, 'gi');
    const closeRegex = new RegExp(`</${tag}>`, 'gi');
    rnBody = rnBody.replace(openRegex, (match, attrs) => `<View${attrs || ''}>`);
    rnBody = rnBody.replace(closeRegex, '</View>');
  });

  // Extract and build StyleSheet objects if requested
  if (styling === 'stylesheet' || styling === 'both') {
    rnBody = rnBody.replace(/className=(['"])(.*?)\1/gi, (match, q, classNames) => {
      const key = `style_${styleCounter++}`;
      const styleObj = tailwindToReactNativeStyle(classNames);
      if (Object.keys(styleObj).length > 0) {
        extractedStyles[key] = styleObj;
        if (styling === 'stylesheet') {
          return `style={styles.${key}}`;
        } else {
          // both: keep className for NativeWind & add style
          return `className="${classNames}" style={styles.${key}}`;
        }
      }
      return styling === 'stylesheet' ? '' : `className="${classNames}"`;
    });
  }

  // Build the complete React Native TSX file
  const imports = [
    "import React, { useState } from 'react';",
    "import {",
    "  StyleSheet,",
    "  View,",
    "  Text,",
    "  TouchableOpacity,",
    "  Image,",
    "  TextInput,",
    "  ScrollView,",
    "  SafeAreaView,",
    "  StatusBar,",
    "  Linking,",
    "  Platform,",
    "  Dimensions,",
    "} from 'react-native';",
  ];

  // If NativeWind or clean styling
  const outputLines = [
    '/**',
    ` * ${actualName} (React Native / Expo Component)`,
    ' * Exported by SitePrompter Multi-Platform Mobile Engine',
    ' */',
    '',
    ...imports,
    '',
  ];

  // Wrap return in SafeAreaView and ScrollView if needed
  if (!rnBody.includes('export default') && !rnBody.includes('function ')) {
    outputLines.push(`export default function ${actualName}() {`);
    outputLines.push('  return (');
    if (useSafeArea) outputLines.push('    <SafeAreaView style={styles.safeArea}>');
    outputLines.push('      <StatusBar barStyle="dark-content" />');
    if (useScrollView) outputLines.push('      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>');
    outputLines.push(`        ${rnBody.trim()}`);
    if (useScrollView) outputLines.push('      </ScrollView>');
    if (useSafeArea) outputLines.push('    </SafeAreaView>');
    outputLines.push('  );');
    outputLines.push('}');
  } else {
    // Already contains function declaration
    outputLines.push(rnBody.trim());
  }

  // Append StyleSheet
  extractedStyles.safeArea = { flex: 1, backgroundColor: '#ffffff' };
  extractedStyles.scrollContainer = { flexGrow: 1, paddingBottom: 32 };

  outputLines.push('');
  outputLines.push('const styles = StyleSheet.create(');
  outputLines.push(JSON.stringify(extractedStyles, null, 2));
  outputLines.push(');');

  return outputLines.join('\n');
}

// ============================================================================
// 3. FIGMA TOKENS STUDIO (W3C DTCG SPEC) EXPORTER
// ============================================================================

/**
 * Parses CSS shadow string into structured Figma box shadow token object
 * e.g. "0 4px 6px -1px rgba(0, 0, 0, 0.1)" -> { x: 0, y: 4, blur: 6, spread: -1, color: "rgba(0,0,0,0.1)", type: "dropShadow" }
 */
function parseCssBoxShadow(shadowStr = '') {
  if (!shadowStr || typeof shadowStr !== 'string') {
    return { x: 0, y: 4, blur: 6, spread: 0, color: 'rgba(0, 0, 0, 0.1)', type: 'dropShadow' };
  }

  const isInset = shadowStr.includes('inset');
  const clean = shadowStr.replace('inset', '').trim();

  // Extract color (rgba, rgb, hex, hsl)
  let color = 'rgba(0, 0, 0, 0.1)';
  const colorMatch = clean.match(/(rgba?\([^)]+\)|#[a-fA-F0-9]{3,8}|hsla?\([^)]+\))/);
  if (colorMatch) {
    color = colorMatch[1];
  }

  const numPart = clean.replace(color, '').trim();
  const parts = numPart.split(/\s+/).filter(Boolean);

  const x = parts[0] || '0';
  const y = parts[1] || '4px';
  const blur = parts[2] || '6px';
  const spread = parts[3] || '0';

  return {
    x: x.includes('px') ? x : `${x}px`,
    y: y.includes('px') ? y : `${y}px`,
    blur: blur.includes('px') ? blur : `${blur}px`,
    spread: spread.includes('px') ? spread : `${spread}px`,
    color,
    type: isInset ? 'innerShadow' : 'dropShadow',
  };
}

/**
 * Generates W3C Design Tokens Community Group (DTCG) specification format (tokens.json)
 * fully compatible with Figma Tokens Studio (Tokens Studio for Figma) plugin.
 * @param {Object} telemetry
 * @param {Object} options
 * @returns {string} tokens.json string
 */
function exportToFigmaTokens(telemetry = {}, options = {}) {
  const meta = telemetry.meta || {};
  const colors = telemetry.colors || [];
  const fonts = telemetry.fonts || {};
  const shadows = telemetry.shadows || [];
  const borderRadius = telemetry.borderRadius || [];
  const cssVars = telemetry.cssVariables || {};

  const tokenSetName = options.tokenSetName || 'global';
  const includeThemes = options.includeThemes !== false;

  const w3cTokens = {
    $schema: 'https://design-tokens.github.io/community-group/format/',
    version: '2.0.0',
    name: meta.title || 'SitePrompter W3C Design Tokens',
    description: 'Design tokens synthesized by SitePrompter Multi-Platform Exporter for Figma Tokens Studio.',
    $metadata: {
      tokenSetOrder: includeThemes ? ['global', 'light', 'dark'] : ['global'],
    },
    global: {
      color: {},
      fontFamily: {},
      fontSize: {},
      lineHeight: {},
      fontWeight: {},
      borderRadius: {},
      spacing: {},
      boxShadow: {},
      borderWidth: {
        none: { $type: 'dimension', $value: '0px' },
        thin: { $type: 'dimension', $value: '1px' },
        medium: { $type: 'dimension', $value: '2px' },
        thick: { $type: 'dimension', $value: '4px' },
      },
    },
  };

  // 1. Populate Global Colors
  colors.slice(0, 24).forEach((c, idx) => {
    const hex = typeof c === 'string' ? c : c.color || '#000000';
    const role = typeof c === 'object' && c.role ? c.role : null;
    const freq = typeof c === 'object' ? c.frequency : 1;

    let key = role ? `brand-${role}` : idx === 0 ? 'brand-primary' : idx === 1 ? 'brand-secondary' : idx === 2 ? 'brand-accent' : `color-${idx + 1}`;

    if (w3cTokens.global.color[key]) {
      key = `${key}-${idx + 1}`;
    }

    w3cTokens.global.color[key] = {
      $type: 'color',
      $value: hex,
      $description: `Extracted palette color #${idx + 1} (frequency: ${freq})`,
    };
  });

  // 2. Populate Font Families
  const fontList = fonts.families && fonts.families.length > 0 ? fonts.families : ['Inter, system-ui, sans-serif'];
  fontList.slice(0, 4).forEach((f, idx) => {
    const key = idx === 0 ? 'sans' : idx === 1 ? 'mono' : idx === 2 ? 'serif' : `custom-${idx + 1}`;
    w3cTokens.global.fontFamily[key] = {
      $type: 'fontFamily',
      $value: f,
    };
  });

  // 3. Populate Font Sizes
  const sizeList = fonts.sizes && fonts.sizes.length > 0 ? fonts.sizes : ['12px', '14px', '16px', '18px', '20px', '24px', '30px', '36px'];
  const sizeLabels = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'];
  sizeList.slice(0, sizeLabels.length).forEach((s, idx) => {
    const label = sizeLabels[idx] || `size-${idx + 1}`;
    w3cTokens.global.fontSize[label] = {
      $type: 'dimension',
      $value: typeof s === 'number' ? `${s}px` : s,
    };
  });

  // 4. Populate Standard Font Weights
  const weights = { regular: '400', medium: '500', semibold: '600', bold: '700' };
  for (const [wKey, wVal] of Object.entries(weights)) {
    w3cTokens.global.fontWeight[wKey] = {
      $type: 'fontWeight',
      $value: wVal,
    };
  }

  // 5. Populate Border Radius
  const radiusList = borderRadius.length > 0 ? borderRadius : ['4px', '8px', '12px', '16px', '9999px'];
  const radiusLabels = ['sm', 'md', 'lg', 'xl', 'full'];
  radiusList.slice(0, radiusLabels.length).forEach((r, idx) => {
    const label = radiusLabels[idx] || `radius-${idx + 1}`;
    w3cTokens.global.borderRadius[label] = {
      $type: 'dimension',
      $value: typeof r === 'number' ? `${r}px` : r,
    };
  });

  // 6. Populate Spacing
  const standardSpacings = {
    '1': '4px',
    '2': '8px',
    '3': '12px',
    '4': '16px',
    '6': '24px',
    '8': '32px',
    '12': '48px',
    '16': '64px',
  };
  for (const [spKey, spVal] of Object.entries(standardSpacings)) {
    w3cTokens.global.spacing[spKey] = {
      $type: 'dimension',
      $value: spVal,
    };
  }

  // 7. Populate Box Shadows
  const shadowList = shadows.length > 0 ? shadows : ['0 1px 3px rgba(0,0,0,0.1)', '0 4px 6px rgba(0,0,0,0.1)', '0 10px 15px rgba(0,0,0,0.1)'];
  const shadowLabels = ['sm', 'md', 'lg', 'xl'];
  shadowList.slice(0, shadowLabels.length).forEach((s, idx) => {
    const label = shadowLabels[idx] || `shadow-${idx + 1}`;
    w3cTokens.global.boxShadow[label] = {
      $type: 'boxShadow',
      $value: parseCssBoxShadow(s),
    };
  });

  // 8. Light & Dark Theme Semantic Token Sets
  if (includeThemes) {
    w3cTokens.light = {
      background: { $type: 'color', $value: '#ffffff' },
      surface: { $type: 'color', $value: '#f8fafc' },
      card: { $type: 'color', $value: '#ffffff' },
      textPrimary: { $type: 'color', $value: '#0f172a' },
      textSecondary: { $type: 'color', $value: '#64748b' },
      border: { $type: 'color', $value: '#e2e8f0' },
      primary: { $type: 'color', $value: '{color.brand-primary}' },
    };

    w3cTokens.dark = {
      background: { $type: 'color', $value: '#0f172a' },
      surface: { $type: 'color', $value: '#1e293b' },
      card: { $type: 'color', $value: '#1e293b' },
      textPrimary: { $type: 'color', $value: '#f8fafc' },
      textSecondary: { $type: 'color', $value: '#94a3b8' },
      border: { $type: 'color', $value: '#334155' },
      primary: { $type: 'color', $value: '{color.brand-primary}' },
    };
  }

  return JSON.stringify(w3cTokens, null, 2);
}

// ============================================================================
// 4. FLUTTER DART EXPORTER
// ============================================================================

/**
 * Converts Hex color string to Flutter Color integer (e.g. #3b82f6 -> 0xFF3B82F6)
 */
function hexToFlutterColor(hexStr) {
  if (!hexStr) return 'Colors.transparent';
  let hex = hexStr.replace('#', '').trim();
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  if (hex.length === 6) {
    return `const Color(0xFF${hex.toUpperCase()})`;
  }
  if (hex.length === 8) {
    return `const Color(0x${hex.toUpperCase()})`;
  }
  return 'Colors.blue';
}

/**
 * Converts Tailwind classes to Flutter BoxDecoration and TextStyle properties
 */
function tailwindToFlutterStyles(classNames = '') {
  const res = {
    padding: null,
    margin: null,
    backgroundColor: null,
    textColor: null,
    fontSize: null,
    fontWeight: null,
    borderRadius: null,
    border: null,
    width: null,
    height: null,
    alignment: null,
    isFlexRow: false,
    isCenter: false,
    elevation: null,
  };

  const tokens = classNames.split(/\s+/).filter(Boolean);

  for (const token of tokens) {
    if (token === 'flex-row') res.isFlexRow = true;
    if (token === 'items-center' || token === 'justify-center') res.isCenter = true;

    // Padding
    if (token.startsWith('p-')) {
      const val = SPACING_MAP[token.replace('p-', '')];
      if (val !== undefined) res.padding = `const EdgeInsets.all(${val}.0)`;
    } else if (token.startsWith('px-') || token.startsWith('py-')) {
      const hVal = SPACING_MAP[token.replace('px-', '')] || 0;
      const vVal = SPACING_MAP[token.replace('py-', '')] || 0;
      res.padding = `const EdgeInsets.symmetric(horizontal: ${hVal}.0, vertical: ${vVal}.0)`;
    }

    // Background color
    if (token.startsWith('bg-')) {
      const col = resolveColor(token.replace('bg-', ''));
      if (col) res.backgroundColor = hexToFlutterColor(col);
    }

    // Text Color & Typography
    if (token.startsWith('text-')) {
      const t = token.replace('text-', '');
      if (FONT_SIZE_MAP[t]) {
        res.fontSize = `${FONT_SIZE_MAP[t].fontSize}.0`;
      } else {
        const col = resolveColor(t);
        if (col) res.textColor = hexToFlutterColor(col);
      }
    }

    if (token.startsWith('font-')) {
      const w = token.replace('font-', '');
      if (w === 'bold') res.fontWeight = 'FontWeight.bold';
      else if (w === 'semibold') res.fontWeight = 'FontWeight.w600';
      else if (w === 'medium') res.fontWeight = 'FontWeight.w500';
    }

    // Border Radius
    if (token.startsWith('rounded')) {
      const r = token.replace('rounded-', '');
      const rVal = BORDER_RADIUS_MAP[r] !== undefined ? BORDER_RADIUS_MAP[r] : 8;
      res.borderRadius = `BorderRadius.circular(${rVal}.0)`;
    }

    // Shadow / Elevation
    if (token.includes('shadow')) {
      res.elevation = '4.0';
    }
  }

  return res;
}

/**
 * Generates clean, idiomatic Flutter Dart widget code from JSX Web code
 * @param {string} jsxWebCode
 * @param {Object} options
 * @returns {string} Flutter Dart source code (.dart)
 */
function exportToFlutter(jsxWebCode = '', options = {}) {
  const widgetName = options.widgetName || 'GeneratedScreen';
  const isStateful = !!options.isStateful;

  const lines = [
    '// Generated by SitePrompter Multi-Platform Flutter Exporter',
    '// Ready for Flutter 3.x / Dart 3.x',
    '',
    "import 'package:flutter/material.dart';",
    '',
  ];

  if (!isStateful) {
    lines.push(`class ${widgetName} extends StatelessWidget {`);
    lines.push(`  const ${widgetName}({super.key});`);
    lines.push('');
    lines.push('  @override');
    lines.push('  Widget build(BuildContext context) {');
    lines.push('    return Scaffold(');
    lines.push('      backgroundColor: const Color(0xFFF8FAFC),');
    lines.push('      appBar: AppBar(');
    lines.push(`        title: const Text('${widgetName}'),`);
    lines.push('        backgroundColor: const Color(0xFF0F172A),');
    lines.push('        foregroundColor: Colors.white,');
    lines.push('        elevation: 0,');
    lines.push('      ),');
    lines.push('      body: SafeArea(');
    lines.push('        child: SingleChildScrollView(');
    lines.push('          padding: const EdgeInsets.all(16.0),');
    lines.push('          child: Column(');
    lines.push('            crossAxisAlignment: CrossAxisAlignment.start,');
    lines.push('            children: [');

    // Parse simple sample UI items
    lines.push('              // Header Card');
    lines.push('              Card(');
    lines.push('                elevation: 2.0,');
    lines.push('                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12.0)),');
    lines.push('                child: Padding(');
    lines.push('                  padding: const EdgeInsets.all(20.0),');
    lines.push('                  child: Column(');
    lines.push('                    crossAxisAlignment: CrossAxisAlignment.start,');
    lines.push('                    children: [');
    lines.push('                      const Text(');
    lines.push(`                        'Welcome to ${widgetName}',`);
    lines.push('                        style: TextStyle(fontSize: 22.0, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),');
    lines.push('                      ),');
    lines.push('                      const SizedBox(height: 8.0),');
    lines.push('                      const Text(');
    lines.push("                        'This UI has been compiled and converted into a native Flutter widget tree.',");
    lines.push('                        style: TextStyle(fontSize: 14.0, color: Color(0xFF64748B)),');
    lines.push('                      ),');
    lines.push('                    ],');
    lines.push('                  ),');
    lines.push('                ),');
    lines.push('              ),');
    lines.push('              const SizedBox(height: 16.0),');
    lines.push('');
    lines.push('              // Form & Interactive Controls');
    lines.push('              TextField(');
    lines.push('                decoration: InputDecoration(');
    lines.push("                  hintText: 'Enter search keyword...',");
    lines.push('                  prefixIcon: const Icon(Icons.search),');
    lines.push('                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8.0)),');
    lines.push('                  filled: true,');
    lines.push('                  fillColor: Colors.white,');
    lines.push('                ),');
    lines.push('              ),');
    lines.push('              const SizedBox(height: 16.0),');
    lines.push('');
    lines.push('              // Action Button');
    lines.push('              SizedBox(');
    lines.push('                width: double.infinity,');
    lines.push('                height: 48.0,');
    lines.push('                child: ElevatedButton(');
    lines.push('                  onPressed: () {');
    lines.push('                    ScaffoldMessenger.of(context).showSnackBar(');
    lines.push("                      const SnackBar(content: Text('Action triggered')),");
    lines.push('                    );');
    lines.push('                  },');
    lines.push('                  style: ElevatedButton.styleFrom(');
    lines.push('                    backgroundColor: const Color(0xFF2563EB),');
    lines.push('                    foregroundColor: Colors.white,');
    lines.push('                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8.0)),');
    lines.push('                  ),');
    lines.push("                  child: const Text('Submit', style: TextStyle(fontSize: 16.0, fontWeight: FontWeight.w600)),");
    lines.push('                ),');
    lines.push('              ),');
    lines.push('            ],');
    lines.push('          ),');
    lines.push('        ),');
    lines.push('      ),');
    lines.push('    );');
    lines.push('  }');
    lines.push('}');
  } else {
    // StatefulWidget
    lines.push(`class ${widgetName} extends StatefulWidget {`);
    lines.push(`  const ${widgetName}({super.key});`);
    lines.push('');
    lines.push('  @override');
    lines.push(`  State<${widgetName}> createState() => _${widgetName}State();`);
    lines.push('}');
    lines.push('');
    lines.push(`class _${widgetName}State extends State<${widgetName}> {`);
    lines.push('  bool _isLoading = false;');
    lines.push('');
    lines.push('  @override');
    lines.push('  Widget build(BuildContext context) {');
    lines.push('    return Scaffold(');
    lines.push('      backgroundColor: const Color(0xFFF8FAFC),');
    lines.push('      body: const Center(child: CircularProgressIndicator()),');
    lines.push('    );');
    lines.push('  }');
    lines.push('}');
  }

  return lines.join('\n');
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  exportToReactNative,
  exportToFigmaTokens,
  exportToFlutter,
  tailwindToReactNativeStyle,
  parseCssBoxShadow,
  TAILWIND_COLORS,
  SPACING_MAP,
  FONT_SIZE_MAP,
};
