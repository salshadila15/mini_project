import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const loginSchema = Yup.object({
  email: Yup.string().email('Email tidak valid').required('Email wajib diisi'),
  password: Yup.string()
    .min(6, 'Password minimal 6 karakter')
    .required('Password wajib diisi'),
});

function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');

  const from =
    (location.state as { from?: string } | null)?.from ??
    (user?.role === 'ORGANIZER' ? '/organizer/dashboard' : '/profile');

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Masuk ke Akun</h1>
      <p className="mt-2 text-sm text-slate-600">
        Belum punya akun?{' '}
        <Link to="/register" className="font-medium text-indigo-600 hover:underline">
          Daftar di sini
        </Link>
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Formik
        initialValues={{ email: '', password: '' }}
        validationSchema={loginSchema}
        onSubmit={async (values, { setSubmitting }) => {
          setError('');
          try {
            await login(values.email, values.password);
            navigate(from, { replace: true });
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
                : 'Login gagal. Periksa email dan password.';
            setError(message);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <Field
                id="email"
                name="email"
                type="email"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                placeholder="nama@email.com"
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
                placeholder="Minimal 6 karakter"
              />
              <ErrorMessage name="password" component="p" className="mt-1 text-sm text-red-600" />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Memproses...' : 'Login'}
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
}

export default Login;
