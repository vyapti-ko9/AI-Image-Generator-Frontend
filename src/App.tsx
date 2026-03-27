import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AuthScreen from "./components/AuthScreen";
import { useAuth } from "./context/AuthContext";
import { api } from "./lib/api";

type HistoryItem = {
  _id?: string;
  prompt: string;
  image: string;
  createdAt?: string;
};

export default function App() {
  const { user, ready, logout } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const trimmedPrompt = useMemo(() => prompt.trim(), [prompt]);
  const userInitial = useMemo(
    () => user?.name?.trim().charAt(0).toUpperCase() || "U",
    [user?.name]
  );
  const promptExamples = [
    "make a futuristic city",
    "cyberpunk street at night, neon lights",
    "a calm mountain lake during sunset",
    "an astronaut working in a space greenhouse",
  ];

  const generateImage = async () => {
    if (!trimmedPrompt) return;

    try {
      setLoading(true);
      setError(null);

      const res = await api.post<{ image: string }>("/generate", {
        prompt: trimmedPrompt,
      });
      setImage(res.data.image);
      fetchHistory();
    } catch (err) {
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
          : "Failed to generate image";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const res = await api.get<HistoryItem[]>("/history");
      setHistory(res.data);
    } catch {
      setError("Failed to load history");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchHistory();
  }, [user, fetchHistory]);

  useEffect(() => {
    const locked = !!(modalImage || historyOpen || profileOpen);
    document.body.style.overflow = locked ? "hidden" : "";

    if (!locked) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (modalImage) setModalImage(null);
      else if (historyOpen) setHistoryOpen(false);
      else if (profileOpen) setProfileOpen(false);
      else setMenuOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [modalImage, historyOpen, profileOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", onMouseDown);
    return () => window.removeEventListener("mousedown", onMouseDown);
  }, [menuOpen]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-white/90">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-glow text-transparent bg-clip-text from-blue-200 via-cyan-200 to-purple-200">
              AI Image Generator
            </h1>
            <p className="text-sm md:text-base text-black/90 mt-2 max-w-2xl">
              Describe what you want and generate an image in seconds.
            </p>
          </div>

          <div className="relative flex items-center gap-2" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((s) => !s)}
              className="group inline-flex items-center gap-2.5 rounded-full border border-white/12 bg-black/15 pl-2 pr-3 py-1.5 shadow-sm hover:bg-black/18 transition-colors"
              aria-label="Open account menu"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-semibold ring-2 ring-white/15">
                {userInitial}
              </span>
              <span className="max-w-40 text-black truncate text-sm font-medium" title={`${user.name} (${user.email})`}>
                {user.name}
              </span>
              <svg className="h-4 w-4 text-black opacity-70 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 z-30 w-[min(16rem,calc(100vw-1.5rem))] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-white/12 bg-white/90 backdrop-blur-xl shadow-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10 ">
                  <p className="text-[11px] tracking-wide text-black/55">Signed in</p>
                  <p className="text-sm font-semibold text-black mt-0.5 truncate">{user.name}</p>
                  <p className="text-xs text-black/60 truncate">{user.email}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(true);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-sm text-black/90 hover:bg-black/10 transition"
                >
                  <svg className="h-4 w-4 text-black/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A9 9 0 1118.88 17.8M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHistoryOpen(true);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between gap-2.5 text-left px-4 py-2.5 text-sm text-black/90 hover:bg-black/10 transition"
                >
                  <span className="inline-flex items-center gap-2.5">
                    <svg className="h-4 w-4 text-black/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Gallery
                  </span>
                  <span className="text-xs text-black/60">{history.length}</span>
                </button>

                <button
                  type="button"
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 border-t border-black/10 text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/15 transition"
                >
                  <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H9m4 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
                  </svg>
                  Log out
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <section className="bg-black/35 border border-white/12 rounded-2xl p-5 shadow-sm backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-blue-300" />
              <h2 className="text-lg font-medium text-white">Prompt</h2>
            </div>

            <div className="mt-4 flex flex-col gap-3">

              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-white/70">Examples:</span>
                {promptExamples.map((ex) => (
                  <button
                    type="button"
                    key={ex}
                    disabled={loading}
                    onClick={() => setPrompt(ex)}
                    className="px-2.5 py-1 rounded-full border border-white/12 bg-white/6 hover:bg-white/10 transition-colors text-xs text-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {ex}
                  </button>
                ))}
              </div>

              <div className="rounded-4xl border border-white/15 bg-white p-2 shadow-sm focus-within:ring-1 focus-within:ring-black-100">
                <div className="flex items-end gap-2">
                  <input
                    className="w-full bg-transparent px-2 py-2 text-black placeholder:text-gray-400 focus:outline-none"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. make a futuristic city"
                    disabled={loading}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      if (loading || !trimmedPrompt) return;
                      generateImage();
                    }}
                  />
                  <button
                    type="button"
                    onClick={generateImage}
                    disabled={loading || !trimmedPrompt}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-4xl bg-black text-white hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    aria-label={loading ? "Generating image" : "Generate image"}
                  >
                    {loading ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-white" />
                    ) : (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 11l18-8-8 18-2-8-8-2z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-300 bg-red-100 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>
          </section>

          <section className="bg-black/35 border border-white/12 rounded-2xl p-5 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-purple-200" />
                <h2 className="text-lg font-medium text-white">Result</h2>
              </div>
              {image && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setModalImage(image)}
                    className="text-sm text-white/90 hover:text-white underline underline-offset-4"
                  >
                    View
                  </button>
                  <a
                    href={image}
                    download="ai-image.png"
                    className="text-sm bg-blue-700/90 rounded-md p-1 text-white-900/80 hover:text-gray-200"
                  >
                    Download
                  </a>
                </div>
              )}
            </div>

            <div className="mt-4">
              {image ? (
                <div className="rounded-xl bg-black/35 border border-white/12 p-3">
                  <img
                    src={image}
                    className="mx-auto rounded-lg shadow-lg w-full max-w-md"
                    alt="Generated"
                    loading="lazy"
                  />
                </div>
              ) : loading ? (
                <div className="rounded-xl bg-black/35 border border-white/12 p-4">
                  <div className="animate-pulse aspect-video rounded-lg bg-white/6" />
                  <div className="mt-3 h-3 rounded bg-white/6 w-2/3" />
                  <div className="mt-2 h-3 rounded bg-white/6 w-1/2" />
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/15 bg-black/20 p-10 text-center">
                  <p className="text-white/80">Your generated image will appear here.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {historyOpen && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/65 backdrop-blur-[2px] transition-opacity"
            onClick={() => setHistoryOpen(false)}
            aria-label="Close gallery"
          />

          <aside
            className="relative z-10 flex h-full w-full max-w-lg flex-col border-l border-white/12 bg-white/70 shadow-2xl shadow-black/50 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-black/10 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-black/90">Gallery</h2>
                <p className="text-xs text-black/55 mt-0.5">
                  Past generations from this session
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="rounded-xl border border-black/12 bg-white/5 p-2 text-black/90 transition hover:bg-white/10"
                aria-label="Close"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {historyLoading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-black/70">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black/90" />
                  Loading…
                </div>
              ) : history.length ? (
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {history.map((item) => (
                    <button
                      key={item._id ?? item.image}
                      type="button"
                      onClick={() => {
                        setImage(item.image);
                        setModalImage(item.image);
                        setHistoryOpen(false);
                      }}
                      className="group text-left rounded-xl border border-black/10 overflow-hidden transition hover:border-black/20 hover:shadow-lg hover:shadow-black/20"
                    >
                      <div className="aspect-square bg-black/30">
                        <img
                          src={item.image}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          alt={item.prompt}
                          loading="lazy"
                        />
                      </div>
                      <div className="px-2.5 py-2">
                        <p className="text-xs leading-snug text-black/85 line-clamp-2">
                          {item.prompt}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/20 bg-black/30 px-6 py-16 text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-black/5 ring-1 ring-black/10">
                    <svg
                      className="h-7 w-7 text-black/40"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-white/90">No images yet</p>
                  <p className="mt-1 max-w-60 text-xs text-white/55">
                    Generate something — it will show up here automatically.
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {modalImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <button
            type="button"
            className="absolute inset-0 bg-black/75"
            onClick={() => setModalImage(null)}
            aria-label="Close modal"
          />

          <div
            className="relative z-10 w-full max-w-6xl rounded-2xl bg-white border border-white/12 backdrop-blur shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 bg-black/20">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-black/95 truncate">
                  Preview
                </div>
                <div className="text-xs text-black/65">
                  Click outside or press Esc to close
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={modalImage}
                  download="ai-image.png"
                  className="inline-flex text-white items-center gap-2 bg-blue-600 rounded-xl hover:bg-blue-600/90 px-3 py-2 text-sm font-medium"
                >
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => setModalImage(null)}
                  className="   px-3 py-2 text-sm text-white underline underline-offset-4"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="bg-black/15">
              <div className="p-3 sm:p-4">
                <div className="rounded-xl overflow-hidden border border-white/10 bg-black/25">
                  <img
                    src={modalImage}
                    alt="Generated"
                    className="block w-full max-h-[80vh] object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/75"
            onClick={() => setProfileOpen(false)}
            aria-label="Close profile"
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-black/12 bg-white/70 backdrop-blur p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-black border-b border-black/30">Profile</h3>
            <div className="mt-4 space-y-2 text-sm">
              <p className="text-black/75">Signed in as</p>
              <p className="text-black font-medium break-all">{user.name}</p>
              <p className="text-black/65 break-all">{user.email}</p>
              <p className="text-black/75 pt-2">Generated images</p>
              <p className="text-black font-medium">{history.length}</p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className="rounded-xl border border-black/12 bg-black/5 hover:bg-black/10 px-3 py-2 text-sm text-black/90"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}