'use client';

import { useEffect, useState, useCallback } from 'react';
import { Settings } from '@/types/game';

const DEFAULT_SETTINGS: Settings = {
  sensitivity: 1.0,
  color: '#00ff00',
  length: 0,
  thickness: 0,
  gap: 0,
  dot: true,
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [sensitivity, setSensitivity] = useState(1.0);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('aimTrainerSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
        if (parsed.sensitivity !== undefined) {
          setSensitivity(parsed.sensitivity);
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
    setSettingsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    const settingsToSave = { ...settings, sensitivity };
    localStorage.setItem('aimTrainerSettings', JSON.stringify(settingsToSave));
  }, [settings, sensitivity]);

  // Sync CSS variables
  useEffect(() => {
    document.documentElement.style.setProperty('--ch-color', settings.color);
    document.documentElement.style.setProperty('--ch-length', `${settings.length}px`);
    document.documentElement.style.setProperty('--ch-thickness', `${settings.thickness}px`);
    document.documentElement.style.setProperty('--ch-gap', `${settings.gap}px`);
    document.documentElement.style.setProperty('--ch-dot-opacity', settings.dot ? '1' : '0');
  }, [settings]);

  const handleSettingChange = useCallback((key: keyof Settings, value: Settings[keyof Settings]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  return {
    settings,
    sensitivity,
    settingsLoaded,
    setSensitivity,
    handleSettingChange,
  };
}
