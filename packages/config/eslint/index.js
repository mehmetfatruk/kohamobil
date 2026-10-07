// Paylaşılan ESLint (flat config) tabanı.
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * @param {{ tsconfigRootDir: string, browser?: boolean, decoratorMetadata?: boolean }} options
 *   decoratorMetadata: NestJS gibi `emitDecoratorMetadata` kullanan projelerde `import type`
 *   zorlaması DI meta verisini bozar; bu durumda kural kapatılır.
 */
export function createConfig({ tsconfigRootDir, browser = false, decoratorMetadata = false }) {
  return tseslint.config(
    { ignores: ['dist/**', 'build/**', 'coverage/**', '.expo/**', '*.config.*'] },
    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
      languageOptions: {
        parserOptions: { projectService: true, tsconfigRootDir },
        globals: browser ? globals.browser : globals.node,
      },
      rules: {
        '@typescript-eslint/consistent-type-imports': decoratorMetadata ? 'off' : 'error',
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],
        'no-console': 'error',
      },
    },
    {
      files: ['**/*.test.ts', '**/*.test.tsx'],
      rules: { '@typescript-eslint/unbound-method': 'off' },
    },
    prettier,
  );
}
