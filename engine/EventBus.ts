import { EngineEvents } from './types';

type Handler<T> = (data: T) => void;

export class EventBus {
  private listeners = new Map<string, Set<Handler<any>>>();

  on<K extends keyof EngineEvents>(
    event: K,
    handler: Handler<EngineEvents[K]>,
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  emit<K extends keyof EngineEvents>(event: K, data: EngineEvents[K]): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    for (const handler of handlers) {
      handler(data);
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
