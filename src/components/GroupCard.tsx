import type { Ref } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { SplitFlapText } from '@/components/SplitFlapText'
import type { GroupNumber } from '@/types'

interface GroupCardProps {
  groupNumber: GroupNumber
  names: string[]
  fontSizePx: number
  contentRef?: Ref<HTMLDivElement>
}

export function GroupCard({ groupNumber, names, fontSizePx, contentRef }: GroupCardProps) {
  return (
    <div className="animate-in fade-in zoom-in-95 flex h-full min-h-0 w-full min-w-0 flex-col gap-4 duration-500">
      <div className="w-fit shrink-0 self-start rounded-lg bg-white/8 px-2.5 py-2 font-mono text-[clamp(0.75rem,2vh,1.1rem)] leading-none tracking-wide text-white shadow-xl ring-0 backdrop-blur-xl">
        Group {groupNumber}
      </div>
      <Card className="min-h-0 flex-1 justify-start gap-1 overflow-hidden bg-white/8 py-8 ring-0 shadow-xl backdrop-blur-xl">
        <CardContent
          ref={contentRef}
          className="flex min-h-0 flex-1 flex-col justify-start gap-2 overflow-hidden px-8"
        >
          {names.map((name, i) => (
            <div
              key={i}
              className="overflow-hidden font-condensed font-medium whitespace-nowrap"
              style={{ fontSize: fontSizePx, lineHeight: 1.5 }}
            >
              <SplitFlapText text={name} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
