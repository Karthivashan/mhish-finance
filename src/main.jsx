import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App';
import { AppProvider } from './context/AppContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import './styles/index.css';

function ThemedToaster() {
  const { theme } = useTheme();
  return <Toaster theme={theme} position="bottom-right" richColors closeButton toastOptions={{ style: { fontFamily: 'Manrope, sans-serif' } }} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <ThemeProvider>
          <App />
          <ThemedToaster />
        </ThemeProvider>
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
