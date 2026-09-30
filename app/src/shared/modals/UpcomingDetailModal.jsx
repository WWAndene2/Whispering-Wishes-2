// ═══════════════════════════════════════════════════════════════════════════════
// WHISPERING WISHES — shared/modals/UpcomingDetailModal.jsx
// Profile for an announced-but-unreleased resonator or weapon (UPCOMING_RESONATORS /
// UPCOMING_WEAPONS): shows only what is already known and states the rest is coming.
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { X, Clock } from 'lucide-react';
import { UPCOMING_RESONATORS } from '../../data/characters.js';
import { UPCOMING_WEAPONS } from '../../data/weapons.js';
import { FocusTrapModal } from '../components/FocusTrapModal.jsx';
import { getElementIcon, getWeaponTypeIcon, getRarityIcon, getRoleIcon } from '../utils/elementVisuals.js';
import { hideOnError } from '../utils/imageHelpers.js';
import { t, pickTable } from '../../utils/i18n.js';
import { ELEMENT_NAME_TABLES, ROLE_TABLES, WEAPON_TYPE_TABLES } from '../../data/localeTables.js';

const UpcomingDetailModal = ({ name, kind, imageUrl, onClose }) => {
  const isCharacter = kind === 'character';
  const data = isCharacter ? UPCOMING_RESONATORS[name] : UPCOMING_WEAPONS[name];
  if (!data) return null;
  const weaponType = isCharacter ? data.weapon : data.type;

  return (
    <FocusTrapModal isOpen={true} onClose={onClose} className="" onClick={onClose} ariaLabel={t('modals.upcomingDetail.detailsAria', { name })} centered padding="p-3">
      <div
        className="kuro-card relative w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col border border-cyan-400/50"
        onClick={e => e.stopPropagation()}
      >
        <div className="overflow-y-auto flex-1" data-sheet-scroll>
          <div className="relative h-48 overflow-hidden rounded-t-2xl" style={{ contain: 'paint' }} data-sheet-header>
            <div className="absolute inset-0 bg-gradient-to-br bg-cyan-500/20" />
            {imageUrl && (
              <img
                src={imageUrl}
                alt={name}
                className={isCharacter ? 'absolute inset-0 w-full h-full object-cover opacity-80' : 'absolute right-2 top-1/2 -translate-y-1/2 h-32 object-contain opacity-90'}
                onError={hideOnError}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(12,16,24,0.95)] via-transparent to-transparent" />
            <button onClick={onClose} className="lh-corner absolute top-3 right-3 p-3 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-lg bg-black/50 text-white hover:bg-black/70 modal-close-btn" aria-label={t('modals.upcomingDetail.closeAria')}>
              <X size={16} />
            </button>
            <div className="absolute bottom-3 left-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="kuro-badge bg-cyan-400 text-black uppercase font-bold">{t('collection.grid.upcomingBadge')}</span>
                {isCharacter && (
                  <span className="kuro-badge kuro-badge-neutral inline-flex items-center gap-1">
                    {getElementIcon(data.element) && <img src={getElementIcon(data.element)} alt="" className="w-3.5 h-3.5" onError={hideOnError} />}
                    {pickTable(ELEMENT_NAME_TABLES)[data.element] || data.element}
                  </span>
                )}
                <span className="kuro-badge kuro-badge-neutral inline-flex items-center gap-1">
                  {getWeaponTypeIcon(weaponType) && <img src={getWeaponTypeIcon(weaponType)} alt="" className="w-3.5 h-3.5" onError={hideOnError} />}
                  {pickTable(WEAPON_TYPE_TABLES)[weaponType] || weaponType}
                </span>
                {isCharacter && (
                  <span className="kuro-badge kuro-badge-neutral inline-flex items-center gap-1">
                    {getRoleIcon(data.role) && <img src={getRoleIcon(data.role)} alt="" className="w-3.5 h-3.5" onError={hideOnError} />}
                    {pickTable(ROLE_TABLES)[data.role] || data.role}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-semibold text-white">{name}</h2>
              <div className="flex items-center gap-0.5 mt-0.5">
                {getRarityIcon(data.rarity) && <img src={getRarityIcon(data.rarity)} alt={`${data.rarity}★`} className="h-3" onError={hideOnError} />}
              </div>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {!isCharacter && data.forCharacter && (
              <div className="text-sm text-gray-300">{t('modals.upcomingDetail.signatureOf', { name: data.forCharacter })}</div>
            )}
            <div className="flex items-start gap-2 text-sm text-gray-400">
              <Clock size={16} className="text-cyan-400 shrink-0 mt-0.5" />
              <span>{isCharacter ? t('modals.upcomingDetail.characterPending') : t('modals.upcomingDetail.weaponPending')}</span>
            </div>
          </div>
        </div>
      </div>
    </FocusTrapModal>
  );
};

export { UpcomingDetailModal };
