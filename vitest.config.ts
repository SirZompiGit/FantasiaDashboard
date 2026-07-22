import { defineConfig } from 'vitest/config';

/**
 * Configurazione separata da quella di Vite, e senza i plugin di React e
 * Tailwind: i test coprono logica pura — reducer, normalizzazione, geometria —
 * più alcuni controlli sui sorgenti. Non serve compilare CSS né JSX, e la suite
 * resta veloce.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
