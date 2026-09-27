// ═══════════════════════════════════════════════════════════════════════════════
// WHISPERING WISHES — features/map/MapSharePopover.jsx
// Header-anchored "Share map" panel. Share: builds a WWMAP1 text code from
// the player's own pins (and optionally their found icons) and hands it to
// the system share sheet, or copies it. Import: a pasted code is decoded as
// untrusted data (mapShareCode.js), previewed, then saved as a named preset
// (the player's own map is never overwritten) or its pins added to the
// player's own. Presets: switch one on to view it, off to return to your own
// map, or delete it. Pure UI: MapTab owns the state.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect, useState } from 'react';
import { Share2, Download, X, Layers, Trash2, Pencil } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../shared/components/Card.jsx';
import { encodeMapShare, decodeMapShare, containsLink } from './mapShareCode.js';
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

export function MapSharePopover({ panelRef, top, maxHeight, pins, foundIds, knownIconIds, presets, activePresetId, onImport, onActivatePreset, onDeletePreset, onRenamePreset, onClose }) {
  const [withFound, setWithFound] = useState(false);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('');
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState(null); // { pins, foundIds, dropped, unknown } | { error }
  const [presetName, setPresetName] = useState('');
  const [renaming, setRenaming] = useState(null); // { id, name } while a preset name is being edited
  const commitRename = () => {
    if (renaming && renaming.name.trim() && !containsLink(renaming.name)) onRenamePreset(renaming.id, renaming.name);
    setRenaming(null);
  };

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
    onImport({ pins: preview.pins, foundIds: preview.foundIds.filter(id => knownIconIds.has(id)), mode, name: presetName });
    setInput('');
    setPreview(null);
    setPresetName('');
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
                <input
                  type="text"
                  className="map-share-code map-share-name"
                  value={presetName}
                  maxLength={32}
                  placeholder={t('map.share.presetNamePlaceholder')}
                  aria-label={t('map.share.presetName')}
                  onChange={(e) => setPresetName(e.target.value)}
                  aria-invalid={containsLink(presetName)}
                />
                {containsLink(presetName) && <div className="hint map-share-error" role="alert">{t('map.pins.noLinks')}</div>}
                <div className="map-share-actions is-stacked">
                  <button type="button" className="kuro-btn kuro-btn-sm is-active" onClick={() => apply('preset')} disabled={containsLink(presetName)}>
                    <Layers size={14} /> {t('map.share.saveAsPreset')}
                  </button>
                  <button type="button" className="kuro-btn kuro-btn-sm" onClick={() => apply('add')} disabled={preview.pins.length === 0}>
                    <Download size={14} /> {t('map.share.addPins')}
                  </button>
                </div>
              </>
            ))}
          </div>
          {presets.length > 0 && (
            <div className="map-share-section">
              <div className="map-share-label">{t('map.share.presetsLabel')}</div>
              {presets.map(pr => {
                const on = pr.id === activePresetId;
                return (
                  <div key={pr.id} className={`map-preset-row ${on ? 'is-active' : ''}`}>
                    <div className="map-preset-meta">
                      {renaming && renaming.id === pr.id ? (
                        <>
                          <input
                            type="text"
                            className="map-share-code map-share-name"
                            value={renaming.name}
                            maxLength={32}
                            autoFocus
                            aria-label={t('map.share.presetName')}
                            aria-invalid={containsLink(renaming.name)}
                            onChange={(e) => { const v = e.target.value; setRenaming(r => ({ ...r, name: v })); }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') { e.preventDefault(); commitRename(); }
                              else if (e.key === 'Escape') { e.preventDefault(); setRenaming(null); }
                            }}
                            onBlur={commitRename}
                          />
                          {containsLink(renaming.name) && <div className="hint map-share-error" role="alert">{t('map.pins.noLinks')}</div>}
                        </>
                      ) : (
                        <button type="button" className="map-preset-name" onClick={() => setRenaming({ id: pr.id, name: pr.name })}
                          aria-label={t('map.share.renamePreset', { name: pr.name })} title={t('map.share.renamePreset', { name: pr.name })}>
                          {pr.name} <Pencil size={12} aria-hidden="true" />
                        </button>
                      )}
                      <div className="hint">{t('map.share.preview', { pins: pr.pins.length, found: pr.foundIds.length })}</div>
                    </div>
                    <button type="button" className={`kuro-btn kuro-btn-sm ${on ? 'is-active' : ''}`} aria-pressed={on}
                      onClick={() => onActivatePreset(on ? null : pr.id)}>
                      {on ? t('map.share.presetOn') : t('map.share.presetOff')}
                    </button>
                    <button type="button" className="kuro-btn kuro-btn-sm kuro-btn-icon" onClick={() => onDeletePreset(pr.id)}
                      aria-label={t('map.share.deletePreset', { name: pr.name })} title={t('map.share.deletePreset', { name: pr.name })}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
