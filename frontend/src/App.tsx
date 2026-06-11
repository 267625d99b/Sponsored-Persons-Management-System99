import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp, theme as antTheme } from 'antd';
import arEG from 'antd/locale/ar_EG';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingScreen from './components/LoadingScreen';
import Dashboard from './pages/Dashboard';
import SponsoredList from './pages/SponsoredList';
import SponsoredDetail from './pages/SponsoredDetail';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Layout from './components/Layout';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { admin, loading } = useAuth();
  
  if (loading) return <LoadingScreen message="جاري التحقق من الصلاحيات..." />;
  
  const token = localStorage.getItem('token');
  if (!token || !admin) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// السوبر أدمن يُوجَّه مباشرة للإعدادات (إدارة المستخدمين)
const SuperAdminRedirect = ({ children }: { children: React.ReactNode }) => {
  const { admin } = useAuth();
  if (admin?.role === 'superadmin') {
    return <Navigate to="/settings" replace />;
  }
  return <>{children}</>;
};

// حماية الصفحات التي لا يجب أن يدخلها السوبر أدمن
const TenantRoute = ({ children }: { children: React.ReactNode }) => {
  const { admin } = useAuth();
  if (admin?.role === 'superadmin') {
    return <Navigate to="/settings" replace />;
  }
  return <>{children}</>;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="جاري تحميل النظام..." />;
  }
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<SuperAdminRedirect><PageWrapper><Dashboard /></PageWrapper></SuperAdminRedirect>} />
          <Route path="sponsored" element={<TenantRoute><PageWrapper><SponsoredList /></PageWrapper></TenantRoute>} />
          <Route path="sponsored/:id" element={<TenantRoute><PageWrapper><SponsoredDetail /></PageWrapper></TenantRoute>} />
          <Route path="reports" element={<TenantRoute><PageWrapper><Reports /></PageWrapper></TenantRoute>} />
          <Route path="settings" element={<PageWrapper><Settings /></PageWrapper>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};


const AppContent = () => {
  const { theme } = useTheme();
  
  return (
    <ConfigProvider
      direction="rtl"
      locale={arEG}
      theme={{
        algorithm: theme === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#3b82f6',
          borderRadius: 8,
          fontFamily: 'Tajawal, sans-serif',
        },
      }}
    >
      <AntApp>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AnimatedRoutes />
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <SettingsProvider>
            <AppContent />
          </SettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
