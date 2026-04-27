import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import { getAccessToken } from "./lib/auth";
import { ThemeProvider } from "./contexts/ThemeContext";

function RequireAuth({ children }: { children: React.ReactNode }) {
  return getAccessToken() ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <DashboardPage />
              </RequireAuth>
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
