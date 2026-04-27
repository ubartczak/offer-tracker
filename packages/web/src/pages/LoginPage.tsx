import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { saveTokens } from "../lib/auth";
import { AuthResponse } from "../types/api";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post<AuthResponse>("/auth/login", { email, password });
      saveTokens(data.accessToken, data.refreshToken, data.user.email);
      navigate("/");
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      setError(status === 401 ? "Nieprawidłowy email lub hasło" : "Błąd serwera");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", fontFamily: "var(--font-sans)" }}>
      <nav style={{ background: "var(--brick)", padding: "14px 24px" }}>
        <span style={{ color: "var(--cream)", fontWeight: 500, fontSize: 15 }}>
          Job Assistant Manager
        </span>
      </nav>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 50px)" }}>
        <div style={{
          width: 360,
          background: "var(--linen)",
          borderRadius: 12,
          padding: "28px 24px 20px",
        }}>
          <p style={{ fontSize: 22, fontWeight: 500, color: "var(--espresso)", marginBottom: 2 }}>
            Zaloguj się
          </p>
          <p style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--walnut)", marginBottom: 20 }}>
            odkręć słoik
          </p>

          <form onSubmit={handleSubmit}>
            <Input
              label="email"
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="hasło"
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && (
              <p style={{ fontSize: 12, color: "var(--jam-burgundy)", marginBottom: 10 }}>{error}</p>
            )}

            <Button type="submit" loading={loading} style={{ width: "100%", marginTop: "20px" }}>
              Zaloguj się
            </Button>
          </form>

          <div style={{ marginTop: 14 }}>
            <Link
              to="/register"
              style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--brick)", textDecoration: "none", opacity: 0.8 }}
            >
              nie mam konta → zarejestruj się
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
