import { pairKey } from '@/lib/storage'
import type { PairHistory } from '@/types'

// Kept small so this stays comfortably sub-frame on the main thread — a
// 20-element hill climb converges in a handful of swaps, so 300 iterations
// was a lot of unused safety margin that showed up as UI lag on click.
const RESTARTS = 60
const MAX_SWAP_ITERATIONS = 60

function shuffle<T>(items: T[]): T[] {
  const arr = items.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function groupPairCost(group: string[], history: PairHistory): number {
  let cost = 0
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      cost += history[pairKey(group[i], group[j])] ?? 0
    }
  }
  return cost
}

function totalCost(groups: string[][], history: PairHistory): number {
  return groups.reduce((sum, g) => sum + groupPairCost(g, history), 0)
}

function hillClimb(initialGroups: string[][], history: PairHistory): { groups: string[][]; cost: number } {
  const groups = initialGroups.map((g) => g.slice())

  for (let iter = 0; iter < MAX_SWAP_ITERATIONS; iter++) {
    let bestDelta = 0
    let bestSwap: [number, number, number, number] | null = null

    for (let gi = 0; gi < groups.length; gi++) {
      for (let gj = gi + 1; gj < groups.length; gj++) {
        for (let ai = 0; ai < groups[gi].length; ai++) {
          for (let bi = 0; bi < groups[gj].length; bi++) {
            const before = groupPairCost(groups[gi], history) + groupPairCost(groups[gj], history)

            const a = groups[gi][ai]
            const b = groups[gj][bi]
            groups[gi][ai] = b
            groups[gj][bi] = a
            const after = groupPairCost(groups[gi], history) + groupPairCost(groups[gj], history)
            groups[gi][ai] = a
            groups[gj][bi] = b

            const delta = after - before
            if (delta < bestDelta) {
              bestDelta = delta
              bestSwap = [gi, ai, gj, bi]
            }
          }
        }
      }
    }

    if (!bestSwap) break

    const [gi, ai, gj, bi] = bestSwap
    const a = groups[gi][ai]
    const b = groups[gj][bi]
    groups[gi][ai] = b
    groups[gj][bi] = a
  }

  return { groups, cost: totalCost(groups, history) }
}

/** Splits `total` into `count` near-equal parts, e.g. (18, 4) -> [5, 5, 4, 4]. */
function evenSizes(total: number, count: number): number[] {
  const base = Math.floor(total / count)
  const remainder = total % count
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0))
}

/**
 * Even-splits `total` across as many groups as `idealCount` allows without
 * ever leaving one student alone in their own group — a lone leftover gets
 * folded into another group (making it a 3) instead of standing as a group
 * of 1. Only a single present student has no group to fold into.
 */
function groupSizesFor(total: number, idealCount: number): number[] {
  let count = Math.max(1, Math.min(total, idealCount))
  let sizes = evenSizes(total, count)
  while (count > 1 && sizes.includes(1)) {
    count -= 1
    sizes = evenSizes(total, count)
  }
  return sizes
}

/**
 * Partitions `studentIds` into groups of roughly `targetGroupSize`, as evenly
 * sized as possible, minimizing the total historical co-occurrence weight of
 * pairs placed together this round. Runs randomized-restart hill climbing and
 * picks uniformly among the lowest-cost results so equally-good (e.g.
 * all-zero-history) groupings still vary from one generation to the next.
 */
export function generateGroups(studentIds: string[], history: PairHistory, targetGroupSize: number): string[][] {
  if (studentIds.length < 1) {
    throw new Error('generateGroups needs at least 1 student')
  }

  const idealCount = Math.max(1, Math.round(studentIds.length / targetGroupSize))
  const sizes = groupSizesFor(studentIds.length, idealCount)

  let best: { groups: string[][]; cost: number }[] = []
  let bestCost = Infinity

  for (let r = 0; r < RESTARTS; r++) {
    const shuffled = shuffle(studentIds)
    const initial: string[][] = []
    let offset = 0
    for (const size of sizes) {
      initial.push(shuffled.slice(offset, offset + size))
      offset += size
    }

    const result = hillClimb(initial, history)

    if (result.cost < bestCost) {
      bestCost = result.cost
      best = [result]
    } else if (result.cost === bestCost) {
      best.push(result)
    }
  }

  const winner = best[Math.floor(Math.random() * best.length)]
  return shuffle(winner.groups)
}

/** Increments pairHistory for every pair of students placed together this round. Returns a new object. */
export function applyGroupsToHistory(groups: string[][], history: PairHistory): PairHistory {
  const next = { ...history }
  for (const group of groups) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const key = pairKey(group[i], group[j])
        next[key] = (next[key] ?? 0) + 1
      }
    }
  }
  return next
}
