import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import App from './App.tsx'
import './globals.css'
import AuthProvider from './context/AuthContext.tsx';
import { QueryProvider } from './lib/react-query/QueryProvider.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx'; 

createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
      <QueryProvider>
        <AuthProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </AuthProvider>
      </QueryProvider>
    </BrowserRouter>,
)