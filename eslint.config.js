import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';
import react from 'eslint-plugin-react';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: [
      'main.js',
      'sequelize-typescript-migration/**/*.js',
      'dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/*.js',
      'eslint.config.js',
      'integration/**',
      '**/build-aliases.ts',
      '**/*.config.ts',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  eslintPluginPrettier,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      parserOptions: {
        project: ['./tsconfig.json', './client/tsconfig.json', './server/tsconfig.json'],
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      react,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      'prettier/prettier': [
        'error',
        {
          bracketSpacing: true,
          singleQuote: true,
          tabWidth: 2,
          trailingComma: 'es5',
        },
      ],
      'no-lone-blocks': 'off',
      'no-throw-literal': 'off',
      'no-console': 'off',
      'no-case-declarations': 'off',
      'no-fallthrough': 'off',
      indent: 'off',
      'func-style': 'off',
      'react/jsx-index-props': 'off',
      'react/self-closing-comp': 'off',
      'react/jsx-indent-props': 'off',
      'react/jsx-no-bind': 'off',
      'react/display-name': 'off',
      'react/jsx-boolean-value': 'off',
      'react/react-in-jsx-scope': 'off',
      'brace-style': 'off',
      'comma-dangle': 'off',
      'no-sparse-arrays': 'off',
      'arrow-body-style': 'off',
      'no-unused-vars': 'off',
      'no-else-return': 'off',
      radix: 'off',
      'object-shorthand': 'off',
      'no-lonely-if': 'off',
      'prefer-arrow-callback': 'off',
      'prefer-template': 'off',
      'no-undef': 'off',
      'no-constant-binary-expression': 'off',
      camelcase: 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-wrapper-object-types': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-this-alias': 'off',
    },
  }
);
