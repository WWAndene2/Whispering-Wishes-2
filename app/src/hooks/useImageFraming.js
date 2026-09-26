// ═══════════════════════════════════════════════════════════════════════════════
// useImageFraming - Custom hook for image framing/cropping state management
// ═══════════════════════════════════════════════════════════════════════════════
//
// Extracted from App.jsx - manages position/zoom for character images in
// collection, team cards, and info panels. Persists to localStorage.

import { useState, useEffect, useCallback } from 'react';
import { sanitizeStateObj } from '../core/storage.js';
import { IMAGE_FRAMING_KEY } from '../shared/constants/appConstants.js';
import { DEFAULT_IMAGE_FRAMING } from '../data/imageFraming.js';

const MIN_ZOOM = 100;
const MAX_ZOOM = 300;

const defaultFramingBase = Object.freeze({ x: 0, y: 0, zoom: 100 });

/**
 * Custom hook for managing image framing state (position/zoom per image key).
 * Handles persistence to localStorage.
 *
 * @param {boolean} storageAvailable - Whether localStorage is available
 * @returns {object} Framing state and handlers
 */
export function useImageFraming(storageAvailable) {
  const [imageFraming, setImageFraming] = useState({});
  const [editingImage, setEditingImage] = useState(null);
  const [framingMode, setFramingMode] = useState(false);
  const [miniPanelPosition, setMiniPanelPosition] = useState('bottom-right');

  // Load from localStorage on mount
  useEffect(() => {
    if (!storageAvailable) return;
    try {
      const saved = localStorage.getItem(IMAGE_FRAMING_KEY);
      if (saved) setImageFraming(sanitizeStateObj(JSON.parse(saved)));
      const pos = localStorage.getItem('ww-mini-panel-pos');
      if (pos) setMiniPanelPosition(pos);
    } catch {}
  }, []);

  // Save framing for a specific image key
  const saveImageFraming = useCallback((key, settings) => {
    setImageFraming(prev => {
      const newFraming = { ...prev, [key]: settings };
      if (storageAvailable) {
        try { localStorage.setItem(IMAGE_FRAMING_KEY, JSON.stringify(newFraming)); } catch {}
      }
      return newFraming;
    });
  }, [storageAvailable]);

  // Get framing for an image (user override -> hardcoded default -> base default)
  const getImageFraming = useCallback((key) => {
    return imageFraming[key] || DEFAULT_IMAGE_FRAMING[key] || defaultFramingBase;
  }, [imageFraming]);

  // Update framing for currently editing image
  const updateEditingFraming = useCallback((changes) => {
    if (!editingImage) return;
    const current = imageFraming[editingImage] || DEFAULT_IMAGE_FRAMING[editingImage] || defaultFramingBase;
    const newFraming = { ...current, ...changes };
    newFraming.x = Math.max(-100, Math.min(100, newFraming.x));
    newFraming.y = Math.max(-100, Math.min(100, newFraming.y));
    newFraming.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newFraming.zoom));
    saveImageFraming(editingImage, newFraming);
  }, [editingImage, imageFraming, saveImageFraming]);

  const resetEditingFraming = useCallback(() => {
    if (!editingImage) return;
    saveImageFraming(editingImage, { x: 0, y: 0, zoom: 100 });
  }, [editingImage, saveImageFraming]);

  const saveMiniPanelPosition = useCallback((pos) => {
    setMiniPanelPosition(pos);
    if (storageAvailable) {
      try { localStorage.setItem('ww-mini-panel-pos', pos); } catch {}
    }
  }, [storageAvailable]);

  const getMiniPanelPositionClasses = useCallback(() => {
    switch (miniPanelPosition) {
      case 'top-left': return 'top-16 left-2';
      case 'top-right': return 'top-16 right-2';
      case 'bottom-left': return 'bottom-24 left-2';
      default: return 'bottom-24 right-2';
    }
  }, [miniPanelPosition]);

  return {
    imageFraming,
    setImageFraming,
    editingImage,
    setEditingImage,
    framingMode,
    setFramingMode,
    miniPanelPosition,
    saveMiniPanelPosition,
    getMiniPanelPositionClasses,
    saveImageFraming,
    getImageFraming,
    updateEditingFraming,
    resetEditingFraming,
  };
}
