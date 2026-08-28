import type { GroupNumber } from '@/types'

export const GROUP_COLORS: Record<GroupNumber, { var: string; label: string }> = {
  1: { var: 'var(--group-1)', label: 'Group 1' },
  2: { var: 'var(--group-2)', label: 'Group 2' },
  3: { var: 'var(--group-3)', label: 'Group 3' },
  4: { var: 'var(--group-4)', label: 'Group 4' },
}

export function groupNumberForIndex(index: number): GroupNumber {
  return (index + 1) as GroupNumber
}
