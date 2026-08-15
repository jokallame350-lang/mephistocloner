/**
 * Next.js 15 App Router Project Packager
 * Generates production-ready Next.js 15 + React 19 + Tailwind CSS + Shadcn UI project archives and file maps.
 */

const AdmZip = require('adm-zip');
const { exportTailwindConfig, exportCssTheme } = require('./design-tokens-exporter');

/**
 * Generates the complete file map for a Next.js 15 App Router project.
 * Returns an object: { [filePath]: string | Buffer }
 *
 * @param {string} code - Generated page or component code (optional)
 * @param {object} telemetry - Extracted site telemetry data
 * @param {object} options - Configuration options { title, description }
 * @returns {object} Flat mapping of relative file paths to their contents
 */
function generateNextjsProjectFileMap(code = '', telemetry = {}, options = {}) {
  const metaTitle = telemetry.meta?.title || options.title || 'SitePrompter Clone';
  const metaDescription = telemetry.meta?.description || options.description || 'Generated Next.js 15 App Router application with Tailwind CSS and Shadcn UI.';
  const safeName = (metaTitle || 'site-clone')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'siteprompter-app';

  const files = {};

  // 1. package.json (Next.js 15, React 19, Tailwind CSS, Lucide React, Shadcn Primitives)
  const packageJson = {
    name: safeName,
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint',
    },
    dependencies: {
      next: '^15.1.7',
      react: '^19.0.0',
      'react-dom': '^19.0.0',
      'lucide-react': '^0.475.0',
      clsx: '^2.1.1',
      'tailwind-merge': '^2.6.0',
      'class-variance-authority': '^0.7.1',
    },
    devDependencies: {
      '@types/node': '^22.13.4',
      '@types/react': '^19.0.8',
      '@types/react-dom': '^19.0.8',
      autoprefixer: '^10.4.20',
      postcss: '^8.5.2',
      tailwindcss: '^3.4.17',
      typescript: '^5.7.3',
      eslint: '^9.20.0',
      'eslint-config-next': '^15.1.7',
    },
  };
  files['package.json'] = JSON.stringify(packageJson, null, 2);

  // 2. tsconfig.json (Configured with Next.js App Router paths and bundler resolution)
  const tsConfig = {
    compilerOptions: {
      target: 'ES2022',
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      plugins: [
        {
          name: 'next',
        },
      ],
      paths: {
        '@/*': ['./*'],
      },
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules'],
  };
  files['tsconfig.json'] = JSON.stringify(tsConfig, null, 2);

  // 3. next.config.mjs (Next.js 15 Configuration with remote image patterns)
  files['next.config.mjs'] = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
};

export default nextConfig;
`;

  // 4. tailwind.config.js & postcss.config.js
  const colors = telemetry.colors || [];
  const fonts = telemetry.fonts || {};
  const primaryFont = fonts.families && fonts.families.length > 0
    ? fonts.families[0].split(',')[0].replace(/['"]/g, '').trim()
    : 'Inter';

  const colorMap = {};
  colors.slice(0, 12).forEach((c, idx) => {
    const hex = typeof c === 'string' ? c : (c.color || '#3b82f6');
    const name = idx === 0 ? 'brand-primary' : idx === 1 ? 'brand-secondary' : idx === 2 ? 'brand-accent' : `brand-${idx + 1}`;
    colorMap[name] = hex;
  });

  const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: ${JSON.stringify(colorMap, null, 8).replace(/\n\s*}/, '\n      }')},
      fontFamily: {
        sans: ['${primaryFont}', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
`;
  files['tailwind.config.js'] = tailwindConfig;

  files['postcss.config.js'] = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;

  // 5. lib/utils.ts (cn utility helper for Tailwind + clsx)
  files['lib/utils.ts'] = `import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;

  // 6. components/ui/button.tsx (Shadcn-style button)
  files['components/ui/button.tsx'] = `import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
        destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
        outline: 'border border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800',
        secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700',
        ghost: 'hover:bg-slate-800 text-slate-200 hover:text-white',
        link: 'text-blue-500 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-lg px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
`;

  // 7. components/ui/card.tsx (Shadcn-style card)
  files['components/ui/card.tsx'] = `import * as React from 'react';
import { cn } from '@/lib/utils';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-xl border border-slate-800 bg-slate-900/80 text-slate-100 shadow-sm backdrop-blur', className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-2xl font-semibold leading-none tracking-tight', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-slate-400', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';
`;

  // 8. components/ui/badge.tsx (Shadcn-style badge)
  files['components/ui/badge.tsx'] = `import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-blue-600/20 text-blue-400 hover:bg-blue-600/30',
        secondary: 'border-transparent bg-slate-800 text-slate-300 hover:bg-slate-700',
        destructive: 'border-transparent bg-red-900/30 text-red-400 hover:bg-red-900/50',
        outline: 'text-slate-300 border-slate-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
`;

  // 9. app/globals.css
  const dynamicCssTheme = exportCssTheme(telemetry);
  files['app/globals.css'] = `@tailwind base;
@tailwind components;
@tailwind utilities;

