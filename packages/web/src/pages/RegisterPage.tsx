import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { saveTokens } from "../lib/auth";
import { AuthResponse } from "../types/api";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Hasła nie są identyczne");
      return;
    }
    if (password.length < 8) {
      setError("Hasło musi mieć min. 8 znaków");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<AuthResponse>("/auth/register", {
        email,
        password,
      });
      saveTokens(data.accessToken, data.refreshToken, data.user.email);
      navigate("/");
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response
        ?.status;
      setError(status === 409 ? "Ten email jest już zajęty" : "Błąd serwera");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--cream)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <nav style={{ background: "var(--brick)", padding: "14px 24px" }}>
        <span style={{ color: "var(--cream)", fontWeight: 500, fontSize: 15 }}>
          Job Assistant Manager
        </span>
      </nav>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 50px)",
        }}
      >
        <div
          style={{
            width: 360,
            background: "var(--linen)",
            borderRadius: 12,
            padding: "28px 24px 20px",
          }}
        >
          <p
            style={{
              fontSize: 22,
              fontWeight: 500,
              color: "var(--espresso)",
              marginBottom: 2,
            }}
          >
            Zarejestruj się
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
              label="hasło (min. 8 znaków)"
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              label="powtórz hasło"
              id="confirm"
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />

            {error && (
              <p
                style={{
                  fontSize: 12,
                  color: "var(--jam-burgundy)",
                  marginBottom: 10,
                }}
              >
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} style={{ width: "100%", marginTop: "20px" }}>
              Zarejestruj się
            </Button>
          </form>

          <div style={{ marginTop: 14 }}>
            <Link
              to="/login"
              style={{
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                color: "var(--brick)",
                textDecoration: "none",
                opacity: 0.8,
              }}
            >
              mam już konto → zaloguj się
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
