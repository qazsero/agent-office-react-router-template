import js from '@eslint/js';
import tsEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';

export default [
  // Base configuration
  js.configs.recommended,

  // Global ignores (equivalent to .eslintignore)
  {
    ignores: [
      'build/**',
      'public/build/**',
      'node_modules/**',
      '.cache/**',
      '.react-router/**',
      'experimental-reference/**',
      'migrations/**',
      '.worktrees/**',
      '**/.server',
      '**/.client'
    ]
  },
  // Route modules (mixed server/client) may reference process; allow Node globals
  {
    files: ['app/routes/**/*.tsx'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['app/routes/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Base configuration for all files
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },

  // React configuration
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      'react-refresh': reactRefresh,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      'react/no-unescaped-entities': 'off',
      'react/prop-types': 'off',
      // React Refresh for fast reload
      'react-refresh/only-export-components': 'off',
      // Auto-sort imports
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      // Turn off conflicting import rules
      'import/order': 'off',
      'sort-imports': 'off',
    },
    settings: {
      react: {
        version: 'detect',
      },
      formComponents: ['Form'],
      linkComponents: [
        { name: 'Link', linkAttribute: 'to' },
        { name: 'NavLink', linkAttribute: 'to' },
      ],
    },
  },

  // TypeScript configuration
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': tsEslint,
      import: importPlugin,
      'unused-imports': unusedImports,
      'simple-import-sort': simpleImportSort,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: true,
      },
    },
    rules: {
      ...tsEslint.configs.recommended.rules,
      ...importPlugin.configs.recommended.rules,
      ...importPlugin.configs.typescript.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true }],
      'import/no-unused-modules': 'off',
      'no-unused-vars': 'off', // Turn off base rule as it can report incorrect errors
      // Auto-fixable unused imports rule
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' }
      ],
      // Auto-sort imports (repeated for TS files)
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      // Additional TypeScript-specific rules
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/prefer-string-starts-ends-with': 'error',
      // More auto-fixable rules
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/prefer-includes': 'error',
      '@typescript-eslint/prefer-for-of': 'error',
      'object-shorthand': 'error',
      'prefer-const': 'error',
      'prefer-template': 'error',
    },
    settings: {
      'import/internal-regex': '^~/',
      'import/resolver': {
        node: {
          extensions: ['.ts', '.tsx'],
        },
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
  },

  // Node.js files
  {
    files: [
      'eslint.config.js',
      'vite.config.ts',
      'tailwind.config.ts',
      'vitest.config.ts',
      'react-router.config.ts',
      'server.ts',
      'playwright.config.ts',
      'knexfile.js',
      'seeds/**/*.js',
      'drizzle.config.ts',
      'models/**/*.ts'
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
    },
  },

  // Enforce client/server import boundaries for components
  {
    files: ['app/components/**/*.{ts,tsx,js,jsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['**/*.server', '~/modules/**/*.server'],
        },
      ],
    },
  },
  // Enforce client-only boundaries for hooks
  {
    files: ['app/hooks/**/*.{ts,tsx,js,jsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['**/*.server', '~/modules/**/*.server'],
        },
      ],
    },
  },

  // Server-side files
  {
    files: [
      '**/*.server.ts',
      '**/*.server.tsx',
      'app/entry.server.tsx',
      // known server-only route modules
      'app/routes/**/*.ai-stream.ts',
      'app/routes/**/*.events.ts',
      'app/routes/api.*.ts'
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Forbid console in server code; use structured logger instead
      'no-console': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: ['^~/lib-client/.*'],
        },
      ],
    },
  },

  // Test files
  {
    files: ['**/*.test.ts', '**/*.spec.ts', '__tests__/**', 'e2e/**'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      'unused-imports/no-unused-vars': 'off',
    },
  },
];
