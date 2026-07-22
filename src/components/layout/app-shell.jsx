import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close the mobile drawer on every navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <TooltipProvider>
      <div className="flex h-dvh w-full overflow-hidden bg-[var(--color-canvas)] text-[var(--color-text-primary)]">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar
            collapsed={collapsed}
            onToggleSidebar={() => setCollapsed((c) => !c)}
            onOpenMobileSidebar={() => setMobileOpen(true)}
          />
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
