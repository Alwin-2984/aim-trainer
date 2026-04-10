import { ModeDefinition, EngineState, Difficulty } from '../types';

function flickEndStats(state: EngineState, accentColor: string): string {
  const accuracy = state.totalShots === 0
    ? '100'
    : ((state.score / state.totalShots) * 100).toFixed(1);
  return `Score: <span style="color:${accentColor}; font-weight:800; font-size:1.2rem;">${state.score}</span> | Accuracy: <span style="color:${accentColor}; font-weight:800; font-size:1.2rem;">${accuracy}%</span>`;
}

function createFlick(radius: number, label: string): ModeDefinition {
  return {
    id: 'flick',
    displayName: `Micro-Flick`,
    description: `${label} — radius ${radius}px`,
    icon: '\u{1F3AF}',
    systems: [
      {
        systemId: 'target',
        config: {
          count: 5,
          radius,
          movement: 'static',
          speed: 0,
          respawnOnHit: true,
          hitDetection: 'click',
        },
      },
      {
        systemId: 'score',
        config: {
          tracksAccuracy: true,
          scoreOnClick: true,
          scoreOnTracking: false,
          scoreLabel: 'Targets Cleared',
        },
      },
      { systemId: 'timer', config: { duration: 60 } },
      { systemId: 'render', config: {} },
    ],
    hud: { showAccuracy: true, scoreLabel: 'Targets Cleared' },
    formatEndStats: flickEndStats,
  };
}

export const FlickModes: Record<Difficulty, ModeDefinition> = {
  easy:   createFlick(10, 'Large targets'),
  medium: createFlick(6,  'Standard targets'),
  hard:   createFlick(4,  'Tiny targets'),
};

/** Default (medium) for backward compatibility */
export const FlickMode = FlickModes.medium;
