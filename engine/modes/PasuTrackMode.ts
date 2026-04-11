import { ModeDefinition, EngineState, Difficulty } from '../types';

function pasuEndStats(state: EngineState, accentColor: string): string {
  return `Score: <span style="color:${accentColor}; font-weight:800; font-size:1.2rem;">${state.score}</span>`;
}

function createPasu(radius: number, speed: number, dirMin: number, dirMax: number, label: string): ModeDefinition {
  return {
    id: 'pasu-track',
    displayName: 'Pasu Track',
    description: `${label}`,
    icon: '\u{1F300}',
    systems: [
      {
        systemId: 'target',
        config: {
          count: 4,
          radius,
          movement: 'reactive',
          speed,
          respawnOnHit: false,
          hitDetection: 'hover_while_firing',
          dirChangeMinMs: dirMin,
          dirChangeMaxMs: dirMax,
          eliminateAfterMs: 3000,
        },
      },
      {
        systemId: 'score',
        config: {
          tracksAccuracy: false,
          scoreOnClick: false,
          scoreOnTracking: true,
          scoreLabel: 'Tracking Score',
        },
      },
      { systemId: 'timer', config: { duration: 60 } },
      { systemId: 'render', config: {} },
    ],
    hud: { showAccuracy: false, scoreLabel: 'Tracking Score' },
    formatEndStats: pasuEndStats,
  };
}

export const PasuTrackModes: Record<Difficulty, ModeDefinition> = {
  easy:   createPasu(14, 0.6, 1000, 2200, '4 gentle reactive targets — learn the pattern'),
  medium: createPasu(11, 1.0, 800, 1800, '4 evasive targets — sharp direction changes'),
  hard:   createPasu(8,  1.5, 600, 1400, '4 fast targets — reactive tracking'),
};

export const PasuTrackMode = PasuTrackModes.medium;
