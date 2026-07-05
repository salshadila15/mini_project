import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../lib/http';
import { formatDate, formatIdr } from '../lib/auth-storage';
import type { PointsHistoryResponse } from '../types/auth';

function Profile() {
  const { user, refreshProfile } = useAuth();
  const [pointsHistory, setPointsHistory] = useState<PointsHistoryResponse['data'] | null>(
    null
  );
  const [previewPrice, setPreviewPrice] = useState('300000');
  const [pointsToUse, setPointsToUse] = useState('0');
  const [previewResult, setPreviewResult] = useState<{
    ticketPrice: number;
    couponDiscount: number;
    priceAfterCoupon: number;
    pointsUsed: number;
    finalPrice: number;
    availablePoints: number;
  } | null>(null);
  const [previewError, setPreviewError] = useState('');

  useEffect(() => {
    const loadPoints = async () => {
      const { data } = await axiosInstance.get<PointsHistoryResponse>('/api/auth/points');
      setPointsHistory(data.data);
    };

    void loadPoints();
  }, []);

  const handlePreviewCheckout = async () => {
    setPreviewError('');
    setPreviewResult(null);

    try {
      const ticketPrice = Number(previewPrice);
      const points = Number(pointsToUse);
      const selectedCouponId = user?.activeCoupons[0]?.id;

      const { data } = await axiosInstance.post<{
        message: string;
        data: {
          ticketPrice: number;
          couponDiscount: number;
          priceAfterCoupon: number;
          pointsUsed: number;
          finalPrice: number;
          availablePoints: number;
        };
      }>('/api/auth/checkout/preview', {
        ticketPrice,
        pointsToUse: points,
        ...(selectedCouponId && { couponId: selectedCouponId }),
      });

      setPreviewResult(data.data);
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
          : 'Gagal menghitung preview checkout';
      setPreviewError(message);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Profil Saya</h1>
        <p className="mt-2 text-slate-600">Kelola informasi akun, poin, dan kupon diskon.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Informasi Akun</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
              <dt className="text-slate-500">Nama</dt>
              <dd className="font-medium text-slate-900">{user.name}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
              <dt className="text-slate-500">Email</dt>
              <dd className="font-medium text-slate-900">{user.email}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
              <dt className="text-slate-500">Role</dt>
              <dd className="font-medium text-slate-900">{user.role}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Kode Referral</dt>
              <dd className="font-mono font-semibold text-indigo-700">{user.referralCode}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-slate-500">
            Bagikan kode referral kamu. Setiap pengguna baru yang mendaftar dengan kode ini
            memberikan {formatIdr(10000)} poin (berlaku 3 bulan).
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Saldo Poin</h2>
          <p className="mt-3 text-3xl font-bold text-indigo-700">
            {formatIdr(user.pointsBalance)}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Poin dapat digunakan untuk mengurangi harga tiket event.
          </p>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-800">Riwayat Poin</h3>
            {pointsHistory && pointsHistory.entries.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {pointsHistory.entries.map((entry) => (
                  <li
                    key={entry.id}
                    className="rounded-lg border border-slate-100 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-900">
                        +{formatIdr(entry.amount)}
                      </span>
                      <span
                        className={entry.expired ? 'text-red-500' : 'text-green-600'}
                      >
                        {entry.expired ? 'Kedaluwarsa' : `Tersisa ${formatIdr(entry.available)}`}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Berlaku sampai {formatDate(entry.expiresAt)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-500">Belum ada riwayat poin.</p>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Kupon Aktif</h2>
        {user.activeCoupons.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {user.activeCoupons.map((coupon) => (
              <div
                key={coupon.id}
                className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"
              >
                <p className="text-lg font-bold text-emerald-800">Diskon {coupon.percent}%</p>
                <p className="mt-1 text-sm text-emerald-700">
                  Berlaku sampai {formatDate(coupon.expiresAt)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">Tidak ada kupon aktif saat ini.</p>
        )}
      </section>

      {user.role === 'CUSTOMER' && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Simulasi Checkout</h2>
          <p className="mt-2 text-sm text-slate-600">
            Preview harga tiket setelah kupon dan poin diterapkan.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Harga Tiket (IDR)
              </label>
              <input
                type="number"
                value={previewPrice}
                onChange={(event) => setPreviewPrice(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Poin Digunakan
              </label>
              <input
                type="number"
                value={pointsToUse}
                onChange={(event) => setPointsToUse(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handlePreviewCheckout()}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Hitung Preview
          </button>

          {previewError && (
            <p className="mt-3 text-sm text-red-600">{previewError}</p>
          )}

          {previewResult && (
            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm">
              <p>Harga tiket: {formatIdr(previewResult.ticketPrice)}</p>
              <p>Diskon kupon: -{formatIdr(previewResult.couponDiscount)}</p>
              <p>Poin digunakan: -{formatIdr(previewResult.pointsUsed)}</p>
              <p className="mt-2 text-lg font-bold text-indigo-700">
                Total bayar: {formatIdr(previewResult.finalPrice)}
              </p>
            </div>
          )}
        </section>
      )}

      <button
        type="button"
        onClick={() => void refreshProfile()}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        Refresh Profil
      </button>
    </div>
  );
}

export default Profile;
