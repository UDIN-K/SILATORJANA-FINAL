import { MonitoringPage } from '@/components/MonitoringPage';
import { getUserId } from '@/lib/helpers';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { useState, useEffect } from 'react';

export function PengusulMonitoringPage() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const userId = getUserId();
        const res = await databases.listDocuments(APPWRITE_DB_ID, 'kegiatan', [
          Query.equal('pengusul_id', userId),
          Query.orderDesc('$updatedAt'),
        ]);
        setItems(res.documents);
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };
    load();
  }, []);

  return <MonitoringPage items={items} isLoading={isLoading} title="Monitoring Kegiatan Saya" showJurusan={false} />;
}
