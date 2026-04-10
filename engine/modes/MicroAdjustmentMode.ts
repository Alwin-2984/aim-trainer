import { ModeDefinition, EngineState, Difficulty } from '../types';

function microEndStats(state: EngineState, accentColor: string): string {
  return `Score: <span style="color:${accentColor}; font-weight:800; font-size:1.2rem;">${state.score}</span>`;
}

function createMicro(radius: number, speed: number, boundsSize: number, label: string): ModeDefinition {
  return {
    id: 'micro-adjustment',
    displayName: 'Micro Adjustment',
    description: `${label} — radius ${radius}px, speed ${speed}`,
    icon: '\u{1F52C}',
    systems: [
      {
        systemId: 'target',
        config: {
          count: 1,
          radius,
          movement: 'linear_bounce',
          speed,
          respawnOnHit: false,
          hitDetection: 'hover_while_firing',
          boundsSize,
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
    formatEndStats: microEndStats,
  };
}

export const MicroAdjustmentModes: Record<Difficulty, ModeDefinition> = {
  easy:   createMicro(10, 1.2, 220, 'Larger target, gentle drift'),
  medium: createMicro(8,  1.8, 200, 'Standard precision'),
  hard:   createMicro(5,  2.5, 170, 'Tiny target, tight zone'),
};

/** Default (medium) for backward compatibility */
export const MicroAdjustmentMode = MicroAdjustmentModes.medium;
