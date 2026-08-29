import { Card, CardContent } from '@/components/ui/card'
import { SplitFlapText } from '@/components/SplitFlapText'
import type { GroupNumber } from '@/types'

interface GroupCardProps {
  groupNumber: GroupNumber
  names: string[]
}

export function GroupCard({ groupNumber, names }: GroupCardProps) {
  return (
    <div className="animate-in fade-in zoom-in-95 flex h-full min-h-0 w-full flex-col gap-4 duration-500">
      <div className="w-fit shrink-0 self-start rounded-lg bg-white/8 px-2.5 py-2 font-mono text-[clamp(0.75rem,2vh,1.1rem)] leading-none tracking-wide text-white shadow-xl ring-0 backdrop-blur-xl">
        Group {groupNumber}
      </div>
      <Card className="min-h-0 flex-1 justify-start gap-1 overflow-hidden bg-white/8 py-8 ring-0 shadow-xl backdrop-blur-xl">
        <CardContent className="flex min-h-0 flex-1 flex-col justify-around gap-1 overflow-hidden px-8">
          {names.map((name, i) => (
            <div
              key={i}
              className="overflow-hidden font-condensed text-[clamp(1.1rem,3.8vh,2.25rem)] leading-tight font-medium whitespace-nowrap"
            >
              <SplitFlapText text={name} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
