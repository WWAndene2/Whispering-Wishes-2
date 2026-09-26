import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// CLAUDE.md §4.4 dependency-direction check, run as part of the normal suite (§4.9: the ESLint
// config's import rules are inert until ESLint is installed, so this is the mechanical guard).
// Covers the bottom layers only: utils/, core/, data/, engine/ must never import from a higher
// layer. shared/ → features/ still has known violations (shared/modals/CharacterDetailModal.jsx
// reaches into features/teams/) and hooks/ → shared/constants is an established pattern, so
// those edges are not asserted here.
const SRC = join(__dirname, '..');
const HIGHER = ['features', 'shared', 'hooks', 'providers'];
const RULES = {
  utils: ['core', 'data', 'engine', ...HIGHER],
  core: HIGHER,
  data: HIGHER,
  engine: HIGHER,
};

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const p = join(dir, name);
  if (statSync(p).isDirectory()) return walk(p);
  return /\.(js|jsx)$/.test(name) ? [p] : [];
});

const IMPORT_RE = /(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;

describe('layer boundaries (CLAUDE.md §4.4)', () => {
  for (const [layer, forbidden] of Object.entries(RULES)) {
    it(`${layer}/ never imports from ${forbidden.join('/, ')}/`, () => {
      const violations = [];
      for (const file of walk(join(SRC, layer))) {
        const text = readFileSync(file, 'utf8');
        for (const m of text.matchAll(IMPORT_RE)) {
          const spec = m[1] || m[2];
          if (!spec.startsWith('.')) continue;
          const target = relative(SRC, join(file, '..', spec)).split(/[\\/]/)[0];
          if (forbidden.includes(target)) violations.push(`${relative(SRC, file)} → ${spec}`);
        }
      }
      expect(violations).toEqual([]);
    });
  }
});
