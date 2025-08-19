import { useAuth } from "@/hooks/useAuth";
import Map from "@/components/Map";
import AuthPage from "@/components/auth/AuthPage";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading MapMog...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <Map />;
};

export default Index;
