
import { placeholderSales, placeholderProducts, placeholderCustomers } from "@/lib/placeholder-data";
import type { Sale } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Package, ShoppingCart, UserPlus } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "sale" | "new_product" | "new_customer";
  title: string;
  description: string;
  timestamp: Date;
  icon: React.ElementType;
  avatarUrl?: string;
  avatarFallback?: string;
}

const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase();

const recentActivities: ActivityItem[] = [
  ...placeholderSales.slice(0, 2).map((sale, index): ActivityItem => ({
    id: `sale-${sale.id}`,
    type: "sale",
    title: `Sale #${sale.id.slice(0,4)} to ${sale.customerName || 'Guest'}`,
    description: `${sale.items.length} items, Total: LKR ${sale.totalAmount.toFixed(2)}`,
    timestamp: sale.saleDate,
    icon: ShoppingCart,
    avatarUrl: placeholderCustomers.find(c => c.id === sale.customerId)?.email ? `https://i.pravatar.cc/40?u=${placeholderCustomers.find(c => c.id === sale.customerId)?.email}` : undefined,
    avatarFallback: sale.customerName ? getInitials(sale.customerName) : 'G',
  })),
  {
    id: "prod-1",
    type: "new_product",
    title: `New Product Added: ${placeholderProducts[4].name}`,
    description: `Category: ${placeholderProducts[4].category}, Price: LKR ${placeholderProducts[4].price.toFixed(2)}`,
    timestamp: new Date(Date.now() - 86400000 * 0.5), // Half day ago
    icon: Package,
    avatarUrl: placeholderProducts[4].imageUrl,
    avatarFallback: placeholderProducts[4].category[0],
  },
  {
    id: "cust-1",
    type: "new_customer",
    title: `New Customer Registered: ${placeholderCustomers[2].name}`,
    description: `Email: ${placeholderCustomers[2].email || 'N/A'}`,
    timestamp: new Date(Date.now() - 86400000 * 1.5), // 1.5 days ago
    icon: UserPlus,
    avatarUrl: placeholderCustomers[2].email ? `https://i.pravatar.cc/40?u=${placeholderCustomers[2].email}` : undefined,
    avatarFallback: getInitials(placeholderCustomers[2].name),
  },
].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());


export function RecentActivity() {
  return (
    <Card className="shadow-lg col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="font-headline">Recent Activity</CardTitle>
        <CardDescription>Overview of the latest actions in the system.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px]">
          <div className="space-y-6">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4">
                <Avatar className="h-10 w-10 border">
                  {activity.avatarUrl && <AvatarImage src={activity.avatarUrl} alt={activity.title} data-ai-hint="activity avatar" />}
                  <AvatarFallback className="bg-muted">
                    {activity.avatarFallback ? activity.avatarFallback : <activity.icon className="h-5 w-5 text-muted-foreground" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium leading-none">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
