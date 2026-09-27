// ═══════════════════════════════════════════════════════════════════════════════
// WHISPERING WISHES — features/map/MapSharePopover.jsx
// Header-anchored "Share map" panel. Share: builds a WWMAP1 text code from
// the player's pins (and optionally their found icons) and hands it to the
// system share sheet, or copies it. Import: a pasted code is decoded as
// untrusted data (mapShareCode.js), previewed, then added to or replaces the
// player's map. Pure UI: MapTab owns the pins / found state it applies to.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import { Share2, Download, X } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../shared/components/Card.jsx';
import { encodeMapShare, decodeMapShare } from './mapShareCode.js';
import { t } from '../../utils/i18n.js';

/**
 * Sends a code through the system share sheet when there is one, else the
 * clipboard. Resolves to 'shared' | 'copied' | 'cancelled' | 'failed'.
 */
export async function shareCodeText(text, title) {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try { await navigator.share({ title, text }); return 'shared'; } catch (e) {
      if (e && e.name === 'AbortError') return 'cancelled';
    }
  }
  try { await navigator.clipboard.writeText(text); return 'copied'; } catch { return 'failed'; }
}

export function MapSharePopover({ panelRef, top, maxHeight, pins, foundIds, knownIconIds, onImport, onClose }) {
  const [withFound, setWithFound] = useState(false);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('');
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState(null); // { pins, foundIds, dropped, unknown } | { error }

  // Decode as the player types / pastes (a code is small; no debounce needed
  // beyond ignoring stale results).
  useEffect(() => {
    let stale = false;
    if (!input.trim()) { setPreview(null); return undefined; }
    decodeMapShare(input).then(
      (r) => { if (!stale) setPreview({ ...r, unknown: r.foundIds.filter(id => !knownIconIds.has(id)).length }); },
      (e) => { if (!stale) setPreview({ error: e.message }); },
    );
    return () => { stale = true; };
  }, [input, knownIconIds]);

  const share = async () => {
    const text = await encodeMapShare({ pins, foundIds: withFound ? [...foundIds] : [] });
    setCode(text);
    const r = await shareCodeText(text, t('map.share.title'));
    setStatus(r === 'failed' ? t('map.share.copyManually') : r === 'cancelled' ? '' : t(`map.share.${r}`));
  };

  const apply = (mode) => {
    if (!preview || preview.error) return;
    onImport({ pins: preview.pins, foundIds: preview.foundIds.filter(id => knownIconIds.has(id)), mode });
    setInput('');
    setPreview(null);
  };

  const empty = pins.length === 0 && !(withFound && foundIds.size);

  return (
    <div
      ref={panelRef}
      className="map-downloads-popover map-share-popover"
      role="dialog"
      aria-label={t('map.share.title')}
      onClick={(e) => e.stopPropagation()}
      style={{ top: `${top}px`, maxHeight }}
    >
      <Card>
        <CardHeader
          action={
            <button type="button" className="kuro-btn kuro-btn-sm kuro-btn-icon" onClick={onClose} aria-label={t('map.search.close')}>
              <X size={14} />
            </button>
          }
        >
          {t('map.share.title')}
        </CardHeader>
        <CardBody className="map-downloads-body">
          <div className="map-share-section">
            <div className="map-share-label">{t('map.share.sendLabel')}</div>
            <label className="map-share-check">
              <input type="checkbox" checked={withFound} onChange={(e) => setWithFound(e.target.checked)} />
              {t('map.share.includeFound', { count: foundIds.size })}
            </label>
            <button type="button" className="kuro-btn kuro-btn-sm map-downloads-all" onClick={share} disabled={empty}>
              <Share2 size={14} /> {t('map.share.shareButton', { count: pins.length })}
            </button>
            {status && <div className="hint" role="status">{status}</div>}
            {code && (
              <textarea className="map-share-code" readOnly value={code} rows={2} aria-label={t('map.share.codeLabel')} onFocus={(e) => e.target.select()} />
            )}
          </div>
          <div className="map-share-section">
            <div className="map-share-label">{t('map.share.receiveLabel')}</div>
            <textarea
              className="map-share-code"
              rows={2}
              value={input}
              placeholder={t('map.share.pastePlaceholder')}
              aria-label={t('map.share.pasteLabel')}
              onChange={(e) => setInput(e.target.value)}
            />
            {preview && (preview.error ? (
              <div className="hint map-share-error" role="alert">{t(`map.share.error.${preview.error}`)}</div>
            ) : (
              <>
                <div className="hint" role="status">
                  {t('map.share.preview', { pins: preview.pins.length, found: preview.foundIds.length - preview.unknown })}
                  {preview.unknown > 0 && ` · ${t('map.share.unknownIgnored', { count: preview.unknown })}`}
                  {preview.dropped > 0 && ` · ${t('map.share.invalidIgnored', { count: preview.dropped })}`}
                </div>
                <div className="map-share-actions">
                  <button type="button" className="kuro-btn kuro-btn-sm is-active" onClick={() => apply('add')}>
                    <Download size={14} /> {t('map.share.add')}
                  </button>
                  <button type="button" className="kuro-btn kuro-btn-sm" onClick={() => apply('replace')}>{t('map.share.replace')}</button>
                </div>
              </>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
