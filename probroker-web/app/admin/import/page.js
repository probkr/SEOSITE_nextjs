import BulkImportClient from '@/components/admin/BulkImportClient';

export const dynamic = 'force-dynamic';

export default async function ImportPage() {
  return (
    <div>
      <BulkImportClient dbInfo={{}} />
    </div>
  );
}
