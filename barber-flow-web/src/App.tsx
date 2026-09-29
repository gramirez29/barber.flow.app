import { BrowserRouter } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { Router } from '@presentation/routes/Router';
import { ThemeProvider } from '@presentation/context/ThemeContext';
import { AuthProvider } from '@presentation/context/AuthContext';
import { NotificationProvider } from '@presentation/context/NotificationContext';
import { AdminAccessProvider } from '@presentation/context/AdminAccessContext';
import { ConfirmDialogProvider } from '@presentation/context/ConfirmDialogContext';
import { NotificationInboxProvider } from '@presentation/context/NotificationInboxContext';
import { FeatureFlagsProvider } from '@presentation/context/FeatureFlagsContext';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AdminAccessProvider>
            <NotificationInboxProvider>
              <NotificationProvider>
                <ConfirmDialogProvider>
                  <FeatureFlagsProvider>
                    <CssBaseline />
                    <Router />
                  </FeatureFlagsProvider>
                </ConfirmDialogProvider>
              </NotificationProvider>
            </NotificationInboxProvider>
          </AdminAccessProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
