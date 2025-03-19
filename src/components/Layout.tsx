
import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Search, LogOut, User, Shield, Settings, FileText } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder with the same structure to prevent layout shift
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <div className="flex-1">{children}</div>
      </div>
    );
  }

  if (!user) {
    // Simplified layout for unauthenticated users
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-40 border-b backdrop-blur-xl bg-background/50">
          <div className="container flex h-16 items-center justify-between py-4">
            <Link to="/" className="flex items-center gap-2">
              <Shield className="h-6 w-6" />
              <span className="font-display text-xl font-semibold tracking-tight">
                SecureFiles
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  // Full layout for authenticated users
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b backdrop-blur-xl bg-background/50">
        <div className="container flex h-16 items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            <span className="font-display text-xl font-semibold tracking-tight">
              SecureFiles
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="relative w-full max-w-[200px] md:max-w-[300px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search files..."
                className="w-full rounded-full bg-background pl-8 pr-4 py-2 text-sm border border-border focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <ThemeToggle />
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar_url} alt={user.full_name || user.email} />
                <AvatarFallback>
                  {user.full_name
                    ? user.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                    : user.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline-block text-sm font-medium">
                {user.full_name || user.email}
              </span>
            </div>
          </div>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden md:flex w-[240px] flex-col border-r px-4 py-6">
          <nav className="grid gap-2">
            <Link
              to="/"
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                location.pathname === "/"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              <FileText className="h-4 w-4" />
              My Files
            </Link>
            <Link
              to="/shared"
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                location.pathname === "/shared"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              <User className="h-4 w-4" />
              Shared with me
            </Link>
            <Link
              to="/settings"
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                location.pathname === "/settings"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </nav>
          <div className="mt-auto">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </div>
        </aside>
        <ScrollArea className="flex-1">
          <main className="container py-6">{children}</main>
        </ScrollArea>
      </div>
    </div>
  );
}
