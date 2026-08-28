export const GROUP_COUNT = 4
export const GROUP_SIZE = 5
export const ROSTER_SIZE = GROUP_COUNT * GROUP_SIZE

export interface Student {
  id: string
  name: string
}

export type Roster = Student[]

/** Sparse map keyed by `${sortedIdA}|${sortedIdB}` -> co-occurrence count. Missing pairs are implicitly 0. */
export type PairHistory = Record<string, number>

export interface CurrentGroups {
  generatedAt: string
  /** groups[0] is always "Group 1" through groups[3] "Group 4". Each inner array holds 5 student ids. */
  groups: string[][]
}

export type GroupNumber = 1 | 2 | 3 | 4
