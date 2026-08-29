import { cn } from '@/lib/utils'
import { GROUP_SIZE_OPTIONS, type GroupSizeOption } from '@/types'

interface GroupSizePickerProps {
  value: GroupSizeOption
  onChange: (size: GroupSizeOption) => void
}

/** Chip row for choosing how many students land in each group. */
export function GroupSizePicker({ value, onChange }: GroupSizePickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Students per group"
      className="flex items-center gap-2 rounded-full bg-white/8 p-2 shadow-xl ring-0 backdrop-blur-xl"
    >
      {GROUP_SIZE_OPTIONS.map((size) => {
        const selected = size === value
        return (
          <button
            key={size}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(size)}
            className={cn(
              // size-14 matches the spin button's height, so the active chip lines up with it.
              'flex size-14 cursor-pointer items-center justify-center rounded-full font-mono text-xl font-semibold transition-all duration-150 ease-out hover:scale-110 active:scale-90',
              selected ? 'bg-white text-neutral-900 shadow-md' : 'text-white/60 hover:bg-white/10 hover:text-white',
            )}
          >
            {size}
          </button>
        )
      })}
    </div>
  )
}
