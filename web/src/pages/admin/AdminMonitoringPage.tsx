import { MonitoringPage } from '@/components/MonitoringPage';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { useState, useEffect } from 'react';

export function AdminMonitoringPage() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await databases.listDocuments(APPWRITE_DB_ID, 'kegiatan', [Query.orderDesc('$updatedAt'), Query.limit(200)]);
        setItems(res.documents);
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    })();
  }, []);

  const handleIntervene = async (id: string, newStatus: string) => {
    try {
      await databases.updateDocument(APPWRITE_DB_ID, 'kegiatan', id, { status: newStatus });
      setItems(prev => prev.map(item => item.$id === id ? { ...item, status: newStatus, $updatedAt: new Date().toISOString() } : item));
      alert(`Status berhasil diubah menjadi ${newStatus}`);
    } catch (e: any) {
      alert(`Gagal merubah status: ${e.message}`);
    }
  };

  return <MonitoringPage items={items} isLoading={isLoading} title="Monitoring & Intervensi (Admin)" onIntervene={handleIntervene} />;
}
