import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../lib/http';
import { formatIdr, formatDate } from '../lib/auth-storage';
import type { Event } from '../types/event';

type EventsResponse = {
  message: string;
  data: {
    events: (Event & { organizer: { name: string } })[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
};

function Home() {
  const [events, setEvents] = useState<
    (Event & { organizer: { name: string } })[]
  >([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [page, setPage] = useState(1);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 10,
    totalPages: 0,
  });

  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Load filters
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [catsRes, locsRes] = await Promise.all([
          axiosInstance.get<{ message: string; data: string[] }>(
            '/api/events/filters/categories'
          ),
          axiosInstance.get<{ message: string; data: string[] }>(
            '/api/events/filters/locations'
          ),
        ]);
        setCategories(catsRes.data.data);
        setLocations(locsRes.data.data);
      } catch {
        // Silently fail, use empty filters
      }
    };

    void loadFilters();
  }, []);

  // Load events with debounce for search
  const loadEvents = async (
    searchVal: string,
    catVal: string,
    locVal: string,
    pageVal: number
  ) => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (searchVal) params.append('search', searchVal);
      if (catVal) params.append('category', catVal);
      if (locVal) params.append('location', locVal);
      params.append('page', String(pageVal));
      params.append('limit', '10');

      const { data } = await axiosInstance.get<EventsResponse>(
        `/api/events?${params.toString()}`
      );

      setEvents(data.data.events);
      setPagination(data.data.pagination);
    } catch {
      setError('Gagal memuat event');
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setPage(1);
      void loadEvents(search, category, location, 1);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search, category, location]);

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    void loadEvents(search, category, location, newPage);
    window.scrollTo(0, 0);
  };

  return (
    <div className="space-y-6 py-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">
          Jelajahi Event Seru
        </h1>
        <p className="mt-2 text-lg text-slate-600">
          Temukan dan daftarkan diri untuk event yang kamu minati
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Cari Event
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Cari nama event..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <svg
              className="absolute top-3 right-3 h-5 w-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Kategori
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Lokasi
            </label>
            <select
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Semua Lokasi</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
            <p className="text-slate-600">Memuat event...</p>
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <svg
            className="mx-auto mb-4 h-12 w-12 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 12a5 5 0 1110 0A5 5 0 017 12z"
            />
          </svg>
          <p className="text-slate-600">
            Event tidak ditemukan. Coba ubah filter pencarian kamu.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link key={event.id} to={`/event/${event.id}`}>
                <div className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-500 hover:shadow-md">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600">
                        {event.name}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {event.category}
                      </p>
                    </div>
                    <span className="ml-2 inline-block rounded-lg bg-indigo-100 px-2 py-1 text-sm font-medium text-indigo-700">
                      {formatIdr(event.price)}
                    </span>
                  </div>

                  <p className="mb-3 line-clamp-2 text-sm text-slate-600">
                    {event.description}
                  </p>

                  <div className="space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {formatDate(event.date)}
                    </div>
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {event.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {event.availableSeats} kursi tersedia
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-slate-500">
                    Organizer:{' '}
                    <span className="font-medium text-slate-700">
                      {event.organizer.name}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-sm text-slate-600">
                Halaman <span className="font-medium">{page}</span> dari{' '}
                <span className="font-medium">{pagination.totalPages}</span>
                <span className="ml-2 text-slate-500">
                  ({pagination.total} event total)
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ← Sebelumnya
                </button>

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === pagination.totalPages}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Selanjutnya →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Home;
