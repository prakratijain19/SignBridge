import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test?schema=public',
      // Keep tests deterministic and offline — never hit a live translation API.
      TRANSLATION_PROVIDER: 'identity',
    },
  },
});
