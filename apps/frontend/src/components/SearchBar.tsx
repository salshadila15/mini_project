'use client'; // Wajib ada jika pakai Next.js

import { useState, useEffect } from 'react';

export default function EventSearch() {
  // 1. Tempat menyimpan kata kunci yang diketik user
  const [searchTerm, setSearchTerm] = useState("");
  
  // 2. Tempat menyimpan daftar event yang didapat dari database
  const [events, setEvents] = useState([]);

  // 3. Fungsi untuk mengambil data dari Backend
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Pastikan URL ini sesuai dengan port backend kamu (misal 8000)
        const response = await fetch(`http://localhost:8000/api/events?search=${searchTerm}`);
        const data = await response.json();
        setEvents(data); // Simpan hasil ke dalam state events
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      }
    };

    // 4. Logika Debounce: Tunggu 500ms diam baru panggil API
    const delayDebounceFn = setTimeout(() => {
      fetchEvents();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <div style={{ padding: '20px' }}>
      {/* Input Pencarian */}
      <input
        type="text"
        placeholder="Cari event seru (konser, lari, dsb)..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
      />

      {/* Daftar Event yang Muncul di Bawahnya */}
      <div style={{ marginTop: '20px' }}>
        {events.length > 0 ? (
          events.map((event: any) => (
            <div key={event.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
              <h3 style={{ margin: 0 }}>{event.name}</h3>
              <p style={{ color: '#666' }}>{event.location}</p>
              {/* Formatter Mata Uang IDR */}
              <p style={{ fontWeight: 'bold', color: '#0070f3' }}>
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(event.price)}
              </p>
            </div>
          ))
        ) : (
          <p>Tidak ada event ditemukan atau database kosong.</p>
        )}
      </div>
    </div>
  );
}

