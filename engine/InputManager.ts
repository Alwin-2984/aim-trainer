import { M_YAW, WALL_HALF } from './types';
import { EventBus } from './EventBus';

export class InputManager {
  private _position = { x: 0, y: 0 };
  private _isFiring = false;
  private _isLocked = false;
  private _sensitivity = 1.0;
  private _pixelsPerDegree = 0;

  private lockRequestPending = false;
  private lastUnlockTime = 0;

  private worldElement: HTMLElement | null = null;
  private crosshairElement: HTMLElement | null = null;

  // Bound handlers for cleanup
  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseDown: () => void;
  private boundMouseUp: () => void;
  private boundLockChange: () => void;
  private boundLockError: () => void;

  constructor(private events: EventBus) {
    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundMouseDown = this.handleMouseDown.bind(this);
    this.boundMouseUp = this.handleMouseUp.bind(this);
    this.boundLockChange = this.handlePointerLockChange.bind(this);
    this.boundLockError = this.handlePointerLockError.bind(this);

    document.addEventListener('pointerlockchange', this.boundLockChange);
    document.addEventListener('pointerlockerror', this.boundLockError);
    document.addEventListener('mousemove', this.boundMouseMove);
    document.addEventListener('mousedown', this.boundMouseDown);
    document.addEventListener('mouseup', this.boundMouseUp);
  }

  // ─── Public accessors ───

  get position(): { x: number; y: number } {
    return this._position;
  }

  get canvasPosition(): { x: number; y: number } {
    return {
      x: WALL_HALF - this._position.x,
      y: WALL_HALF - this._position.y,
    };
  }

  get isFiring(): boolean {
    return this._isFiring;
  }

  get isLocked(): boolean {
    return this._isLocked;
  }

  // ─── Configuration ───

  setSensitivity(value: number): void {
    this._sensitivity = value;
  }

  setPixelsPerDegree(value: number): void {
    this._pixelsPerDegree = value;
  }

  attachWorld(element: HTMLElement): void {
    this.worldElement = element;
  }

  attachCrosshair(element: HTMLElement): void {
    this.crosshairElement = element;
  }

  // ─── Pointer Lock ───

  requestLock(): void {
    if (document.pointerLockElement === document.body) return;
    if (this.lockRequestPending) return;

    const timeSinceUnlock = Date.now() - this.lastUnlockTime;
    const minCooldown = 300;

    const doRequest = () => {
      if (document.pointerLockElement !== document.body && !this.lockRequestPending) {
        this.lockRequestPending = true;
        document.body.requestPointerLock().catch((error: Error) => {
          this.lockRequestPending = false;
          if (error.message.includes('exited the lock')) {
            setTimeout(() => {
              if (document.pointerLockElement !== document.body && !this.lockRequestPending) {
                this.lockRequestPending = true;
                document.body.requestPointerLock().catch(() => {});
              }
            }, 500);
          }
        });
      }
    };

    if (timeSinceUnlock < minCooldown) {
      setTimeout(doRequest, minCooldown - timeSinceUnlock);
    } else {
      setTimeout(doRequest, 50);
    }
  }

  releaseLock(): void {
    if (document.pointerLockElement === document.body) {
      document.exitPointerLock();
    }
  }

  resetPosition(): void {
    this._position = { x: 0, y: 0 };
    if (this.worldElement) {
      this.worldElement.style.transform = 'translate3d(-50%, -50%, 0)';
    }
  }

  // ─── Event Handlers ───

  private handleMouseMove(e: MouseEvent): void {
    if (!this._isLocked || !this.worldElement) return;

    const degX = e.movementX * this._sensitivity * M_YAW;
    const degY = e.movementY * this._sensitivity * M_YAW;
    const pixelMoveX = degX * this._pixelsPerDegree;
    const pixelMoveY = degY * this._pixelsPerDegree;

    const newX = Math.max(-2500, Math.min(2500, this._position.x - pixelMoveX));
    const newY = Math.max(-2500, Math.min(2500, this._position.y - pixelMoveY));
    this._position = { x: newX, y: newY };

    this.worldElement.style.transform = `translate3d(calc(-50% + ${newX}px), calc(-50% + ${newY}px), 0)`;

    this.events.emit('input:mousemove', { dx: e.movementX, dy: e.movementY });
  }

  private handleMouseDown(): void {
    if (!this._isLocked) return;
    this._isFiring = true;

    if (this.crosshairElement) {
      this.crosshairElement.classList.remove('recoil');
      void this.crosshairElement.offsetWidth;
      this.crosshairElement.classList.add('recoil');
    }

    const pos = this.canvasPosition;
    this.events.emit('input:mousedown', { canvasX: pos.x, canvasY: pos.y });
  }

  private handleMouseUp(): void {
    this._isFiring = false;
    this.events.emit('input:mouseup', undefined as unknown as void);
  }

  private handlePointerLockChange(): void {
    if (document.pointerLockElement === document.body) {
      this._isLocked = true;
      this.lockRequestPending = false;
    } else {
      this._isLocked = false;
      this.lockRequestPending = false;
      this.lastUnlockTime = Date.now();
    }
  }

  private handlePointerLockError(): void {
    this.lockRequestPending = false;
  }

  // ─── Cleanup ───

  destroy(): void {
    document.removeEventListener('pointerlockchange', this.boundLockChange);
    document.removeEventListener('pointerlockerror', this.boundLockError);
    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('mousedown', this.boundMouseDown);
    document.removeEventListener('mouseup', this.boundMouseUp);
  }
}
