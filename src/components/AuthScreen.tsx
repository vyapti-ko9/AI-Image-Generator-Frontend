import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (mode === "register" && password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (mode === "register" && name.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }

    try {
      setLoading(true);
      if (mode === "login") {
        await login(email.trim(), password);
      } else {
        await register(name.trim(), email.trim(), password);
        setMode("login");
        setName("");
        setPassword("");
        setConfirm("");
        setNotice("Registration successful. Please log in.");
      }
    } catch (err: unknown) {
      const message =
        err &&
          typeof err === "object" &&
          "response" in err &&
          err.response &&
          typeof err.response === "object" &&
          "data" in err.response &&
          err.response.data &&
          typeof err.response.data === "object" &&
          "message" in err.response.data
          ? String((err.response.data as { message?: string }).message)
          : mode === "login"
            ? "Login failed"
            : "Registration failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/12 bg-black/35 p-6 shadow-lg backdrop-blur">
        <h1 className="text-2xl font-semibold text-glow text-transparent bg-clip-text from-blue-200 via-cyan-200 to-purple-200">
          AI Image Generator
        </h1>
        <p className="text-sm text-black/90 mt-1 mb-6">Sign in or create an account to continue.</p>

        <div className="flex gap-2 rounded-xl bg-black/25 p-1 border border-white/10">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
              setNotice(null);
            }}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${mode === "login"
              ? "bg-black text-white shadow-sm"
              : "text-white/70 hover:text-white"
              }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null);
              setNotice(null);
            }}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${mode === "register"
              ? "bg-black text-white shadow-sm"
              : "text-white/70 hover:text-white"
              }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          {mode === "register" && (
            <div>
              <label htmlFor="auth-name" className="block text-xs font-medium text-white/80 mb-1.5">
                Name
              </label>
              <input
                id="auth-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white px-3 py-2.5 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="Your name"
                required
                minLength={2}
                disabled={loading}
              />
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-medium text-white/80 mb-1.5">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white px-3 py-2.5 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-xs font-medium text-white/80 mb-1.5">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white px-3 py-2.5 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="••••••"
              required
              minLength={6}
              disabled={loading}
            />
            {mode === "register" && (
              <p className="text-xs text-white/50 mt-1">At least 6 characters.</p>
            )}
          </div>

          {mode === "register" && (
            <div>
              <label htmlFor="auth-confirm" className="block text-xs font-medium text-white/80 mb-1.5">
                Confirm password
              </label>
              <input
                id="auth-confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white px-3 py-2.5 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="••••••"
                required
                minLength={6}
                disabled={loading}
              />
            </div>
          )}

          {error && (
            <div className="rounded-md border-l-3 border-red-600 bg-red-100 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}
          {notice && (
            <div className="rounded-md border-l-3 border-emerald-700 bg-emerald-500/15 px-3 py-2 text-sm text-emerald-900">
              {notice}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-black px-4 py-2.5 rounded-xl text-white hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-white" />
                Please wait…
              </span>
            ) : mode === "login" ? (
              "Log in"
            ) : (
              "Create account"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
