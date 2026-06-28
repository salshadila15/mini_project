import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../lib/http';
import { useAuth } from '../contexts/AuthContext';
import { formatIdr, formatDate } from '../lib/auth-storage';
import ReviewSection from '../components/ReviewSection';
import type { Event, EventResponse } from '../types/event';
import type { UserProfile } from '../types/auth';

type EventDetailResponse = {
  message: string;
  data: Event & {
    organizer: { id: number; name: string; email: string };
  };
};

function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();

  const [event, setEvent] = useState<EventDetailResponse['data'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [registrationError, setRegistrationError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const [quantity, setQuantity] = useState<number>(1);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [selectedCouponId, setSelectedCouponId] = useState<number | null>(null);
  const [previewPrice, setPreviewPrice] = useState<{
    ticketPrice: number;
    couponDiscount: number;
    priceAfterCoupon: number;
    pointsUsed: number;
    finalPrice: number;
    availablePoints: number;
  } | null>(null);

  const eventId = Number(id);

  useEffect(() => {
    const loadEvent = async () => {
      setIsLoading(true);
      setError('');

      try {
        const { data } = await axiosInstance.get<EventDetailResponse>(
          `/api/events/${eventId}`
        );
        setEvent(data.data);
      } catch {
        setError('Event tidak ditemukan');
      } finally {
        setIsLoading(false);
      }
    };

    if (eventId) {
      void loadEvent();
    }
  }, [eventId]);

  const handlePreviewPrice = async () => {
    if (!user) {
      setRegistrationError('Silakan login untuk melihat preview harga');
      return;
    }

    try {
      setRegistrationError('');
      const ticketPrice = (event?.price || 0) * quantity;

      const { data } = await axiosInstance.post<EventResponse>(
        '/api/auth/checkout/preview',
        {
          ticketPrice,
          pointsToUse,
          ...(selectedCouponId && { couponId: selectedCouponId }),
        }
      );

      setPreviewPrice(data.data as any);
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
          : 'Gagal menghitung preview harga';
      setRegistrationError(message);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    if (!event) return;

    if (quantity > event.availableSeats) {
      setRegistrationError(`Hanya tersedia ${event.availableSeats} kursi`);
      return;
    }

    setIsRegistering(true);
    setRegistrationError('');

    try {
      await axiosInstance.post(`/api/events/${event.id}/register`, {
        quantity,
        pointsToUse,
        ...(selectedCouponId && { couponId: selectedCouponId }),
      });

      alert('Registrasi berhasil! Terima kasih telah mendaftar event ini.');
      await refreshProfile();
      navigate('/profile');
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
          : 'Registrasi gagal';
      setRegistrationError(message);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleEditRedirect = (id: number) => {
    navigate(`/organizer/event/${id}/edit`);
  };

  const handleBuyTicket = async () => {
    setIsRegistering(true);
    setRegistrationError('');

    try {
      const response = await axiosInstance.post(`/api/transactions`, {
        eventId: eventId,
        quantity: quantity,
        pointsToUse: pointsToUse,
        ...(selectedCouponId && { couponId: selectedCouponId }),
      });

      const transactionId = response.data.data.id;
      
      alert("Transaksi berhasil dibuat! Kamu akan diarahkan ke halaman pembayaran.");
      
      navigate(`/profile/transactions/${transactionId}`);
    } catch (error: any) {
      const message = error.response?.data?.message || "Gagal memproses transaksi.";
    setRegistrationError(message);
    alert(message);
  } finally {
    setIsRegistering(false);
};
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
          <p className="text-slate-600">Memuat detail event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="space-y-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          ← Kembali ke Home
        </button>
        <div className="rounded-lg bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-8">
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        ← Kembali
      </button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <div className="mb-2 inline-block rounded-lg bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
                {event.category}
              </div>
            </div>

            <img
              src={'http://localhost:8000/uploads/' + event.image}
              alt={event.name}
              className="mb-6 h-64 w-full rounded-lg object-cover"
            />

            <h1 className="text-3xl font-bold text-slate-900">{event.name}</h1>

            <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 text-sm text-slate-600">
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formatDate(event.date)}</span>
              </div>

              <div className="flex items-center gap-3">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{event.location}</span>
              </div>

              <div className="flex items-center gap-3">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{event.availableSeats} kursi tersedia</span>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Tentang Event</h2>
              <p className="whitespace-pre-wrap text-slate-600">{event.description}</p>
            </div>

            <div className="mt-6 rounded-lg bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">Organizer</h3>
              <p className="mt-1 text-sm text-slate-600">{event.organizer?.name}</p>
              <p className="text-xs text-slate-500">{event.organizer?.email}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sticky top-4">
            <div className="mb-4">
              <p className="text-xs text-slate-600">Harga per tiket</p>
              <p className="text-3xl font-bold text-indigo-700">{formatIdr(event.price)}</p>
            </div>

            {/* 🔄 BAGIAN TOMBOL DINAMIS YANG SUDAH DIPERBARUI */}
            {!user ? (
              <button
                onClick={() => navigate('/login', { state: { from: location.pathname } })}
                className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white hover:bg-indigo-700"
              >
                Login untuk Mendaftar
              </button>
            ) : (
              <div className="space-y-4">
                {user.role === 'ORGANIZER' && user.id === event.organizerId ? (
                  <div className="space-y-3">
                    <div className="rounded-lg bg-indigo-50 p-3 text-center text-sm font-medium text-indigo-800">
                      Anda adalah pengelola event ini.
                    </div>
                    <button
                      onClick={() => handleEditRedirect(event.id)}
                      className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 transition-colors"
                    >
                      🛠️ Edit Event
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Jumlah Tiket
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={event.availableSeats}
                        value={quantity}
                        onChange={(e) => {
                          setQuantity(Math.max(1, Number(e.target.value)));
                          setPreviewPrice(null);
                        }}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                      />
                    </div>

                    {user.activeCoupons && user.activeCoupons.length > 0 && (
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Gunakan Kupon
                        </label>
                        <select
                          value={selectedCouponId || ''}
                          onChange={(e) => {
                            setSelectedCouponId(e.target.value ? Number(e.target.value) : null);
                            setPreviewPrice(null);
                          }}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                        >
                          <option value="">Tidak pakai kupon</option>
                          {user.activeCoupons.map((coupon) => (
                            <option key={coupon.id} value={coupon.id}>
                              Diskon {coupon.percent}%
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {user.pointsBalance > 0 && (
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Gunakan Poin (Tersedia: {formatIdr(user.pointsBalance)})
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={user.pointsBalance}
                          value={pointsToUse}
                          onChange={(e) => {
                            setPointsToUse(Math.max(0, Number(e.target.value)));
                            setPreviewPrice(null);
                          }}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
                        />
                      </div>
                    )}

                    <button
                      onClick={() => void handlePreviewPrice()}
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Hitung Preview
                    </button>

                    {previewPrice && (
                      <div className="rounded-lg bg-slate-50 p-3 text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Harga tiket:</span>
                          <span className="font-medium">{formatIdr(previewPrice.ticketPrice)}</span>
                        </div>
                        {previewPrice.couponDiscount > 0 && (
                          <div className="flex justify-between text-emerald-600">
                            <span>Diskon kupon:</span>
                            <span>-{formatIdr(previewPrice.couponDiscount)}</span>
                          </div>
                        )}
                        {previewPrice.pointsUsed > 0 && (
                          <div className="flex justify-between text-emerald-600">
                            <span>Poin digunakan:</span>
                            <span>-{formatIdr(previewPrice.pointsUsed)}</span>
                          </div>
                        )}
                        <div className="border-t border-slate-200 pt-1 flex justify-between">
                          <span className="font-semibold text-slate-900">Total bayar:</span>
                          <span className="font-bold text-indigo-700">
                            {formatIdr(previewPrice.finalPrice)}
                          </span>
                        </div>
                      </div>
                    )}

                    {registrationError && (
                      <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        {registrationError}
                      </div>
                    )}

                    <button
                      onClick={() => void handleBuyTicket()}
                      disabled={isRegistering || quantity > event.availableSeats}
                      className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isRegistering ? 'Membeli...' : 'Beli Tiket'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <ReviewSection eventId={eventId} />
    </div>
  );
}

export default EventDetail;