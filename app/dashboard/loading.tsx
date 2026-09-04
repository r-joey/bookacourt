import { PageHeaderSkeleton, StatCardsSkeleton, ListSkeleton } from "@/components/skeletons";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <StatCardsSkeleton />
      <ListSkeleton />
    </div>
  );
}
