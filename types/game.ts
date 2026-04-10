export type GameMode = 'flick' | 'tracking';

export interface Settings {
  sensitivity: number;
  color: string;
  length: number;
  thickness: number;
  gap: number;
  dot: boolean;
}
