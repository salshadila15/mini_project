import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../lib/http';

const PaymentPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Handle ketika user memilih file gambar
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file)); // Membuat link preview gambar
    }
  };

  // Kirim gambar ke backend
  const handleSubmitProof = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFile) return alert("Silakan pilih file bukti transfer terlebih dahulu!");

    const formData = new FormData();
    // 'paymentProof' harus sama dengan nama di router backend -> upload.single('paymentProof')
    formData.append('paymentProof', selectedFile); 

    try {
      await axiosInstance.patch(`/api/transactions/${id}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert("Bukti transfer berhasil dikirim! Menunggu verifikasi dari Organizer.");
      navigate('/'); // Kembalikan user ke beranda atau dashboard tiket mereka
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal mengunggah bukti pembayaran");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-lg rounded-xl mt-10 border border-gray-100">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">🔒 Pembayaran Tiket</h2>
      <p className="text-sm text-gray-500 mb-6">Selesaikan transfer manual agar kursi pesananmu tidak hangus.</p>

      {/* Instruksi Rekening */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
        <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Transfer Ke Rekening Organizer:</p>
        <p className="font-mono font-bold text-xl mt-1 text-blue-900">BCA: 1234-5678-90</p>
        <p className="text-sm text-blue-800 font-medium">a.n. PT Kreatif Event Nusantara</p>
      </div>

      {/* Form Upload */}
      <form onSubmit={handleSubmitProof} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Gambar Bukti Transfer (.jpg, .png)
          </label>
          
          {previewUrl && (
            <div className="mb-3">
              <img src={previewUrl} alt="Preview Bukti" className="w-full h-40 object-cover rounded-md border" />
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition duration-200"
        >
          Kirim Bukti Pembayaran
        </button>
      </form>
    </div>
  );
};

export default PaymentPage;