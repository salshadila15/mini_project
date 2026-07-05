import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axiosInstance from '../../lib/http';
import { formatIdr, formatDate } from '../../lib/auth-storage';
import type { Event, EventRegistration, EventStats } from '../../types/event';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

function OrganizerDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  // const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    date: '',
    location: '',
    category: '',
    availableSeats: '',
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data } = await axiosInstance.get<{
        message: string;
        data: Event[];
      }>('/api/events/organizer/events');
      setEvents(data.data);
      if (data.data.length > 0) {
        setSelectedEvent(data.data[0]);
        loadEventDetails(data.data[0].id);
      }
    } catch {
      setError('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const loadEventDetails = async (eventId: number) => {
    try {
      const [regsRes, statsRes] = await Promise.all([
        axiosInstance.get<{
          message: string;
          data: EventRegistration[];
        }>(`/api/events/${eventId}/registrations`),
        axiosInstance.get<{
          message: string;
          data: EventStats;
        }>(`/api/events/${eventId}/stats`),
      ]);
      setRegistrations(regsRes.data.data);
      setStats(statsRes.data.data);
    } catch {
      setError('Failed to load event details');
    }
  };

  const handleSelectEvent = (event: Event) => {
    setSelectedEvent(event);
    loadEventDetails(event.id);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('price', String(Number(formData.price)));
      data.append('availableSeats', String(Number(formData.availableSeats)));
      data.append('date', new Date(formData.date).toISOString());
      data.append('location', formData.location);
      data.append('category', formData.category);

      if (imageFile) {
        data.append('image', imageFile);
      }

      await axiosInstance.post('/api/events', data);
      setFormData({
        name: '',
        description: '',
        price: '',
        date: '',
        location: '',
        category: '',
        availableSeats: '',
      });

      if(typeof setImageFile === 'function') {
        setImageFile(null);
      }

      setShowCreateForm(false);
      await loadEvents();
    } catch (err: unknown) {
      const message =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'message' in err.response.data &&
        typeof err.response.data.message === 'string'
          ? err.response.data.message
          : 'Failed to create event';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus event ini?')) {
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await axiosInstance.delete(`/api/events/${eventId}`);
      await loadEvents();
      setSelectedEvent(null);
      setRegistrations([]);
      setStats(null);
    } catch {
      setError('Failed to delete event');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.role !== 'ORGANIZER') {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700">
        Anda tidak memiliki akses ke halaman ini.
      </div>
    );
  }

  const chartData = stats
    ? Object.entries(stats.dailyStats)
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .map(([date, data]) => ({
          date,
          revenue: data.revenue,
          attendees: data.attendees,
          registrations: data.registrations,
        }))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Dashboard Organizer
          </h1>
          <p className="mt-2 text-slate-600">
            Kelola event dan lihat statistik penjualan tiket.
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          {showCreateForm ? 'Batal' : '+ Buat Event'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showCreateForm && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Buat Event Baru
          </h2>
          <form
            onSubmit={handleCreateEvent}
            className="mt-4 grid gap-4 sm:grid-cols-2"
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Nama Event
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Harga (IDR)
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Tanggal
              </label>
              <input
                type="datetime-local"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Lokasi
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Kategori
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                required
              >
                <option value="">Pilih kategori</option>
                <option value="musik">Musik</option>
                <option value="olahraga">Olahraga</option>
                <option value="teknologi">Teknologi</option>
                <option value="seni">Seni</option>
                <option value="bisnis">Bisnis</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Kursi Tersedia
              </label>
              <input
                type="number"
                value={formData.availableSeats}
                onChange={(e) =>
                  setFormData({ ...formData, availableSeats: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Deskripsi
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                rows={4}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Upload Gambar
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImageFile(file);
                  }
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {isLoading ? 'Menyimpan...' : 'Buat Event'}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Event Saya</h2>
            {isLoading && !events.length ? (
              <p className="mt-3 text-sm text-slate-500">Memuat...</p>
            ) : events.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Belum ada event.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {events.map((event) => (
                  <li
                    key={event.id}
                    onClick={() => handleSelectEvent(event)}
                    className={[
                      'cursor-pointer rounded-lg p-3 transition-colors',
                      selectedEvent?.id === event.id
                        ? 'border border-indigo-500 bg-indigo-50'
                        : 'border border-slate-100 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    <p className="text-sm font-medium text-slate-900">
                      {event.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(event.date)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="lg:col-span-2">
          {selectedEvent ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {selectedEvent.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {selectedEvent.location}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                  className="rounded-lg bg-red-100 px-3 py-1 text-sm text-red-700 hover:bg-red-200"
                >
                  Hapus
                </button>
              </div>

              <dl className="space-y-3 border-t border-slate-100 pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-600">Tanggal</dt>
                  <dd className="font-medium text-slate-900">
                    {formatDate(selectedEvent.date)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600">Harga</dt>
                  <dd className="font-medium text-slate-900">
                    {formatIdr(selectedEvent.price)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600">Kursi Tersedia</dt>
                  <dd className="font-medium text-slate-900">
                    {selectedEvent.availableSeats}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600">Kategori</dt>
                  <dd className="font-medium text-slate-900">
                    {selectedEvent.category}
                  </dd>
                </div>
              </dl>

              <p className="mt-4 text-sm text-slate-600">
                {selectedEvent.description}
              </p>
            </section>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6">
              <p className="text-center text-sm text-slate-500">
                Pilih event untuk melihat detail
              </p>
            </div>
          )}
        </div>
      </div>

      {selectedEvent && (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Statistik Penjualan
            </h2>
            {stats ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-4">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-600">Total Pendaftar</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {stats.totalAttendees}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-600">Total Registrasi</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {stats.totalRegistrations}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-600">Total Pendapatan</p>
                  <p className="mt-1 text-2xl font-bold text-indigo-700">
                    {formatIdr(stats.totalRevenue)}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs text-slate-600">Rata-rata Harga</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {formatIdr(stats.averagePrice)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">Memuat statistik...</p>
            )}
          </section>

          {chartData.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Grafik Penjualan & Pendaftar
              </h2>
              <div className="mt-4 h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#4f46e5"
                      name="Pendapatan (IDR)"
                    />
                    <Line
                      type="monotone"
                      dataKey="attendees"
                      stroke="#06b6d4"
                      name="Pendaftar"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Daftar Registrasi
            </h2>
            {registrations.length > 0 ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-3 text-left font-medium text-slate-700">
                        Nama Peserta
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">
                        Jumlah
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">
                        Total
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-slate-700">
                        Tanggal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((reg) => (
                      <tr
                        key={reg.id}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 text-slate-900">
                          {reg.user.name}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {reg.user.email}
                        </td>
                        <td className="px-4 py-3 text-slate-900">
                          {reg.quantity}
                        </td>
                        <td className="px-4 py-3 font-medium text-indigo-700">
                          {formatIdr(reg.totalPrice - reg.pointsUsed)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatDate(reg.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                Belum ada registrasi untuk event ini.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default OrganizerDashboard;
