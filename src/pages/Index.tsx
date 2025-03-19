import { useAuth } from "@/hooks/useAuth";
import { Auth } from "@/components/Auth";
import { FileExplorer } from "@/components/FileExplorer";
import { Layout } from "@/components/Layout";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { user, loading } = useAuth();

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Shield className="h-12 w-12 text-primary animate-pulse" />
          <p className="text-lg animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  // If the user is not authenticated, show the auth page
  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="container py-8 px-4 md:px-6 flex-1 flex flex-col">
          <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col md:flex-row items-center gap-8 md:gap-16">
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight">
                  Secure File Management
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground">
                  Store, share, and manage your files with end-to-end encryption
                </p>
              </div>
              
              <div className="flex flex-col gap-6 py-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full p-1 bg-primary/10 text-primary">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Advanced Security</h3>
                    <p className="text-muted-foreground">
                      End-to-end encryption keeps your files private and secure
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="rounded-full p-1 bg-primary/10 text-primary">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Access Control</h3>
                    <p className="text-muted-foreground">
                      Fine-grained permissions to securely share your files
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="rounded-full p-1 bg-primary/10 text-primary">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Threat Detection</h3>
                    <p className="text-muted-foreground">
                      Built-in scanning protects against malware and security threats
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-full max-w-md">
              <Auth />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, show the file explorer
  return (
    <Layout>
      <FileExplorer />
    </Layout>
  );
};

export default Index;
