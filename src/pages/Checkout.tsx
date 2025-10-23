import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Trash2 } from "lucide-react";

interface Meal {
  id: string;
  name: string;
  price: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface CartItem extends Meal {
  quantity: number;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");

  useEffect(() => {
    loadCartItems();
  }, []);

  const loadCartItems = async () => {
    const savedCart = localStorage.getItem("cart");
    if (!savedCart) {
      setCartItems([]);
      return;
    }

    const cart: Record<string, number> = JSON.parse(savedCart);
    const mealIds = Object.keys(cart);

    if (mealIds.length === 0) {
      setCartItems([]);
      return;
    }

    const { data, error } = await supabase
      .from("meals")
      .select("*")
      .in("id", mealIds);

    if (error) {
      toast({
        title: "error loading cart",
        description: error.message,
        variant: "destructive",
      });
    } else {
      const items: CartItem[] = (data || []).map((meal) => ({
        ...meal,
        quantity: cart[meal.id],
      }));
      setCartItems(items);
    }
  };

  const removeFromCart = (mealId: string) => {
    const savedCart = localStorage.getItem("cart");
    if (!savedCart) return;

    const cart: Record<string, number> = JSON.parse(savedCart);
    delete cart[mealId];
    localStorage.setItem("cart", JSON.stringify(cart));
    loadCartItems();
    toast({
      title: "removed from cart",
    });
  };

  const updateQuantity = (mealId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(mealId);
      return;
    }

    const savedCart = localStorage.getItem("cart");
    if (!savedCart) return;

    const cart: Record<string, number> = JSON.parse(savedCart);
    cart[mealId] = newQuantity;
    localStorage.setItem("cart", JSON.stringify(cart));
    loadCartItems();
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalMacros = cartItems.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories * item.quantity,
      protein: acc.protein + item.protein * item.quantity,
      carbs: acc.carbs + item.carbs * item.quantity,
      fats: acc.fats + item.fats * item.quantity,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  const handlePlaceOrder = async () => {
    if (!deliveryAddress.trim()) {
      toast({
        title: "delivery address required",
        description: "please enter your delivery address",
        variant: "destructive",
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "cart is empty",
        description: "add some meals to your cart first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        total_price: totalPrice,
        delivery_address: deliveryAddress,
        status: "pending",
        payment_status: "pending",
      })
      .select()
      .single();

    if (orderError || !order) {
      toast({
        title: "error placing order",
        description: orderError?.message || "unknown error",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const orderItems = cartItems.map((item) => ({
      order_id: order.id,
      meal_id: item.id,
      quantity: item.quantity,
      price_at_purchase: item.price,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      toast({
        title: "error saving order items",
        description: itemsError.message,
        variant: "destructive",
      });
    } else {
      localStorage.removeItem("cart");
      toast({
        title: "order placed!",
        description: "your meal prep order has been confirmed",
      });
      navigate("/dashboard");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => navigate("/meals")} size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold mb-2">checkout</h1>
            <p className="text-muted-foreground">review and complete your order</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.length === 0 ? (
              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">your cart is empty</p>
                </CardContent>
              </Card>
            ) : (
              cartItems.map((item) => (
                <Card key={item.id} className="border-primary/20">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{item.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.calories}cal | {item.protein}g protein | {item.carbs}g carbs | {item.fats}g fats
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          -
                        </Button>
                        <span className="w-12 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                      <div className="text-xl font-bold">RM {(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="space-y-4">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>order summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">total calories:</span>
                  <span className="font-medium">{totalMacros.calories}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">protein:</span>
                  <span className="font-medium">{totalMacros.protein}g</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">carbs:</span>
                  <span className="font-medium">{totalMacros.carbs}g</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">fats:</span>
                  <span className="font-medium">{totalMacros.fats}g</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>total:</span>
                    <span className="text-primary">RM {totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>delivery details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">delivery address</Label>
                  <Textarea
                    id="address"
                    placeholder="enter your delivery address in malaysia"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handlePlaceOrder}
                  disabled={loading || cartItems.length === 0}
                  className="w-full"
                >
                  {loading ? "placing order..." : "place order"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
