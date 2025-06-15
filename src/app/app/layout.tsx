"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  BarChart3,
  Home,
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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/products", label: "Products", icon: Package },
  { href: "/app/customers", label: "Customers", icon: Users },
  { href: "/app/sales", label: "Sales (POS)", icon: ShoppingCart },
  { href: "/app/inventory", label: "Inventory", icon: Archive },
  // { href: "/app/reports", label: "Reports", icon: BarChart3 }, // Can be part of dashboard
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
            <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
          </div>
        </SidebarHeader>
        <Separator className="group-data-[collapsible=icon]:hidden" />
        <SidebarContent>
          <SidebarMenu className="p-2">
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior>
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
          <div className="md:hidden"> {/* Hamburger for mobile, shown if sidebar is collapsible */}
             <SidebarTrigger />
          </div>
          <div className="hidden md:block"> {/* Placeholder for breadcrumbs or page title */}
            <h1 className="text-xl font-semibold font-headline">
                {navItems.find(item => pathname.startsWith(item.href))?.label || "MilkPOS"}
            </h1>
          </div>
          <UserProfile />
        </header>
        <main className="flex-1 p-4 sm:p-6 bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
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

