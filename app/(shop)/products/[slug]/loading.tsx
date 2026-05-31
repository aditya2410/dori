import { Skeleton } from '@/components/ui/skeleton'

export default function ProductDetailLoading() {
  return (
    <div className="container py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-20">
        <Skeleton className="aspect-[3/4] w-full" />
        <div className="flex flex-col gap-6 md:pt-4">
          <div className="space-y-3">
            <Skeleton className="h-10 w-4/5" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Skeleton className="h-11 w-full mt-4" />
        </div>
      </div>
    </div>
  )
}
