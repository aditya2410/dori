import { Skeleton } from '@/components/ui/skeleton'

export default function AdminProductsLoading() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`flex items-center gap-4 p-4 ${i < 4 ? 'border-b' : ''}`}>
            <Skeleton className="size-10 shrink-0" />
            <Skeleton className="h-4 flex-1 max-w-[200px]" />
            <Skeleton className="h-4 w-16 ml-auto hidden md:block" />
            <Skeleton className="h-5 w-14" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
