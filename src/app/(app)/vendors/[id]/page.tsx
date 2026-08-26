import { VendorDetailView } from "@/components/vendors/vendor-detail-view";

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VendorDetailView vendorId={id} />;
}
