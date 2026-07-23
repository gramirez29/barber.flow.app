import { BrowserRouter } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { Router } from '@presentation/routes/Router';
import { ThemeProvider } from '@presentation/context/ThemeContext';
import { AuthProvider } from '@presentation/context/AuthContext';
import { NotificationProvider } from '@presentation/context/NotificationContext';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <CssBaseline />
            <Router />
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
