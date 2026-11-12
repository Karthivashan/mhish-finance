import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App';
import { AppProvider } from './context/AppContext';
import { GoogleDriveProvider, useGoogleDrive } from './context/GoogleDriveContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import GoogleLogin from './components/GoogleLogin';
import './styles/index.css';

function ThemedToaster() {
  const { theme } = useTheme();
  return <Toaster theme={theme} position="bottom-right" richColors closeButton toastOptions={{ style: { fontFamily: 'Manrope, sans-serif' } }} />;
}

function AuthenticatedApp() {
  const { user } = useGoogleDrive();
  if (!user) return <GoogleLogin />;

  return (
    <AppProvider>
      <ThemeProvider>
        <App />
        <ThemedToaster />
      </ThemeProvider>
    </AppProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <GoogleDriveProvider>
        <AuthenticatedApp />
      </GoogleDriveProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
