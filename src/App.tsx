import { AuthProvider, ThemeProvider } from "./context";
import { PushNotificationsProvider } from "./features/notifications";
import { I18nProvider } from "./i18n";
import { AppRouter } from "./router";

export default function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <AuthProvider>
          <PushNotificationsProvider>
            <AppRouter />
          </PushNotificationsProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
