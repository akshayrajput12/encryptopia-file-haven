
import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  LogOut, 
  User, 
  Shield, 
  Settings, 
  FileText, 
  FolderOpen,
  LayoutDashboard,
  Bell,
  Users,
  BarChart
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Close mobile menu when location changes
    setIsMobileMenuOpen(false);
  }, [location]);

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
              <Shield className="h-6 w-6 text-primary" />
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
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-display text-xl font-semibold tracking-tight hidden md:inline-block">
                SecureFiles
              </span>
            </Link>
            <button
              className="block md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <div className="w-6 space-y-1.5">
                <span className={`block h-0.5 w-full bg-foreground transition-all ${isMobileMenuOpen ? 'translate-y-2 rotate-45' : ''}`}></span>
                <span className={`block h-0.5 w-full bg-foreground transition-all ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`block h-0.5 w-full bg-foreground transition-all ${isMobileMenuOpen ? '-translate-y-2 -rotate-45' : ''}`}></span>
              </div>
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative w-full max-w-[200px] md:max-w-[300px] hidden md:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search files..."
                className="w-full rounded-full bg-background pl-8 pr-4 py-2 text-sm border focus:border-primary"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <button className="relative p-2 rounded-full hover:bg-muted transition-colors">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center p-0 text-[10px]">3</Badge>
              </button>
              
              <ThemeToggle />
              
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 border-2 border-primary/10">
                  <AvatarImage src={user.avatar_url} alt={user.full_name || user.email} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user.full_name
                      ? user.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                      : user.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline-block text-sm font-medium">
                  {user.full_name || user.email.split('@')[0]}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1">
        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <aside 
          className={cn(
            "fixed top-16 bottom-0 w-64 border-r bg-background z-40 transition-transform duration-300 md:sticky md:translate-x-0",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <ScrollArea className="h-full py-6 px-4">
            <div className="space-y-6">
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground px-2 mb-2">
                  DASHBOARD
                </div>
                <NavItem 
                  to="/" 
                  icon={<LayoutDashboard className="h-4 w-4" />} 
                  label="Overview"
                  active={location.pathname === "/"}
                />
                <NavItem 
                  to="/files" 
                  icon={<FileText className="h-4 w-4" />} 
                  label="My Files"
                  active={location.pathname === "/files"}
                />
                <NavItem 
                  to="/shared" 
                  icon={<Users className="h-4 w-4" />} 
                  label="Shared with me"
                  active={location.pathname === "/shared"}
                />
                <NavItem 
                  to="/recent" 
                  icon={<FolderOpen className="h-4 w-4" />} 
                  label="Recent"
                  active={location.pathname === "/recent"}
                  badge="New"
                />
              </div>
              
              <Separator />
              
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground px-2 mb-2">
                  ANALYTICS
                </div>
                <NavItem 
                  to="/stats" 
                  icon={<BarChart className="h-4 w-4" />} 
                  label="Usage Stats"
                  active={location.pathname === "/stats"}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-muted-foreground px-2 mb-2">
                  ACCOUNT
                </div>
                <NavItem 
                  to="/profile" 
                  icon={<User className="h-4 w-4" />} 
                  label="Profile"
                  active={location.pathname === "/profile"}
                />
                <NavItem 
                  to="/settings" 
                  icon={<Settings className="h-4 w-4" />} 
                  label="Settings"
                  active={location.pathname === "/settings"}
                />
              </div>
              
              <div className="mt-auto pt-4">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => signOut()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              </div>
              
              <div className="mt-4 rounded-lg border bg-card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-sm font-medium">Storage</div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full w-[35%] bg-gradient-to-r from-primary to-primary/80 rounded-full" />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">2.5 GB</span> of 10 GB used
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </aside>
        
        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          <ScrollArea className="flex-1">
            <main className="container py-6">
              {/* Mobile search */}
              <div className="relative w-full mb-6 md:hidden">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search files..."
                  className="w-full pl-9"
                />
              </div>
              
              {children}
            </main>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: string;
}

function NavItem({ to, icon, label, active, badge }: NavItemProps) {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-muted",
        active && "bg-primary text-primary-foreground hover:bg-primary/90"
      )}
    >
      {icon}
      <span>{label}</span>
      {badge && (
        <Badge 
          variant="secondary" 
          className={cn(
            "ml-auto text-[10px] px-1 py-0 h-5",
            active && "bg-primary-foreground/20 text-primary-foreground"
          )}
        >
          {badge}
        </Badge>
      )}
    </Link>
  );
}
