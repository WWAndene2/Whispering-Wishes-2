import { describe, it, expect } from 'vitest';
import { encodeMapShare, decodeMapShare, sanitizeNote, containsLink, SHARE_PREFIX } from '../features/map/mapShareCode.js';

const pin = (o = {}) => ({ marker: 'star', x: 3000, y: 8000, floor: null, note: 'Chest', ...o });

async function codeOf(payload) {
  const bytes = new TextEncoder().encode(typeof payload === 'string' ? payload : JSON.stringify(payload));
  const stream = new Response(bytes).body.pipeThrough(new CompressionStream('deflate-raw'));
  const out = new Uint8Array(await new Response(stream).arrayBuffer());
  let bin = ''; for (const b of out) bin += String.fromCharCode(b);
  return SHARE_PREFIX + btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

describe('map share codes', () => {
  it('round-trips pins and found ids', async () => {
    const code = await encodeMapShare({ pins: [pin(), pin({ marker: 'diamond', floor: 2, note: 'Floor 2' })], foundIds: ['icon-a', 'icon-b'] });
    expect(code.startsWith(SHARE_PREFIX)).toBe(true);
    expect(code).toMatch(/^WWMAP1:[A-Za-z0-9_-]+$/);
    const r = await decodeMapShare(`  Here you go:\n${code}\n`);
    expect(r.pins).toEqual([pin(), pin({ marker: 'diamond', floor: 2, note: 'Floor 2' })]);
    expect(r.foundIds).toEqual(['icon-a', 'icon-b']);
    expect(r.dropped).toBe(0);
  });

  it('rejects text that is not a code, or is corrupt', async () => {
    await expect(decodeMapShare('https://example.com/?x=1')).rejects.toThrow('not-a-code');
    await expect(decodeMapShare(`${SHARE_PREFIX}not base64!`)).rejects.toThrow('corrupt');
    await expect(decodeMapShare(`${SHARE_PREFIX}AAAA`)).rejects.toThrow('corrupt');
    await expect(decodeMapShare(await codeOf('[1,2,3]'))).rejects.toThrow('corrupt');
  });

  it('refuses a decompression bomb', async () => {
    await expect(decodeMapShare(await codeOf(JSON.stringify({ p: [], pad: 'x'.repeat(2_000_000) })))).rejects.toThrow('too-large');
  });

  it('drops invalid entries and keeps only whitelisted fields', async () => {
    const r = await decodeMapShare(await codeOf({
      p: [
        ['star', 1, 2, 0, 'ok', 'extra'],
        ['<script>', 1, 2, 0, ''],
        ['star', 1e12, 2, 0, ''],
        ['star', 'x', 2, 0, ''],
        ['star', 1, 2, 99, ''],
        { marker: 'star' },
      ],
      f: ['icon-ok', '../etc', 42, 'icon-ok'],
      evil: { __proto__: { polluted: true } },
    }));
    expect(r.pins).toEqual([{ marker: 'star', x: 1, y: 2, floor: null, note: 'ok' }]);
    expect(r.foundIds).toEqual(['icon-ok']);
    expect(r.dropped).toBe(7);
    expect({}.polluted).toBeUndefined();
  });

  it('sanitizes notes to plain single-line text', () => {
    expect(sanitizeNote('a‮b\nc\u0000d')).toBe('a b c d');
    expect(sanitizeNote('<img src=x onerror=alert(1)>')).toBe('<img src=x onerror=alert(1)>'); // rendered as text, never HTML
    expect(sanitizeNote('x'.repeat(200))).toHaveLength(80);
    expect(sanitizeNote(null)).toBe('');
  });

  it('detects links in any common disguise', () => {
    for (const s of ['https://x.y', 'go to scam-site.com', 'discord.gg/abc', 'bit.ly/x', 't.me/scam', 'www . evil . com',
      'scam-site dot com', 'scam-site(.)com', 'ｗｗｗ．ｅｖｉｌ．ｃｏｍ', 'mail me a@b.fr', 'javascript:alert(1)']) {
      expect(containsLink(s), s).toBe(true);
    }
  });

  it('leaves ordinary notes and in-game names alone', () => {
    for (const s of ['Mt.Firmament chest', 'Lv.90 boss', 'Echo 3.5 rate', 'Jinzhou.. then left', 'e.g. go north',
      'Go north. It is behind', 'Wait. Me first', 'Boss. In cave', '3:30 respawn', 'Note: use grapple']) {
      expect(containsLink(s), s).toBe(false);
    }
  });

  it('refuses a whole code when any note holds a link, and never encodes one', async () => {
    await expect(decodeMapShare(await codeOf({ p: [['star', 1, 2, 0, 'ok'], ['star', 3, 4, 0, 'free astrite at evil.com']] }))).rejects.toThrow('link-blocked');
    const r = await decodeMapShare(await encodeMapShare({ pins: [pin({ note: 'see discord.gg/x' })] }));
    expect(r.pins[0].note).toBe('');
  });
});
