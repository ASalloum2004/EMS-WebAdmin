import { AuthProvider } from "./context";
import { AppRouter } from "./router";

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
