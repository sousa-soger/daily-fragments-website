import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { LogOut, UtensilsCrossed, ShoppingCart } from "lucide-react";

interface MacroGoals {
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fats: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [macroGoals, setMacroGoals] = useState<MacroGoals>({
    daily_calories: 2000,
    daily_protein: 150,
    daily_carbs: 200,
    daily_fats: 65,
  });
  const [consumed, setConsumed] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      } else {
        loadMacroGoals(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadMacroGoals = async (userId: string) => {
    const { data, error } = await supabase
      .from("macro_goals")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (data && !error) {
      setMacroGoals(data);
    }
  };

  const updateMacroGoals = async (field: keyof MacroGoals, value: number) => {
    if (!user) return;
    
    const newGoals = { ...macroGoals, [field]: value };
    setMacroGoals(newGoals);

    const { error } = await supabase
      .from("macro_goals")
      .update({ [field]: value })
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "error updating goals",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "signed out",
      description: "see you soon!",
    });
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-muted-foreground">loading...</div>
      </div>
    );
  }

  const calorieProgress = (consumed.calories / macroGoals.daily_calories) * 100;
  const proteinProgress = (consumed.protein / macroGoals.daily_protein) * 100;
  const carbsProgress = (consumed.carbs / macroGoals.daily_carbs) * 100;
  const fatsProgress = (consumed.fats / macroGoals.daily_fats) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">dailyfragments</h1>
            <p className="text-muted-foreground">welcome back, {user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/meals")} className="gap-2">
              <UtensilsCrossed className="w-4 h-4" />
              meals
            </Button>
            <Button variant="outline" onClick={() => navigate("/checkout")} className="gap-2">
              <ShoppingCart className="w-4 h-4" />
              cart
            </Button>
            <Button variant="outline" onClick={handleSignOut} className="gap-2">
              <LogOut className="w-4 h-4" />
              sign out
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>today's macros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">calories</span>
                  <span className="text-sm font-medium">{consumed.calories} / {macroGoals.daily_calories}</span>
                </div>
                <Progress value={calorieProgress} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">protein (g)</span>
                  <span className="text-sm font-medium">{consumed.protein} / {macroGoals.daily_protein}</span>
                </div>
                <Progress value={proteinProgress} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">carbs (g)</span>
                  <span className="text-sm font-medium">{consumed.carbs} / {macroGoals.daily_carbs}</span>
                </div>
                <Progress value={carbsProgress} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">fats (g)</span>
                  <span className="text-sm font-medium">{consumed.fats} / {macroGoals.daily_fats}</span>
                </div>
                <Progress value={fatsProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>customize your goals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">daily calories</span>
                  <span className="text-sm font-medium">{macroGoals.daily_calories}</span>
                </div>
                <Slider
                  value={[macroGoals.daily_calories]}
                  onValueChange={(vals) => updateMacroGoals("daily_calories", vals[0])}
                  min={1200}
                  max={4000}
                  step={50}
                />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">protein (g)</span>
                  <span className="text-sm font-medium">{macroGoals.daily_protein}</span>
                </div>
                <Slider
                  value={[macroGoals.daily_protein]}
                  onValueChange={(vals) => updateMacroGoals("daily_protein", vals[0])}
                  min={50}
                  max={300}
                  step={5}
                />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">carbs (g)</span>
                  <span className="text-sm font-medium">{macroGoals.daily_carbs}</span>
                </div>
                <Slider
                  value={[macroGoals.daily_carbs]}
                  onValueChange={(vals) => updateMacroGoals("daily_carbs", vals[0])}
                  min={50}
                  max={400}
                  step={10}
                />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">fats (g)</span>
                  <span className="text-sm font-medium">{macroGoals.daily_fats}</span>
                </div>
                <Slider
                  value={[macroGoals.daily_fats]}
                  onValueChange={(vals) => updateMacroGoals("daily_fats", vals[0])}
                  min={20}
                  max={150}
                  step={5}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
