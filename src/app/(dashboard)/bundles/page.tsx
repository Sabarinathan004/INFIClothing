import { getBundles } from "@/actions/bundles";
import { BundleList } from "@/components/bundles/bundle-list";
import { PageHeader } from "@/components/shared/page-header";
import { AddBundleDialog } from "@/components/bundles/add-bundle-dialog";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function BundlesPage() {
  return (
    <div>
      <PageHeader
        title="Product Store"
        description="Manage predefined products and default prices for faster invoicing."
        action={<AddBundleDialog />}
      />
      
      <Suspense fallback={<BundlesSkeleton />}>
        <BundlesContent />
      </Suspense>
    </div>
  );
}

function BundlesSkeleton() {
  return (
    <div className="space-y-4 mt-6">
      <Skeleton className="h-10 w-full md:w-1/3" />
      <Skeleton className="h-64 w-full rounded-md" />
    </div>
  );
}

async function BundlesContent() {
  const { data: bundles } = await getBundles();
  return <BundleList initialBundles={bundles} />;
}