${dynamicCssTheme}

:root {
  color-scheme: dark;
}

body {
  background-color: #090a0f;
  color: #f8fafc;
  font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
}
`;

  // 10. app/layout.tsx (Next.js 15 Root Layout)
  files['app/layout.tsx'] = `import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  themeColor: '#090a0f',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: ${JSON.stringify(metaTitle)},
  description: ${JSON.stringify(metaDescription)},
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={\`\${inter.className} min-h-screen bg-[#090a0f] text-slate-100 antialiased\`}>
        {children}
      </body>
    </html>
  );
}
`;

  // 11. app/page.tsx (Generated or fallback Next.js 15 App Router landing page)
  let pageContent = code;

  if (!pageContent || pageContent.trim() === '') {
    pageContent = `"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles, Zap, Shield, CheckCircle2, Globe, Github } from 'lucide-react';

export default function Page() {
  const [activeTab, setActiveTab] = useState('features');

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30">
              ⚡
            </div>
            <span className="text-lg font-bold tracking-tight">${metaTitle}</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">Docs</Button>
            <Button size="sm" className="gap-2">
              <Sparkles className="w-4 h-4" /> Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center text-center">
        <Badge variant="default" className="mb-6 px-3 py-1 gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Next.js 15 & React 19 Ready
        </Badge>
        
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
          ${metaTitle}
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl">
          ${metaDescription}
        </p>

        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Button size="lg" className="gap-2 shadow-lg shadow-blue-600/25">
            Explore Preview <ArrowRight className="w-4 h-4" />
          </Button>
          <Button size="lg" variant="outline" className="gap-2">
            <Github className="w-4 h-4" /> View Source
          </Button>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <Card>
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
                <Zap className="w-5 h-5" />
              </div>
              <CardTitle>Instant Architecture</CardTitle>
              <CardDescription>Built on Next.js 15 App Router with full React Server Component optimization.</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <CardTitle>Extracted Design Tokens</CardTitle>
              <CardDescription>Tailwind classes, color swatches, and typography faithfully preserved from the source.</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
                <Shield className="w-5 h-5" />
              </div>
              <CardTitle>Production Ready</CardTitle>
              <CardDescription>Deploy anywhere with 1-click support for Vercel, Netlify, and Docker.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-center text-sm text-slate-500">
        <p>© {new Date().getFullYear()} ${metaTitle}. Generated with SitePrompter Web.</p>
      </footer>
    </div>
  );
}
`;
  }

  // Ensure "use client"; is at the top if state or event handlers are present in custom code
  if ((pageContent.includes('useState') || pageContent.includes('useEffect') || pageContent.includes('onClick')) && !pageContent.includes('"use client"') && !pageContent.includes("'use client'")) {
    pageContent = `"use client";\n\n${pageContent}`;
  }

  files['app/page.tsx'] = pageContent;

  // 12. public/robots.txt
  files['public/robots.txt'] = `User-agent: *\nAllow: /\n`;

  // 13. public/placeholder.svg
  files['public/placeholder.svg'] = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="none">
  <rect width="400" height="300" fill="#1e293b"/>
  <path d="M160 130L200 170L240 130" stroke="#64748b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="200" cy="110" r="16" fill="#64748b"/>
  <text x="200" y="220" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="14 font-weight="500">Image Placeholder</text>
</svg>`;

  // 14. .gitignore
  files['.gitignore'] = `# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# typescript
*.tsbuildinfo
next-env.d.ts
`;

  // 15. README.md
  files['README.md'] = `# ${metaTitle}

Generated by **SitePrompter Web — Pro SaaS Edition**.

## 🚀 Quick Start

1. **Install Dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Run Development Server:**
   \`\`\`bash
   npm run dev
   \`\`\`
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Build for Production:**
   \`\`\`bash
   npm run build
   npm run start
   \`\`\`

## 🛠️ Tech Stack
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **UI Library**: React 19
- **Components**: Shadcn UI / Radix primitives
- **Styling**: Tailwind CSS
- **Icons**: [Lucide React](https://lucide.dev/)

## 🌐 1-Click Deployment

### Deploy to Vercel
\`\`\`bash
npx vercel
\`\`\`

### Push to GitHub
\`\`\`bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
\`\`\`
`;

  return files;
}

/**
 * Creates a downloadable Next.js 15 App Router project as a ZIP Buffer
 *
 * @param {string} code - Generated page code
 * @param {object} telemetry - Extracted site telemetry
 * @param {object} options - Options { title, description }
 * @returns {Buffer} ZIP Archive Buffer
 */
function createNextjsProjectZip(code = '', telemetry = {}, options = {}) {
  const zip = new AdmZip();
  const fileMap = generateNextjsProjectFileMap(code, telemetry, options);

  for (const [filePath, content] of Object.entries(fileMap)) {
    const isBuffer = Buffer.isBuffer(content);
    const buffer = isBuffer ? content : Buffer.from(String(content), 'utf8');
    zip.addFile(filePath, buffer);
  }

  return zip.toBuffer();
}

module.exports = {
  generateNextjsProjectFileMap,
  createNextjsProjectZip,
};
