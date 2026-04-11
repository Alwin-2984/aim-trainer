import { ModeDefinition } from '../types';
import { FlickMode, FlickModes } from './FlickMode';
import { TrackingMode, TrackingModes } from './TrackingMode';
import { MicroAdjustmentMode, MicroAdjustmentModes } from './MicroAdjustmentMode';
import { PasuTrackMode, PasuTrackModes } from './PasuTrackMode';

export const modeRegistry: Record<string, ModeDefinition> = {
  flick: FlickMode,
  tracking: TrackingMode,
  'micro-adjustment': MicroAdjustmentMode,
  'pasu-track': PasuTrackMode,
};

export function getModeDefinition(id: string): ModeDefinition {
  const mode = modeRegistry[id];
  if (!mode) throw new Error(`Unknown mode: ${id}`);
  return mode;
}

export { FlickMode, FlickModes };
export { TrackingMode, TrackingModes };
export { MicroAdjustmentMode, MicroAdjustmentModes };
export { PasuTrackMode, PasuTrackModes };
