import { MonitoringPage } from '@/components/MonitoringPage';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { useState, useEffect } from 'react';

export function RektoratMonitoringPage() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const res = await databases.listDocuments(APPWRITE_DB_ID, 'kegiatan', [Query.orderDesc('$updatedAt'), Query.limit(300)]);
        setItems(res.documents);
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    })();
  }, []);
  return <MonitoringPage items={items} isLoading={isLoading} title="Monitoring Kegiatan Seluruh Politeknik" />;
}
