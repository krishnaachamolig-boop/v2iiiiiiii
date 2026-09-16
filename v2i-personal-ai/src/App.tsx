import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { AppShell } from "@/layouts/AppShell";
import Home from "@/pages/Home";
import Chat from "@/pages/Chat";
import Tasks from "@/pages/Tasks";
import Projects from "@/pages/Projects";
import Profile from "@/pages/Profile";
import Login from "@/pages/Login";
import { useAuthStore } from "@/lib/authStore";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

// HashRouter is used (not BrowserRouter) because Capacitor serves the app
// from a local file/asset scheme on Android where server-side path routing
// isn't available — hash routing works identically on web and native.

export default function App() {
  const { profile, loading, init } = useAuthStore();

  useEffect(() => {
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-slate-500">Loading V2i Personal AI…</div>
    );
  }

  if (!profile) {
    return (
      <ErrorBoundary>
        <HashRouter>
          <Login />
        </HashRouter>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Home />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
}
