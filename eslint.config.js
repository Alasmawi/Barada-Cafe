import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', '.wrangler', 'brand'] },
  ...tseslint.configs.recommended,
);
