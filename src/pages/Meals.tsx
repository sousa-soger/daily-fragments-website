import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, ShoppingCart } from "lucide-react";

interface Meal {
  id: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  price: number;
}

const Meals = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, number>>({});

  useEffect(() => {
    loadMeals();
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const loadMeals = async () => {
    const { data, error } = await supabase
      .from("meals")
      .select("*")
      .eq("is_available", true);

    if (error) {
      toast({
        title: "error loading meals",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setMeals(data || []);
    }
    setLoading(false);
  };

  const addToCart = (mealId: string) => {
    const newCart = { ...cart };
    newCart[mealId] = (newCart[mealId] || 0) + 1;
    setCart(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    toast({
      title: "added to cart",
      description: "meal has been added to your cart",
    });
  };

  const cartItemCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-muted-foreground">loading meals...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/dashboard")} size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold mb-2">meal menu</h1>
              <p className="text-muted-foreground">choose your personalized meals</p>
            </div>
          </div>
          <Button onClick={() => navigate("/checkout")} className="gap-2">
            <ShoppingCart className="w-4 h-4" />
            cart ({cartItemCount})
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meals.map((meal) => (
            <Card key={meal.id} className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardHeader>
                <CardTitle>{meal.name}</CardTitle>
                <CardDescription>{meal.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <Badge variant="secondary" className="justify-center">
                    {meal.calories} cal
                  </Badge>
                  <Badge variant="secondary" className="justify-center">
                    {meal.protein}g protein
                  </Badge>
                  <Badge variant="secondary" className="justify-center">
                    {meal.carbs}g carbs
                  </Badge>
                  <Badge variant="secondary" className="justify-center">
                    {meal.fats}g fats
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-primary">RM {meal.price.toFixed(2)}</div>
              </CardContent>
              <CardFooter>
                <Button onClick={() => addToCart(meal.id)} className="w-full gap-2">
                  <Plus className="w-4 h-4" />
                  add to cart
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Meals;
