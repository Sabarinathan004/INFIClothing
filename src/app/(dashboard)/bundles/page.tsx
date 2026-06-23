import { getBundles } from "@/actions/bundles";
import { BundleList } from "@/components/bundles/bundle-list";
import { PageHeader } from "@/components/shared/page-header";
import { AddBundleDialog } from "@/components/bundles/add-bundle-dialog";

export default async function BundlesPage() {
  const bundles = await getBundles();

  return (
    <div>
      <PageHeader
        title="Bundle Master"
        description="Manage predefined bundles and default prices for faster invoicing."
        action={<AddBundleDialog />}
      />
      
      <BundleList initialBundles={bundles} />
    </div>
  );
}
