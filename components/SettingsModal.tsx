import { Settings as SettingsType } from '@/types/game';

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
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="settings-modal">
        <div className="modal-header">
          <h2>⚙️ Settings</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-content">
          <div className="settings-section">
            <h3>Crosshair</h3>
            
            <div className="setting-row">
              <label>Color</label>
              <input 
                type="color" 
                value={settings.color}
                onChange={(e) => onSettingChange('color', e.target.value)}
              />
            </div>
            
            <div className="setting-row">
              <label>Length</label>
              <div className="range-group">
                <input 
                  type="range" 
                  min="2" 
                  max="50" 
                  value={settings.length}
                  onChange={(e) => onSettingChange('length', parseInt(e.target.value))}
                />
                <span className="range-value">{settings.length}px</span>
              </div>
            </div>
            
            <div className="setting-row">
              <label>Thickness</label>
              <div className="range-group">
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={settings.thickness}
                  onChange={(e) => onSettingChange('thickness', parseInt(e.target.value))}
                />
                <span className="range-value">{settings.thickness}px</span>
              </div>
            </div>
            
            <div className="setting-row">
              <label>Gap</label>
              <div className="range-group">
                <input 
                  type="range" 
                  min="0" 
                  max="50" 
                  value={settings.gap}
                  onChange={(e) => onSettingChange('gap', parseInt(e.target.value))}
                />
                <span className="range-value">{settings.gap}px</span>
              </div>
            </div>
            
            <div className="setting-row">
              <label>Center Dot</label>
              <input 
                type="checkbox" 
                checked={settings.dot}
                onChange={(e) => onSettingChange('dot', e.target.checked)}
              />
            </div>
          </div>
          
          <div className="settings-section">
            <h3>Sensitivity</h3>
            
            <div className="setting-row">
              <label>Multiplier</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <input 
                  type="range" 
                  min="0.1" 
                  max="5.0" 
                  step="0.01" 
                  value={sensitivity}
                  onChange={(e) => onSensitivityChange(parseFloat(e.target.value))}
                  style={{ flex: 1 }}
                />
                <input 
                  type="number" 
                  value={sensitivity.toFixed(2)} 
                  step="0.01" 
                  min="0.01"
                  onChange={(e) => onSensitivityChange(parseFloat(e.target.value))}
                  style={{ width: '80px' }}
                />
              </div>
            </div>
            
            <p className="setting-note">
              Matched to CS2 Sensitivity (m_yaw 0.022)
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
