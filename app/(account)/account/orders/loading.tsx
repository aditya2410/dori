import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

export default function OrdersLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="space-y-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="flex items-center justify-between py-5">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-28" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
            {i < 3 && <Separator />}
          </div>
        ))}
      </div>
    </div>
  )
}
