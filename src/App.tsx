import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useThemeStore, useAuthStore } from './store';

// Auth Components
import { SignUp, SignIn, ProtectedRoute } from './components/auth';

// Layout
import { Layout } from './components/layout';

// Pages
import {
  ResponsiveHome,
  Search,
  StatusPage,
  Settings,
  ResponsiveChat,
  SettingsProfile,
  SettingsAppearance,
  SettingsPrivacy,
  RandomChat
} from './pages';

// Admin
import {
  AdminLogin,
  AdminLayout,
  Dashboard,
  Analytics,
  UserManagement,
  ChatManagement,
  StatusManagement,
  RandomChatManagement,
  AdminResetPassword
} from './admin';

function App() {
  const { applyTheme } = useThemeStore();
  const { refreshUser, isLoading } = useAuthStore();

  useEffect(() => {
    // Apply theme on mount
    applyTheme();

    // Refresh user session
    refreshUser();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme();
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-primary-500/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <img src="/favicon.svg" alt="K Chat" className="absolute inset-4 w-12 h-12" />
          </div>
          <h1 className="text-2xl font-bold text-primary-500 mt-4">K Chat</h1>
          <p className="text-gray-500 mt-2 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Main Pages */}
          <Route index element={<ResponsiveHome />} />
          <Route path="search" element={<Search />} />
          <Route path="status" element={<StatusPage />} />

          {/* Settings Routes */}
          <Route path="settings" element={<Settings />} />
          <Route path="settings/profile" element={<SettingsProfile />} />
          <Route path="settings/appearance" element={<SettingsAppearance />} />
          <Route path="settings/privacy" element={<SettingsPrivacy />} />

          {/* Chat Route (Nested) */}
          <Route path="chat/:chatId" element={<ResponsiveChat />} />

          {/* Random Chat Route */}
          <Route path="random-chat" element={<RandomChat />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/1234/admin" element={<AdminLogin />} />
        <Route path="/1234/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="chats" element={<ChatManagement />} />
          <Route path="statuses" element={<StatusManagement />} />
          <Route path="random-chats" element={<RandomChatManagement />} />
        </Route>

        <Route path="/1234/admin/reset-password" element={<AdminResetPassword />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
