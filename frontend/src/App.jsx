import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import Layout from './components/Layout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import FilesPage from './pages/FilesPage.jsx';
import TrashPage from './pages/TrashPage.jsx';
import SharedPage from './pages/SharedPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import PublicSharePage from './pages/PublicSharePage.jsx';

function Private({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen grid place-items-center text-muted2">Loading…</div>;
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function Guest({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center text-muted2">Loading…</div>;
  if (isAuthenticated) return <Navigate to="/app" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Guest><LoginPage /></Guest>} />
      <Route path="/register" element={<Guest><RegisterPage /></Guest>} />
      <Route path="/share/:token" element={<PublicSharePage />} />
      <Route path="/app" element={<Private><Layout /></Private>}>
        <Route index element={<DashboardPage />} />
        <Route path="files" element={<FilesPage />} />
        <Route path="files/:folderId" element={<FilesPage />} />
        <Route path="trash" element={<TrashPage />} />
        <Route path="shared" element={<SharedPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}
