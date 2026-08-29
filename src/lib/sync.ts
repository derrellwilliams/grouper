import { STORAGE_KEYS } from '@/lib/storage'

export type SyncMessage =
  | { type: 'groups-updated' }
  | { type: 'roster-updated' }
  | { type: 'history-reset' }
  | { type: 'group-size-updated' }

type Listener = (message: SyncMessage) => void

const CHANNEL_NAME = 'grouper-sync'

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

const WATCHED_KEYS: string[] = [
  STORAGE_KEYS.roster,
  STORAGE_KEYS.pairHistory,
  STORAGE_KEYS.currentGroups,
  STORAGE_KEYS.groupSize,
]

window.addEventListener('storage', (event: StorageEvent) => {
  if (!event.key || !WATCHED_KEYS.includes(event.key)) return

  const message: SyncMessage =
    event.key === STORAGE_KEYS.roster
      ? { type: 'roster-updated' }
      : event.key === STORAGE_KEYS.groupSize
        ? { type: 'group-size-updated' }
        : event.key === STORAGE_KEYS.pairHistory && event.newValue === '{}'
          ? { type: 'history-reset' }
          : { type: 'groups-updated' }

  for (const listener of listeners) listener(message)
})

/** Notifies other tabs. Does NOT fire in the tab that calls it — callers must re-render their own UI directly. */
export function broadcast(message: SyncMessage): void {
  channel?.postMessage(message)
}

/** Subscribes to sync messages from other tabs. Returns an unsubscribe function. */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
