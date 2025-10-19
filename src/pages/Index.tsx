import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-primary/10 p-4">
      <div className="text-center space-y-8 max-w-3xl">
        <div className="space-y-4">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            dailyfragments
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground">
            personalized meal prep & delivery for malaysia
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
            customize your meals based on your calorie and macro goals. 
            futuristic nutrition meets organic wellness.
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              get started
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/auth")}
              className="border-primary/30"
            >
              sign in
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
