import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist/**', 'server/dist/**', 'server-nest/dist/**', 'node_modules/**'] },
  { files: ['src/**/*.{ts,tsx}', 'server-nest/src/**/*.ts', 'server/src/shared/{observability,openapi}/**/*.ts'], ...js.configs.recommended },
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['src/**/*.{ts,tsx}', 'server-nest/src/**/*.ts', 'server/src/shared/{observability,openapi}/**/*.ts'],
  })),
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-undef': 'off',
    },
  },
  prettier,
)
