import { GamePhase } from './types';
import { EventBus } from './EventBus';

const VALID_TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  [GamePhase.MENU]: [GamePhase.PLAYING],
  [GamePhase.PLAYING]: [GamePhase.PAUSED, GamePhase.GAME_OVER],
  [GamePhase.PAUSED]: [GamePhase.PLAYING, GamePhase.MENU],
  [GamePhase.GAME_OVER]: [GamePhase.MENU, GamePhase.PLAYING],
};

export class StateMachine {
  private _phase: GamePhase = GamePhase.MENU;

  constructor(private events: EventBus) {}

  get phase(): GamePhase {
    return this._phase;
  }

  transition(to: GamePhase): boolean {
    if (!this.canTransition(to)) return false;
    const from = this._phase;
    this._phase = to;
    this.events.emit('phase:changed', { from, to });
    return true;
  }

  canTransition(to: GamePhase): boolean {
    return VALID_TRANSITIONS[this._phase].includes(to);
  }

  reset(): void {
    this._phase = GamePhase.MENU;
  }
}
