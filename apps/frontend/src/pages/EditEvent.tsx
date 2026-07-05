import React, { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../lib/http'; // ✅ Menggunakan instance axios buatanmu

interface EventData {
  name: string;
  description: string;
  price: number;
  date: string;
  location: string;
  category: string;
  availableSeats: number;
  image: string | null;
}

const EditEvent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<EventData>({
    name: '',
    description: '',
    price: 0,
    date: '',
    location: '',
    category: '',
    availableSeats: 0,
    image: null,
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Ambil data event lama menggunakan axiosInstance (Token otomatis masuk)
  useEffect(() => {
    const fetchEventDetail = async () => {
      try {
        const response = await axiosInstance.get(`/api/events/${id}`);
        // Menangani fleksibilitas struktur response dari backend
        const event = response.data.data || response.data;
        
        const formattedDate = event.date ? new Date(event.date).toISOString().slice(0, 16) : '';

        setFormData({
          name: event.name || '',
          description: event.description || '',
          price: event.price || 0,
          date: formattedDate,
          location: event.location || '',
          category: event.category || '',
          availableSeats: event.availableSeats || 0,
          image: event.image || null,
        });

        if (event.image) {
          const baseUrl = axiosInstance.defaults.baseURL || 'http://localhost:8000';
          setPreviewUrl(`${baseUrl}/uploads/${event.image}`);
        }
        
        setLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Gagal mengambil data event');
        setLoading(false);
      }
    };

    if (id) {
      fetchEventDetail();
    }
  }, [id]);

  // 2. Handle perubahan input teks & angka
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 3. Handle pemilihan gambar baru
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // 4. Kirim data perubahan dengan axiosInstance & FormData
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend = new FormData();
      
      dataToSend.append('name', formData.name);
      dataToSend.append('description', formData.description);
      dataToSend.append('price', formData.price.toString());
      dataToSend.append('availableSeats', formData.availableSeats.toString());

      if (formData.date) {
        try{
            dataToSend.append('date', new Date(formData.date).toISOString());
        } catch {
          dataToSend.append('date', formData.date); // fallback jika parsing gagal
        }
      }

      dataToSend.append('location', formData.location);
      dataToSend.append('category', formData.category);
      
      if (selectedFile) {
        dataToSend.append('image', selectedFile);
      }

      // ✅ Menggunakan axiosInstance dengan header multipart/form-data untuk upload file
      await axiosInstance.put(`/api/events/${id}`, dataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert('Event berhasil diperbarui!');
      // ✅ Diperbaiki sesuai dengan route path detail event kamu (bukan /events/:id tapi /event/:id)
      navigate(`/event/${id}`); 
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal memperbarui event');
    }
  };

  if (loading) return <div className="text-center p-10">Memuat data event...</div>;
  if (error) return <div className="text-center text-red-500 p-10">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">🛠️ Edit Event</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Input Nama */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Nama Event</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="mt-1 w-full p-2 border rounded-md"
            required
          />
        </div>

        {/* Input Deskripsi */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="mt-1 w-full p-2 border rounded-md h-32"
            required
          />
        </div>

        {/* Input Harga & Kursi */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Harga (IDR)</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              className="mt-1 w-full p-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Jumlah Kursi</label>
            <input
              type="number"
              name="availableSeats"
              value={formData.availableSeats}
              onChange={handleInputChange}
              className="mt-1 w-full p-2 border rounded-md"
              required
            />
          </div>
        </div>

        {/* Input Tanggal */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Tanggal & Waktu</label>
          <input
            type="datetime-local"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            className="mt-1 w-full p-2 border rounded-md"
            required
          />
        </div>

        {/* Input Lokasi & Kategori */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Lokasi</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="mt-1 w-full p-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Kategori</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="mt-1 w-full p-2 border rounded-md"
              required
            />
          </div>
        </div>

        {/* Bagian Upload & Preview Gambar */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Gambar Event</label>
          
          {previewUrl && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">Preview Gambar Saat Ini:</p>
              <img 
                src={previewUrl} 
                alt="Preview Event" 
                className="w-full h-48 object-cover rounded-md border"
              />
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Tombol Aksi */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow"
          >
            Simpan Perubahan
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditEvent;