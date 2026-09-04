export type SyncMessage =
  | { type: 'groups-updated' }
  | { type: 'roster-updated' }
  | { type: 'history-reset' }
  | { type: 'group-size-updated' }

type Listener = (message: SyncMessage) => void

const CHANNEL_NAME = 'grouper-sync'

// BroadcastChannel has shipped in every evergreen browser (Safari included,
// since 15.4) for years now, so this is the only cross-tab mechanism —
// no `storage`-event fallback. Every state-mutating action already calls
// `broadcast()` explicitly, so nothing is lost by not also watching
// `localStorage` writes directly.
let channel: BroadcastChannel | null = null
if (typeof BroadcastChannel !== 'undefined') {
  channel = new BroadcastChannel(CHANNEL_NAME)
}

const listeners = new Set<Listener>()

if (channel) {
  channel.onmessage = (event: MessageEvent<SyncMessage>) => {
    for (const listener of listeners) listener(event.data)
  }
}

/** Notifies other tabs. Does NOT fire in the tab that calls it — callers must re-render their own UI directly. */
export function broadcast(message: SyncMessage): void {
  channel?.postMessage(message)
}

/** Subscribes to sync messages from other tabs. Returns an unsubscribe function. */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
