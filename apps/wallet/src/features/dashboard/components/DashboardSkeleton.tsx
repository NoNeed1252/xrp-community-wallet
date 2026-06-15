import { Card, CardHeader, Skeleton } from '@rc/ui';

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-4 items-center flex-col sm:flex-row">
        <Skeleton width="60%" height={36} className="max-w-[400px]" />
        <Skeleton width={180} height={48} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <Skeleton width={160} height={20} />
            </CardHeader>
            <SkeletonRows />
          </Card>
          <Card>
            <CardHeader>
              <Skeleton width={180} height={20} />
            </CardHeader>
            <SkeletonRows />
          </Card>
        </div>
        <aside className="lg:col-span-4 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <Skeleton width={120} height={20} />
            </CardHeader>
            <div className="flex items-center gap-4">
              <Skeleton width={156} height={156} rounded="full" />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton width="80%" height={16} />
                <Skeleton width="60%" height={16} />
                <Skeleton width="40%" height={16} />
              </div>
            </div>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton width={120} height={20} />
            </CardHeader>
            <div className="flex flex-col gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton width="60%" height={14} />
                  <Skeleton width={120} height={24} rounded="full" className="ml-auto" />
                </div>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 items-center">
          <Skeleton className="col-span-2" height={14} />
          <Skeleton className="col-span-4" height={14} />
          <Skeleton className="col-span-3" height={14} />
          <Skeleton className="col-span-2" height={14} />
          <Skeleton className="col-span-1" height={20} rounded="full" />
        </div>
      ))}
    </div>
  );
}
