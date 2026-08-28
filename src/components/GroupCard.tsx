import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { SplitFlapText } from '@/components/SplitFlapText'
import type { GroupNumber } from '@/types'

interface GroupCardProps {
  groupNumber: GroupNumber
  names: string[]
}

export function GroupCard({ groupNumber, names }: GroupCardProps) {
  return (
    <Card className="animate-in fade-in zoom-in-95 h-full min-h-0 justify-start gap-1 overflow-hidden bg-white/8 py-8 ring-0 shadow-xl duration-500 backdrop-blur-xl">
      <CardHeader className="shrink-0 px-8">
        <div className="-ml-3 inline-block w-fit rounded-lg bg-neutral-800 p-3 font-mono text-[clamp(0.75rem,2vh,1.1rem)] leading-none tracking-wide text-white">
          Group {groupNumber}
        </div>
      </CardHeader>
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
  )
}
