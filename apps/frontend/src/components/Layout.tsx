import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, logout } = useAuth();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive
        ? 'bg-indigo-600 text-white'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    ].join(' ');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="text-lg font-bold text-indigo-700">
            EventHub
          </Link>

          <nav className="flex flex-wrap items-center gap-2">
            <NavLink to="/" className={navLinkClass} end>
              Events
            </NavLink>

            {/* 🔒 MENU KHUSUS ORGANIZER (Dashboard & Verifikasi Pembayaran) */}
            {isAuthenticated && user?.role === 'ORGANIZER' && (
              <>
                <NavLink to="/organizer/dashboard" className={navLinkClass}>
                  Dashboard
                </NavLink>
                <NavLink to="/admin/verification" className={navLinkClass}>
                  Verifikasi Pembayaran
                </NavLink>
              </>
            )}

            {/* MENU AUTHENTICATION (Profile, Logout / Login, Register) */}
            {isAuthenticated ? (
              <>
                <NavLink to="/profile" className={navLinkClass}>
                  Profile
                </NavLink>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navLinkClass}>
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Register
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

export default Layout;