'use client';

import { Settings as SettingsType } from '@/types/game';
import { X } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SettingsType;
  onSettingChange: (key: keyof SettingsType, value: any) => void;
  sensitivity: number;
  onSensitivityChange: (value: number) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSettingChange,
  sensitivity,
  onSensitivityChange,
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed z-[201] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[480px] max-h-[85vh] overflow-y-auto bg-[#111118] border border-white/10 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.8)]">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#111118]/95 backdrop-blur-md">
          <h2 className="text-base font-bold uppercase tracking-widest text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* ═══ Crosshair Preview ═══ */}
          <div className="rounded-xl overflow-hidden border border-white/[0.08]">
            <div className="flex items-center justify-center h-28 bg-[#1a1a22] relative">
              {/* Top line */}
              <div
                className="absolute"
                style={{
                  width: `${settings.thickness}px`,
                  height: `${settings.length}px`,
                  backgroundColor: settings.color,
                  top: `calc(50% - ${settings.gap + settings.length}px)`,
                  left: `calc(50% - ${settings.thickness / 2}px)`,
                }}
              />
              {/* Bottom line */}
              <div
                className="absolute"
                style={{
                  width: `${settings.thickness}px`,
                  height: `${settings.length}px`,
                  backgroundColor: settings.color,
                  top: `calc(50% + ${settings.gap}px)`,
                  left: `calc(50% - ${settings.thickness / 2}px)`,
                }}
              />
              {/* Left line */}
              <div
                className="absolute"
                style={{
                  width: `${settings.length}px`,
                  height: `${settings.thickness}px`,
                  backgroundColor: settings.color,
                  top: `calc(50% - ${settings.thickness / 2}px)`,
                  left: `calc(50% - ${settings.gap + settings.length}px)`,
                }}
              />
              {/* Right line */}
              <div
                className="absolute"
                style={{
                  width: `${settings.length}px`,
                  height: `${settings.thickness}px`,
                  backgroundColor: settings.color,
                  top: `calc(50% - ${settings.thickness / 2}px)`,
                  left: `calc(50% + ${settings.gap}px)`,
                }}
              />
              {/* Center dot */}
              {settings.dot && (
                <div
                  className="absolute rounded-full"
                  style={{
                    width: '3px',
                    height: '3px',
                    backgroundColor: settings.color,
                    top: 'calc(50% - 1.5px)',
                    left: 'calc(50% - 1.5px)',
                  }}
                />
              )}
            </div>
          </div>

          {/* ═══ Crosshair Settings ═══ */}
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/30 mb-4">Crosshair</h3>
            <div className="space-y-4">
              {/* Color */}
              <Row label="Color">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-md border border-white/15 shrink-0"
                    style={{ backgroundColor: settings.color }}
                  />
                  <input
                    type="color"
                    value={settings.color}
                    onChange={(e) => onSettingChange('color', e.target.value)}
                    className="w-8 h-7 rounded cursor-pointer bg-transparent border-0 p-0"
                  />
                </div>
              </Row>

              {/* Length */}
              <Row label="Length">
                <Slider
                  min={2} max={50} value={settings.length}
                  onChange={(v) => onSettingChange('length', v)}
                />
              </Row>

              {/* Thickness */}
              <Row label="Thickness">
                <Slider
                  min={1} max={10} value={settings.thickness}
                  onChange={(v) => onSettingChange('thickness', v)}
                />
              </Row>

              {/* Gap */}
              <Row label="Gap">
                <Slider
                  min={0} max={50} value={settings.gap}
                  onChange={(v) => onSettingChange('gap', v)}
                />
              </Row>

              {/* Center Dot */}
              <Row label="Center Dot">
                <button
                  onClick={() => onSettingChange('dot', !settings.dot)}
                  className={`relative w-10 h-5.5 rounded-full transition-colors cursor-pointer ${
                    settings.dot ? 'bg-[#ff8c00]' : 'bg-white/15'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-all ${
                      settings.dot ? 'left-5' : 'left-0.5'
                    }`}
                  />
                </button>
              </Row>
            </div>
          </div>

          {/* ═══ Sensitivity ═══ */}
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/30 mb-4">Sensitivity</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0.1"
                  max="5.0"
                  step="0.01"
                  value={sensitivity}
                  onChange={(e) => onSensitivityChange(parseFloat(e.target.value))}
                  className="flex-1 accent-[#ff8c00] h-1.5"
                />
                <input
                  type="number"
                  value={sensitivity.toFixed(2)}
                  step="0.01"
                  min="0.01"
                  onChange={(e) => onSensitivityChange(parseFloat(e.target.value))}
                  className="w-[72px] px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white text-sm text-center outline-none focus:border-[#ff8c00] tabular-nums"
                />
              </div>
              <p className="text-[10px] text-white/25">CS2 sensitivity (m_yaw 0.022)</p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-white/50 font-medium shrink-0">{label}</span>
      {children}
    </div>
  );
}

function Slider({
  min, max, value, step, onChange,
}: {
  min: number; max: number; value: number; step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2.5 w-48">
      <input
        type="range"
        min={min}
        max={max}
        step={step ?? 1}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="flex-1 accent-[#ff8c00] h-1.5"
      />
      <span className="text-xs text-[#ff8c00] font-bold tabular-nums w-9 text-right">{value}px</span>
    </div>
  );
}
