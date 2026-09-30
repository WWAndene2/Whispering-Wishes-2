// ═══════════════════════════════════════════════════════════════════════════════
// WHISPERING WISHES — shared/components/AnimatedAssetTile.jsx
// Labeled asset tile that plays a transparent looping video (getAnimatedAssets:
// animated banner splash art, animated full sprite) in place when pressed —
// same ▶ / ✕ toggle as the detail modal's other Assets tiles. The clip only
// starts downloading once pressed (preload="none"); until then the tile shows
// the poster image when given, otherwise its dark backdrop.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Play, X } from 'lucide-react';
import { hideOnError } from '../utils/imageHelpers.js';

const AnimatedAssetTile = ({ videoUrl, posterUrl, label, ariaLabel, closeAriaLabel, className = '' }) => {
  const [playing, setPlaying] = useState(false);
  if (!videoUrl) return null;

  return (
    <div className={`relative rounded-lg overflow-hidden border border-[var(--border-medium)] bg-black/30 ${className}`}>
      {playing ? (
        <video
          src={videoUrl}
          className="absolute inset-0 w-full h-full object-contain"
          autoPlay
          loop
          muted
          playsInline
          preload="none"
          onError={() => setPlaying(false)}
        />
      ) : posterUrl ? (
        <img src={posterUrl} alt="" className="absolute inset-0 w-full h-full object-contain" onError={hideOnError} />
      ) : null}
      <button
        onClick={(e) => { e.stopPropagation(); setPlaying(p => !p); }}
        className="absolute inset-0 flex items-center justify-center"
        aria-label={playing ? closeAriaLabel : ariaLabel}
      >
        {!playing && (
          <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
            <Play size={12} className="fill-current text-white ml-0.5" />
          </div>
        )}
      </button>
      {playing && (
        <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center pointer-events-none">
          <X size={12} className="text-white" />
        </div>
      )}
      {label && !playing && <span className="absolute bottom-1 left-1.5 text-white text-sm font-medium drop-shadow-lg pointer-events-none">{label}</span>}
    </div>
  );
};

export { AnimatedAssetTile };
