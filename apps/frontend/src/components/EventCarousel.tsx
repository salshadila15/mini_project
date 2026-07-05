import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Event } from '../types/event';

type EventCarouselProps = {
  // Menerima array event dari halaman utama
  events: (Event & { organizer: { name: string } })[];
};

function EventCarousel({ events }: EventCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  if (events.length > 0) {
    console.log("Kunci Properti Event:", Object.keys(events[0]));
    console.log("Isi Properti Gambar Event Pertama:", (events[0] as any).image || (events[0] as any).imageUrl || "Tidak ada properti gambar sama sekali");
  }
  console.log("Data Mentah Events dari Backend:", events);

  // Filter hanya mengambil 5 event teratas yang memiliki gambar Cloudinary
  const bannerEvents = events.filter((event) => event.image).slice(0, 5);

  console.log("Data Banner Events:", bannerEvents); // Debugging: Cek data bannerEvents

  useEffect(() => {
    if (bannerEvents.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bannerEvents.length);
    }, 5000); // Geser otomatis setiap 5 detik

    return () => clearInterval(interval);
  }, [bannerEvents.length]);

  if (bannerEvents.length === 0) return null;

  return (
    <div className="relative w-full h-[400px] overflow-hidden bg-slate-900 rounded-2xl shadow-sm">
      {/* Container Slider Utama */}
      <div
        className="w-full h-full flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {bannerEvents.map((event) => (
          // 🌟 PERBAIKAN DI SINI: Ditambahkan min-w-full agar ukuran per slide tidak menyusut/menciut
          <div key={event.id} className="w-full min-w-full h-full relative flex-shrink-0">
            <img
              src={event.image || 'https://via.placeholder.com/800x400?text=No+Image'}
              alt={event.name}
              className="w-full h-full object-cover opacity-50"
              onError={(e) => {
                // 🌟 PERBAIKAN PNG: Jika gambar broken link, otomatis ganti ke placeholder agar layout tidak kosong
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80';
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent p-8 text-white">
              <span className={`text-xs px-2.5 py-1 rounded-md font-semibold uppercase tracking-wider ${
                event.price === 0 ? 'bg-green-600' : 'bg-indigo-600'
              }`}>
                {event.category}
              </span>
              <h2 className="text-3xl font-bold mt-2 hover:underline">
                <Link to={`/event/${event.id}`}>{event.name}</Link>
              </h2>
              <p className="text-slate-200 mt-1 line-clamp-2 max-w-2xl text-sm">
                {event.description}
              </p>
              
              {/* 🌟 PENYESUAIAN HARGA GRATIS & LOKASI */}
              <div className="mt-2 flex items-center gap-4 text-xs font-medium">
                <p className="text-amber-400 flex items-center gap-1">
                  📍 {event.location}
                </p>
                <p className={event.price === 0 ? 'text-green-400 font-bold' : 'text-slate-300'}>
                  {event.price === 0 ? '🎁 Gratis' : `Rp ${event.price.toLocaleString('id-ID')}`}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigator Titik (Dots) */}
      {bannerEvents.length > 1 && (
        <div className="absolute bottom-4 right-4 flex space-x-2 z-10">
          {bannerEvents.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                currentIndex === index ? 'bg-white scale-125' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default EventCarousel;