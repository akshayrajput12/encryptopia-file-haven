
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-xl mx-auto px-4">
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <AlertTriangle size={40} />
          </div>
        </div>
        <h1 className="text-5xl font-bold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-6">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        <p className="text-muted-foreground mb-8">
          The URL <code className="bg-muted px-2 py-1 rounded">{location.pathname}</code> could not be found.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="default" size="lg">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return Home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" onClick={() => window.history.back()}>
            <span>Go Back</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
