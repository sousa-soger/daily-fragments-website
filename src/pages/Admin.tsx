import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

interface Order {
  id: string;
  total_price: number;
  status: string;
  delivery_address: string;
  payment_status: string;
  created_at: string;
  profiles: {
    email: string;
    full_name: string | null;
  };
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roles) {
      toast({
        title: "access denied",
        description: "you do not have admin privileges",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    setIsAdmin(true);
    loadOrders();
  };

  const loadOrders = async () => {
    const { data: ordersData, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "error loading orders",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const ordersWithProfiles = await Promise.all(
      (ordersData || []).map(async (order) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", order.user_id)
          .single();

        return {
          ...order,
          profiles: profile || { email: "unknown", full_name: null },
        };
      })
    );

    setOrders(ordersWithProfiles);
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (error) {
      toast({
        title: "error updating order",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "order updated",
        description: `order status changed to ${status}`,
      });
      loadOrders();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-muted-foreground">loading admin panel...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const completedOrders = orders.filter((o) => o.status === "completed");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => navigate("/dashboard")} size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold mb-2">admin panel</h1>
            <p className="text-muted-foreground">manage orders and deliveries</p>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">all orders ({orders.length})</TabsTrigger>
            <TabsTrigger value="pending">pending ({pendingOrders.length})</TabsTrigger>
            <TabsTrigger value="completed">completed ({completedOrders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} onStatusChange={updateOrderStatus} />
            ))}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingOrders.map((order) => (
              <OrderCard key={order.id} order={order} onStatusChange={updateOrderStatus} />
            ))}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedOrders.map((order) => (
              <OrderCard key={order.id} order={order} onStatusChange={updateOrderStatus} />
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const OrderCard = ({
  order,
  onStatusChange,
}: {
  order: Order;
  onStatusChange: (id: string, status: string) => void;
}) => {
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">order #{order.id.slice(0, 8)}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {order.profiles?.email || "unknown"}
              {order.profiles?.full_name && ` • ${order.profiles.full_name}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant={order.status === "completed" ? "default" : "secondary"}>
              {order.status}
            </Badge>
            <Badge variant={order.payment_status === "paid" ? "default" : "secondary"}>
              {order.payment_status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">total:</span>
            <span className="font-medium">RM {order.total_price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">delivery address:</span>
            <span className="font-medium text-right max-w-xs">{order.delivery_address}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">ordered:</span>
            <span className="font-medium">{new Date(order.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          {order.status === "pending" && (
            <>
              <Button
                size="sm"
                onClick={() => onStatusChange(order.id, "processing")}
              >
                mark processing
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusChange(order.id, "completed")}
              >
                mark completed
              </Button>
            </>
          )}
          {order.status === "processing" && (
            <Button
              size="sm"
              onClick={() => onStatusChange(order.id, "completed")}
            >
              mark completed
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default Admin;
