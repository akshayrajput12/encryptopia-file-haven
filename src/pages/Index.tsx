import { useAuth } from "@/hooks/useAuth";
import { Auth } from "@/components/Auth";
import { FileExplorer } from "@/components/FileExplorer";
import { Layout } from "@/components/Layout";
import { Shield, Check, Lock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { user, loading } = useAuth();

  
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

  
  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        
        <div className="container py-12 px-4 md:px-6 flex-1 flex flex-col">
          <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70 pb-2">
                Secure File Management
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mt-4">
                Store, share, and manage your files with end-to-end encryption
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center py-12">
              <div className="space-y-8 order-2 md:order-1">
                <div className="space-y-6">
                  <FeatureItem
                    icon={<Lock className="h-5 w-5" />}
                    title="Advanced Security"
                    description="End-to-end encryption keeps your files private and secure"
                  />
                  
                  <FeatureItem
                    icon={<FileText className="h-5 w-5" />}
                    title="Smart Organization"
                    description="Intuitive file management with folders, tags, and search"
                  />
                  
                  <FeatureItem
                    icon={<Check className="h-5 w-5" />}
                    title="Access Control"
                    description="Fine-grained permissions to securely share your files"
                  />
                  
                  <FeatureItem
                    icon={<Shield className="h-5 w-5" />}
                    title="Threat Detection"
                    description="Built-in scanning protects against malware and security threats"
                  />
                </div>
                
                <div className="hidden md:block">
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-center md:justify-start">
                    <Button size="lg" className="w-full sm:w-auto">
                      Get Started
                    </Button>
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      Learn More
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="order-1 md:order-2">
                <div className="relative">
                  <div className="absolute -top-4 -left-4 right-8 bottom-4 bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl -z-10"></div>
                  <div className="bg-card rounded-xl border shadow-lg p-6">
                    <Auth />
                  </div>
                </div>
              </div>
              
              <div className="block md:hidden order-3">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started
                  </Button>
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Learn More
                  </Button>
                </div>
              </div>
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

  // Otherwise, show the file explorer
  return (
    <Layout>
      <FileExplorer />
    </Layout>
  );
};

// Feature item component
const FeatureItem = ({ icon, title, description }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string 
}) => {
  return (
    <div className="flex items-start gap-4 group">
      <div className="rounded-full p-2 bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {icon}
      </div>
      <div>
        <h3 className="font-medium text-lg">{title}</h3>
        <p className="text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
};

export default Index;
