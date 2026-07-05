import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axiosInstance from '../lib/http';
import { useAuth } from '../contexts/AuthContext';
import type { ReferralValidationResponse } from '../types/auth';

const registerSchema = Yup.object({
  name: Yup.string().required('Nama wajib diisi'),
  email: Yup.string().email('Email tidak valid').required('Email wajib diisi'),
  password: Yup.string()
    .min(6, 'Password minimal 6 karakter')
    .required('Password wajib diisi'),
  role: Yup.mixed<'CUSTOMER' | 'ORGANIZER'>()
    .oneOf(['CUSTOMER', 'ORGANIZER'])
    .required('Role wajib dipilih'),
  referralCode: Yup.string().optional(),
});

function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [referralStatus, setReferralStatus] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/profile" replace />;
  }

  const validateReferralCode = async (code: string) => {
    if (!code.trim()) {
      setReferralStatus('');
      return;
    }

    try {
      const { data } = await axiosInstance.get<ReferralValidationResponse>(
        `/api/auth/referral/validate/${encodeURIComponent(code.trim())}`
      );
      setReferralStatus(`Kode valid — referrer: ${data.data.name}`);
    } catch {
      setReferralStatus('Kode referral tidak ditemukan');
    }
  };

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Buat Akun Baru</h1>
      <p className="mt-2 text-sm text-slate-600">
        Sudah punya akun?{' '}
        <Link to="/login" className="font-medium text-indigo-600 hover:underline">
          Login di sini
        </Link>
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <Formik
        initialValues={{
          name: '',
          email: '',
          password: '',
          role: 'CUSTOMER' as 'CUSTOMER' | 'ORGANIZER',
          referralCode: '',
        }}
        validationSchema={registerSchema}
        onSubmit={async (values, { setSubmitting }) => {
          setError('');
          setSuccess('');

          try {
            const payload = {
              name: values.name,
              email: values.email,
              password: values.password,
              role: values.role,
              ...(values.referralCode.trim() && {
                referralCode: values.referralCode.trim(),
              }),
            };

            const result = await register(payload);

            const couponMessage = result.welcomeCoupon
              ? ` Kamu mendapat kupon diskon ${result.welcomeCoupon.percent}% (berlaku 3 bulan).`
              : '';

            setSuccess(
              `Registrasi berhasil. Kode referral kamu: ${result.referralCode}.${couponMessage} Silakan login.`
            );

            setTimeout(() => navigate('/login'), 1800);
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
                : 'Registrasi gagal. Periksa data yang diinput.';
            setError(message);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting, values, setFieldValue }) => (
          <Form className="mt-6 space-y-4">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
                Nama Lengkap
              </label>
              <Field
                id="name"
                name="name"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <ErrorMessage name="name" component="p" className="mt-1 text-sm text-red-600" />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <Field
                id="email"
                name="email"
                type="email"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <ErrorMessage name="email" component="p" className="mt-1 text-sm text-red-600" />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                Password
              </label>
              <Field
                id="password"
                name="password"
                type="password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <ErrorMessage name="password" component="p" className="mt-1 text-sm text-red-600" />
            </div>

            <div>
              <span className="mb-2 block text-sm font-medium text-slate-700">Daftar Sebagai</span>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { value: 'CUSTOMER', label: 'Customer', desc: 'Beli tiket event' },
                  { value: 'ORGANIZER', label: 'Organizer', desc: 'Kelola dan jual event' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={[
                      'cursor-pointer rounded-xl border p-4 transition-colors',
                      values.role === option.value
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300',
                    ].join(' ')}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={option.value}
                      checked={values.role === option.value}
                      onChange={() => setFieldValue('role', option.value)}
                      className="sr-only"
                    />
                    <span className="block font-medium text-slate-900">{option.label}</span>
                    <span className="mt-1 block text-sm text-slate-600">{option.desc}</span>
                  </label>
                ))}
              </div>
              <ErrorMessage name="role" component="p" className="mt-1 text-sm text-red-600" />
            </div>

            <div>
              <label htmlFor="referralCode" className="mb-1 block text-sm font-medium text-slate-700">
                Kode Referral (Opsional)
              </label>
              <Field
                id="referralCode"
                name="referralCode"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 uppercase outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                placeholder="Contoh: A1B2C3D4"
                onBlur={(event: React.FocusEvent<HTMLInputElement>) => {
                  void validateReferralCode(event.target.value);
                }}
              />
              {referralStatus && (
                <p
                  className={[
                    'mt-1 text-sm',
                    referralStatus.includes('valid') ? 'text-green-600' : 'text-amber-600',
                  ].join(' ')}
                >
                  {referralStatus}
                </p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                Gunakan kode referral teman untuk mendapat kupon diskon 10% (berlaku 3 bulan).
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Memproses...' : 'Daftar'}
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
}

export default Register;
