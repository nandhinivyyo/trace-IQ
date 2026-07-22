import { useLocation } from "react-router-dom";
import {
  Menu,
  Search,
  Bell,
  Moon,
  Sun,
  LogOut,
  Settings,
  UserRound,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { allNavItems } from "@/config/navigation";
import { useTheme } from "@/components/theme/theme-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Navbar({ collapsed, onToggleSidebar, onOpenMobileSidebar }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const current = allNavItems.find((item) =>
    item.path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(item.path),
  );

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)]/90 px-4 backdrop-blur-md">
      <button
        onClick={onOpenMobileSidebar}
        className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] md:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-[18px] w-[18px]" />
      </button>

      <button
        onClick={onToggleSidebar}
        className="hidden h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)] md:flex cursor-pointer transition-colors"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <PanelLeftOpen className="h-[18px] w-[18px]" />
        ) : (
          <PanelLeftClose className="h-[18px] w-[18px]" />
        )}
      </button>

      {/* Breadcrumb */}
      <div className="flex min-w-0 items-center gap-1.5 text-body-sm">
        <span className="text-[var(--color-text-tertiary)]">
          CodeInsight AI
        </span>
        {current && (
          <>
            <span className="text-[var(--color-text-disabled)]">/</span>
            <span className="truncate font-medium text-[var(--color-text-primary)]">
              {current.label}
            </span>
          </>
        )}
      </div>

      <div className="flex-1" />

      {/* Global search */}
      <button
        className="hidden items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 text-caption text-[var(--color-text-tertiary)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-secondary)] sm:flex sm:w-56 lg:w-72"
        aria-label="Search"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">Search or ask AI…</span>
        <span className="kbd">⌘K</span>
      </button>

      <button
        className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] sm:hidden"
        aria-label="Search"
      >
        <Search className="h-[17px] w-[17px]" />
      </button>

      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <button
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Moon className="h-[17px] w-[17px]" />
            ) : (
              <Sun className="h-[17px] w-[17px]" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>Toggle theme</TooltipContent>
      </Tooltip>

      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <button
            className="relative flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]"
            aria-label="Notifications"
          >
            <Bell className="h-[17px] w-[17px]" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Notifications</TooltipContent>
      </Tooltip>

      <div className="mx-1 h-5 w-px bg-[var(--color-border-subtle)]" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full p-0">
            <Avatar>
              <AvatarFallback>AR</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="normal-case tracking-normal">
            <div className="flex flex-col gap-0.5">
              <span className="text-body-sm font-medium text-[var(--color-text-primary)]">
                Arjun Rao
              </span>
              <span className="text-caption font-normal text-[var(--color-text-tertiary)]">
                arjun@codeinsight.ai
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <UserRound /> Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings /> Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-[var(--color-danger)] focus:bg-[var(--color-danger)]/10 [&_svg]:text-[var(--color-danger)]">
            <LogOut /> Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
