import { PageHeaderSkeleton, TableSkeleton } from "@/components/skeletons";

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <TableSkeleton />
    </div>
  );
}
