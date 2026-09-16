import { NavLink, Outlet } from "react-router-dom";
import clsx from "clsx";

const navItems = [
  { to: "/", label: "Home", icon: "🏠" },
  { to: "/chat", label: "AI", icon: "💬" },
  { to: "/tasks", label: "Tasks", icon: "✅" },
  { to: "/projects", label: "Projects", icon: "📁" },
  { to: "/profile", label: "Profile", icon: "👤" },
];

export function AppShell() {
  return (
    <div className="mx-auto flex h-screen max-w-2xl flex-col">
      <main className="flex-1 overflow-y-auto px-4 pt-safe-top pb-2">
        <Outlet />
      </main>
      <nav className="safe-bottom border-t border-base-700 bg-base-900/90 backdrop-blur-md">
        <div className="grid grid-cols-5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                clsx(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px]",
                  isActive ? "text-neon-cyan" : "text-slate-500"
                )
              }
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
