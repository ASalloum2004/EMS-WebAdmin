import { AuthProvider, ThemeProvider } from "./context";
import { AppRouter } from "./router";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ThemeProvider>
  );
}
