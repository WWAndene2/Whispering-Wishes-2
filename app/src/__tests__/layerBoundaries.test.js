import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// CLAUDE.md §4.4 dependency-direction check, run as part of the normal suite (§4.9: the ESLint
// config's import rules are inert until ESLint is installed, so this is the mechanical guard).
// utils/, core/, data/, engine/ must never import a higher layer; shared/, hooks/, providers/
// must never import features/; one feature never imports another feature's files.
// hooks/ → shared/constants is an established pattern and is not asserted here.
const SRC = join(__dirname, '..');
const HIGHER = ['features', 'shared', 'hooks', 'providers'];
const RULES = {
  utils: ['core', 'data', 'engine', ...HIGHER],
  core: HIGHER,
  data: HIGHER,
  engine: HIGHER,
  shared: ['features'],
  hooks: ['features'],
  providers: ['features'],
};
// Known, not-yet-fixed edge: the shared character modal reuses the Teams tab's calcTeamStats
// (1000+ lines depending on feature-local modules) for its solo rotation guide. Locked here so
// the list can only shrink.
const KNOWN_VIOLATIONS = new Set([
  'shared/modals/CharacterDetailModal.jsx → ../../features/teams/calcTeamStats.js',
]);

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
          const entry = `${relative(SRC, file)} → ${spec}`;
          if (forbidden.includes(target) && !KNOWN_VIOLATIONS.has(entry)) violations.push(entry);
        }
      }
      expect(violations).toEqual([]);
    });
  }

  it('features/<x>/ never imports another feature', () => {
    const violations = [];
    for (const file of walk(join(SRC, 'features'))) {
      const own = relative(SRC, file).split(/[\\/]/)[1];
      for (const m of readFileSync(file, 'utf8').matchAll(IMPORT_RE)) {
        const spec = m[1] || m[2];
        if (!spec.startsWith('.')) continue;
        const parts = relative(SRC, join(file, '..', spec)).split(/[\\/]/);
        if (parts[0] === 'features' && parts[1] !== own) violations.push(`${relative(SRC, file)} → ${spec}`);
      }
    }
    expect(violations).toEqual([]);
  });
});
