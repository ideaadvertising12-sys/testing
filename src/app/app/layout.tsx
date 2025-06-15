
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppLogo } from "@/components/AppLogo";
import { UserProfile } from "@/components/UserProfile";
import { Separator } from "@/components/ui/separator";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import type { NavItemConfig, UserRole } from "@/lib/types";

const allNavItems: NavItemConfig[] = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard, allowedRoles: ["admin"] },
  { href: "/app/products", label: "Products", icon: Package, allowedRoles: ["admin"] },
  { href: "/app/customers", label: "Customers", icon: Users, allowedRoles: ["admin", "cashier"] },
  { href: "/app/sales", label: "Sales (POS)", icon: ShoppingCart, allowedRoles: ["admin", "cashier"] },
  { href: "/app/inventory", label: "Inventory", icon: Archive, allowedRoles: ["admin", "cashier"] },
];

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { userRole } = useAuth();

  const navItems = allNavItems.filter(item => item.allowedRoles.includes(userRole));

  const getCurrentPageLabel = () => {
    const currentNavItem = navItems.find(item => pathname === item.href || (item.href !== "/app/dashboard" && pathname.startsWith(item.href)));
    if (currentNavItem) {
      return currentNavItem.label;
    }
    // Fallback for pages not directly in nav, or if user lands on a restricted page title
    if (pathname.startsWith("/app/dashboard") && userRole === "admin") return "Dashboard";
    if (pathname.startsWith("/app/products") && userRole === "admin") return "Products";
    if (pathname.startsWith("/app/customers")) return "Customers";
    if (pathname.startsWith("/app/sales")) return "Sales (POS)";
    if (pathname.startsWith("/app/inventory")) return "Inventory";
    return "MilkPOS";
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader className="p-4">
          <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
             <div className="group-data-[collapsible=icon]:hidden">
                <AppLogo size="sm" />
             </div>
             <div className="hidden group-data-[collapsible=icon]:block">
                <AppLogoIconOnly />
             </div>
            <SidebarTrigger />
          </div>
        </SidebarHeader>
        <Separator className="group-data-[collapsible=icon]:hidden" />
        <SidebarContent>
          <SidebarMenu className="p-2">
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} asChild>
                  <SidebarMenuButton
                    isActive={pathname === item.href || (item.href !== "/app/dashboard" && pathname.startsWith(item.href))}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 items-center group-data-[collapsible=icon]:hidden">
           <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} MilkPOS</p>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <div className="md:hidden">
             <SidebarTrigger />
          </div>
          <div className="hidden md:block">
            <h1 className="text-xl font-semibold font-headline">
                {getCurrentPageLabel()}
            </h1>
          </div>
          <UserProfile />
        </header>
        <main className="flex-1 p-4 sm:p-6 bg-background">
          {children}
        </main>
        <footer className="p-4 text-center text-sm text-muted-foreground border-t bg-background">
          Powered by Limidora Ebusiness Solutions
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </AuthProvider>
  )
}

const AppLogoIconOnly = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className="h-6 w-6 text-primary"
  >
    <path d="M20.56 10.44 15.3 3.29A2.52 2.52 0 0 0 13.14 2H10.9A2.52 2.52 0 0 0 8.7 3.29L3.44 10.44A2.13 2.13 0 0 0 3 11.79V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8.21a2.13 2.13 0 0 0-.44-1.35Z"/><path d="m3.5 10.5 17 0"/><path d="M12 22V10.5"/>
  </svg>
);
