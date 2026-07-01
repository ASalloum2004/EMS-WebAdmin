import { AuthProvider, ThemeProvider } from "./context";
import { I18nProvider } from "./i18n";
import { AppRouter } from "./router";

export default function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
