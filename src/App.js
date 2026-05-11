import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PortfolioListPage from './pages/PortfolioListPage';
import PortfolioDetailPage from './pages/PortfolioDetailPage';
import PortfolioFormPage from './pages/PortfolioFormPage';
import TemplateListPage from './pages/TemplateListPage';
import ProfilePage from './pages/ProfilePage';
import './App.css';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<PortfolioListPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/portfolio/new" element={<PortfolioFormPage />} />
                <Route path="/portfolio/:id" element={<PortfolioDetailPage />} />
                <Route path="/portfolio/:id/edit" element={<PortfolioFormPage />} />
                <Route path="/templates" element={<TemplateListPage />} />
                <Route path="/profile/:email" element={<ProfilePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
