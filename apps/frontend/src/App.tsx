import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import EventDetail from './pages/EventDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import OrganizerDashboard from './pages/organizer/Dashboard';
import EditEvent from './pages/EditEvent';
import AdminVerificationPage from './pages/AdminVerificationPage';
import PaymentPage from './pages/PaymentPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/event/:id" element={<EventDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/transactions/:id" element={<PaymentPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['ORGANIZER']} />}>
          <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
          <Route path="/organizer/event/:id/edit" element={<EditEvent />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['ORGANIZER']} />}>
          <Route path="/admin/verification" element={<AdminVerificationPage />} />
        </Route>
      </Routes>
    </Layout>
  );
}

export default App;
