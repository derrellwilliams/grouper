export const ROSTER_SIZE = 20

export const GROUP_SIZE_OPTIONS = [2, 3, 4, 5, 6] as const
export type GroupSizeOption = (typeof GROUP_SIZE_OPTIONS)[number]
export const DEFAULT_GROUP_SIZE: GroupSizeOption = 5

/** Fewer than this and "splitting into groups" stops meaning anything. */
export const MIN_PRESENT_TO_GENERATE = 2

export interface Student {
  id: string
  name: string
  /** Whether this student is in class today and should be included when generating groups. */
  present: boolean
}

export type Roster = Student[]

/** Sparse map keyed by `${sortedIdA}|${sortedIdB}` -> co-occurrence count. Missing pairs are implicitly 0. */
export type PairHistory = Record<string, number>

export interface CurrentGroups {
  generatedAt: string
  /** groups[0] is "Group 1", groups[1] is "Group 2", etc. Group count and size vary with roster size and the chosen group size. */
  groups: string[][]
}

export type GroupNumber = number
