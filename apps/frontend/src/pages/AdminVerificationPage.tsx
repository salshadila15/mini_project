import React, { useState, useEffect } from 'react';
import axiosInstance from '../lib/http';

interface Transaction {
  id: number;
  totalPrice: number;
  quantity: number;
  status: string;
  paymentProof: string;
  eventId: number;
}

const AdminVerificationPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. Ambil daftar transaksi yang butuh verifikasi
  const fetchTransactions = async () => {
    try {
      // Hubungkan ke API backend (bisa buat endpoint GET khusus admin jika diperlukan)
      const response = await axiosInstance.get('/api/transactions/pending-verification');
      setTransactions(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error("Gagal mengambil data transaksi admin", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // 2. Handle Aksi Approve atau Reject
  const handleAction = async (id: number, action: 'APPROVE' | 'REJECT') => {
    const confirmAction = window.confirm(`Apakah kamu yakin ingin ${action === 'APPROVE' ? 'menyetujui' : 'menolak'} pembayaran ini?`);
    if (!confirmAction) return;

    try {
      await axiosInstance.patch(`/api/transactions/${id}/verify`, { action });
      alert(`Transaksi berhasil di-${action.toLowerCase()}!`);
      // Refresh data setelah berhasil update
      fetchTransactions();
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal memproses verifikasi");
    }
  };

  if (loading) return <div className="text-center p-10">Memuat data verifikasi...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-xl mt-10">
      <h2 className="text-2xl font-bold mb-1 text-gray-800">🕵️‍♂️ Dashboard Verifikasi Organizer</h2>
      <p className="text-sm text-gray-500 mb-6">Periksa bukti transfer masuk dan update status kuota kursi secara *real-time*.</p>

      {transactions.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg text-gray-500">
          Tidak ada pembayaran yang butuh verifikasi saat ini. 🙌
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-sm font-semibold">
                <th className="p-3 border-b">ID</th>
                <th className="p-3 border-b">Total Tagihan</th>
                <th className="p-3 border-b">Jumlah Tiket</th>
                <th className="p-3 border-b">Bukti Transfer</th>
                <th className="p-3 border-b text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 text-sm text-gray-600 border-b">
                  <td className="p-3 font-mono">#{tx.id}</td>
                  <td className="p-3 font-semibold text-gray-800">IDR {tx.totalPrice.toLocaleString()}</td>
                  <td className="p-3">{tx.quantity} Kursi</td>
                  <td className="p-3">
                    <a 
                      href={`http://localhost:8000/uploads/proofs/${tx.paymentProof}`} // Sesuaikan URL server backend kamu
                      target="_blank" 
                      rel="noreferrer"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Lihat Gambar ↗
                    </a>
                  </td>
                  <td className="p-3 flex justify-center gap-2">
                    <button
                      onClick={() => handleAction(tx.id, 'APPROVE')}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md font-medium text-xs transition"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(tx.id, 'REJECT')}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md font-medium text-xs transition"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminVerificationPage;