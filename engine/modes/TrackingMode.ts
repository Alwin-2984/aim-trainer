import { ModeDefinition, EngineState, Difficulty } from '../types';

const TRACKING_RADIUS = 14;

function trackingEndStats(state: EngineState, accentColor: string): string {
  return `Score: <span style="color:${accentColor}; font-weight:800; font-size:1.2rem;">${state.score}</span>`;
}

function createTracking(speed: number, label: string): ModeDefinition {
  return {
    id: 'tracking',
    displayName: 'Smooth Tracking',
    description: `${label} — speed ${speed}`,
    icon: '\u{1F4CD}',
    systems: [
      {
        systemId: 'target',
        config: {
          count: 1,
          radius: TRACKING_RADIUS,
          movement: 'linear_bounce',
          speed,
          respawnOnHit: false,
          hitDetection: 'hover_while_firing',
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
    formatEndStats: trackingEndStats,
  };
}

export const TrackingModes: Record<Difficulty, ModeDefinition> = {
  easy:   createTracking(3,  'Slow target'),
  medium: createTracking(6,  'Standard speed'),
  hard:   createTracking(10, 'Fast target'),
};

/** Default (medium) for backward compatibility */
export const TrackingMode = TrackingModes.medium;
