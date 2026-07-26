import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { PanelLeftClose, PanelLeftOpen, SquareTerminal } from "lucide-react";
import { navGroups, utilityNavItems } from "@/config/navigation";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen = false,
  onCloseMobile,
}) {
  return (
    <>
      {/* Mobile scrim */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "fixed z-50 flex h-dvh flex-col border-r border-[var(--color-border-subtle)] bg-[var(--color-surface)]",
          "md:relative md:z-0 md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          "transition-transform duration-200",
        )}
      >
        {/* Brand */}
        <div
          className={cn(
            "flex h-14 shrink-0 items-center gap-2.5 px-4",
            collapsed && "justify-center px-0",
          )}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-accent-subtle)] border border-[var(--color-accent-subtle-border)]">
            <SquareTerminal
              className="h-4 w-4 text-[var(--color-accent-text)]"
              strokeWidth={2}
            />
          </div>
          {!collapsed && (
            <span className="text-body-sm font-semibold tracking-tight text-[var(--color-text-primary)]">
              TraceIQ{" "}
              <span className="text-[var(--color-accent-text)]">AI</span>
            </span>
          )}
        </div>

        <Separator />

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3">
          {navGroups.map((group, i) => (
            <div key={group.label} className={cn(i > 0 && "mt-4")}>
              {!collapsed && (
                <p className="mb-1.5 px-2 text-micro font-medium uppercase tracking-wide text-[var(--color-text-tertiary)]">
                  {group.label}
                </p>
              )}
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <li key={item.path}>
                    <SidebarLink item={item} collapsed={collapsed} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <Separator />

        {/* Utility nav + collapse toggle */}
        <div className="flex flex-col gap-0.5 px-2.5 py-2.5">
          {utilityNavItems.map((item) => (
            <SidebarLink key={item.path} item={item} collapsed={collapsed} />
          ))}

          <button
            onClick={onToggle}
            className={cn(
              "mt-1 hidden items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-caption text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-secondary)] md:flex",
              collapsed && "justify-center px-0",
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-[15px] w-[15px]" />
            ) : (
              <>
                <PanelLeftClose className="h-[15px] w-[15px]" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </motion.aside>
    </>
  );
}

function SidebarLink({ item, collapsed }) {
  const Icon = item.icon;

  const link = (
    <NavLink
      to={item.path}
      end={item.path === "/"}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-body-sm transition-colors",
          collapsed && "justify-center px-0",
          isActive
            ? "bg-[var(--color-accent-subtle)] text-[var(--color-text-primary)]"
            : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]",
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="sidebar-active-indicator"
              className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-[var(--color-accent)]"
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            />
          )}
          <Icon
            className={cn(
              "h-[16px] w-[16px] shrink-0",
              isActive
                ? "text-[var(--color-accent-text)]"
                : "text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-secondary)]",
            )}
            strokeWidth={1.75}
          />

          {!collapsed && <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  );

  if (!collapsed) return link;

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}
