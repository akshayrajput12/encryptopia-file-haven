
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, Mail, Lock, User, FileText, Key, Server } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export function Auth() {
  const { signIn, signUp, sendMagicLink, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [activeTab, setActiveTab] = useState<string>("signin");
  const [showAuth, setShowAuth] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Focus password field when tab changes to signin
  useEffect(() => {
    if (activeTab === "signin" && showAuth) {
      setTimeout(() => {
        passwordRef.current?.focus();
      }, 100);
    }
  }, [activeTab, showAuth]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await signIn(email, password);
    } catch (error) {
      // Error is already handled in useAuth
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await signUp(email, password, fullName);
      setActiveTab("signin");
    } catch (error) {
      // Error is already handled in useAuth
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    try {
      await sendMagicLink(email);
    } catch (error) {
      // Error is already handled in useAuth
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="container py-12 px-4 flex-1 flex flex-col">
        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center gap-12 py-12">
          {/* Left column - Hero Content */}
          <div className="flex-1 space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Secure File Storage with <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">End-to-End Encryption</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl">
                Store, organize, and share your files with complete privacy and security. SecureFiles keeps your data protected and accessible only to you.
              </p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FeatureCard 
                  icon={<Lock className="h-5 w-5" />}
                  title="End-to-End Encryption"
                  description="Your files are encrypted before they leave your device"
                />
                
                <FeatureCard 
                  icon={<FileText className="h-5 w-5" />}
                  title="File Organization"
                  description="Intuitive folders and tagging for easy access"
                />
                
                <FeatureCard 
                  icon={<Key className="h-5 w-5" />}
                  title="Password Protection"
                  description="Add password protection to sensitive files"
                />
                
                <FeatureCard 
                  icon={<Server className="h-5 w-5" />}
                  title="Secure Sharing"
                  description="Share files with others while maintaining security"
                />
              </div>
              
              {!showAuth && (
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" onClick={() => setShowAuth(true)}>
                    Get Started
                  </Button>
                  <Button variant="outline" size="lg">
                    Learn More
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* Right column - Auth Form */}
          <div className="w-full md:w-1/2 max-w-md mx-auto">
            {showAuth ? (
              <div className="animate-fadeIn">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="signin" className="animate-slideUp">
                    <Card className="glass">
                      <CardHeader>
                        <CardTitle>Welcome back</CardTitle>
                        <CardDescription>
                          Sign in to your account to access your secure files
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleSignIn} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                className="pl-9"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="password">Password</Label>
                              <a
                                href="#"
                                className="text-xs text-muted-foreground hover:text-primary transition-colors text-right"
                              >
                                Forgot password?
                              </a>
                            </div>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="password"
                                type="password"
                                className="pl-9"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                ref={passwordRef}
                              />
                            </div>
                          </div>
                          <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign In
                          </Button>
                        </form>
                      </CardContent>
                      <CardFooter>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={handleMagicLink}
                          disabled={loading}
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Sign in with Magic Link
                        </Button>
                      </CardFooter>
                    </Card>
                  </TabsContent>

                  <TabsContent value="signup" className="animate-slideUp">
                    <Card className="glass">
                      <CardHeader>
                        <CardTitle>Create an account</CardTitle>
                        <CardDescription>
                          Get started with SecureFiles today
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleSignUp} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <div className="relative">
                              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="fullName"
                                placeholder="John Doe"
                                className="pl-9"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                disabled={loading}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email-signup">Email</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="email-signup"
                                type="email"
                                placeholder="name@example.com"
                                className="pl-9"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="password-signup">Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                id="password-signup"
                                type="password"
                                className="pl-9"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                              />
                            </div>
                          </div>
                          <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Account
                          </Button>
                        </form>
                      </CardContent>
                      <CardFooter className="flex justify-center text-xs text-muted-foreground">
                        By creating an account, you agree to our Terms of Service and Privacy Policy
                      </CardFooter>
                    </Card>
                  </TabsContent>
                </Tabs>
                
                <div className="mt-4 text-center">
                  <Button variant="ghost" size="sm" onClick={() => setShowAuth(false)}>
                    ← Back to overview
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute -top-4 -left-4 right-8 bottom-4 bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl -z-10"></div>
                <Card className="glass border shadow-lg overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-center bg-primary/10 w-16 h-16 rounded-full mx-auto mb-6">
                      <Shield className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-center mb-2">Ready to get started?</h3>
                    <p className="text-center text-muted-foreground mb-6">
                      Join thousands of users who trust SecureFiles with their important documents
                    </p>
                    <Button 
                      onClick={() => setShowAuth(true)} 
                      className="w-full"
                      size="lg"
                    >
                      Sign in or create account
                    </Button>
                  </div>
                  <div className="bg-muted/50 p-4 text-sm text-center text-muted-foreground">
                    Secured with industry-standard encryption
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="border-t py-8 bg-muted/40">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <span className="font-medium">SecureFiles</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
          <div>© {new Date().getFullYear()} SecureFiles. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}

// Feature card component
const FeatureCard = ({ icon, title, description }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string 
}) => {
  return (
    <div className="flex items-start gap-4 p-4 bg-card border rounded-lg shadow-sm group hover:shadow-md transition-all">
      <div className="rounded-full p-2 bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {icon}
      </div>
      <div>
        <h3 className="font-medium text-base">{title}</h3>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
};
