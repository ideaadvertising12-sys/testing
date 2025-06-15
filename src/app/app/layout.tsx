
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  ChevronDown,
  View,
  PlusSquare,
  FileText,
  ClipboardList,
  Warehouse,
  UserCheck,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AppLogo } from "@/components/AppLogo";
import { UserProfile } from "@/components/UserProfile";
import { Separator } from "@/components/ui/separator";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import type { NavItemConfig } from "@/lib/types";
import { cn } from "@/lib/utils";

const CustomInventoryIcon = ({ className: propClassName }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("lucide lucide-archive", propClassName)}
  >
    <rect width="20" height="5" x="2" y="3" rx="1"></rect>
    <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"></path>
    <path d="M10 12h4"></path>
  </svg>
);

const allNavItems: NavItemConfig[] = [
  { id: "dashboard", href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard, allowedRoles: ["admin"] },
  { id: "products", href: "/app/products", label: "Products", icon: Package, allowedRoles: ["admin"] },
  { id: "customers", href: "/app/customers", label: "Customers", icon: Users, allowedRoles: ["admin", "cashier"] },
  { id: "sales", href: "/app/sales", label: "Sales (POS)", icon: ShoppingCart, allowedRoles: ["admin", "cashier"] },
  { 
    id: "inventory", 
    label: "Inventory", 
    icon: CustomInventoryIcon, 
    allowedRoles: ["admin", "cashier"],
    children: [
      { id: "view-stock", href: "/app/inventory/view-stock", label: "View Stock", icon: View, allowedRoles: ["admin", "cashier"] },
      { id: "manage-stock", href: "/app/inventory/manage-stock", label: "Manage Stock", icon: PlusSquare, allowedRoles: ["admin"] },
    ]
  },
  {
    id: "reports",
    label: "Reports",
    icon: FileText,
    allowedRoles: ["admin"],
    children: [
      { id: "full-report", href: "/app/reports/full-report", label: "Full Report", icon: ClipboardList, allowedRoles: ["admin"] },
      { id: "stock-report", href: "/app/reports/stock-report", label: "Stock Report", icon: Warehouse, allowedRoles: ["admin"] },
      { id: "customer-report", href: "/app/reports/customer-report", label: "Customer Report", icon: UserCheck, allowedRoles: ["admin"] },
    ]
  }
];

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { userRole } = useAuth();

  const navItems = allNavItems.filter(item => item.allowedRoles.includes(userRole));

  const getCurrentPageLabel = () => {
    for (const item of navItems) {
      if (item.href && (pathname === item.href || (item.href !== "/app/dashboard" && pathname.startsWith(item.href)))) {
        return item.label;
      }
      if (item.children) {
        for (const child of item.children) {
          if (child.href && (pathname === child.href || pathname.startsWith(child.href))) {
            return child.label;
          }
        }
      }
    }
    // Fallback titles
    if (pathname.startsWith("/app/dashboard") && userRole === "admin") return "Dashboard";
    if (pathname.startsWith("/app/products") && userRole === "admin") return "Products";
    if (pathname.startsWith("/app/customers")) return "Customers";
    if (pathname.startsWith("/app/sales")) return "Sales (POS)";
    if (pathname.startsWith("/app/inventory/view-stock")) return "View Stock";
    if (pathname.startsWith("/app/inventory/manage-stock") && userRole === "admin") return "Manage Stock";
    if (pathname.startsWith("/app/inventory")) return "Inventory";
    if (pathname.startsWith("/app/reports/full-report") && userRole === "admin") return "Full Report";
    if (pathname.startsWith("/app/reports/stock-report") && userRole === "admin") return "Stock Report";
    if (pathname.startsWith("/app/reports/customer-report") && userRole === "admin") return "Customer Report";
    if (pathname.startsWith("/app/reports") && userRole === "admin") return "Reports";
    return "NGroup Products";
  }
  
  const isNavItemActive = (item: NavItemConfig) => {
    if (item.href) {
      // For top-level dashboard link, ensure it's an exact match or starts with /app/dashboard only.
      if (item.href === "/app/dashboard") return pathname === item.href || pathname.startsWith("/app/dashboard/");
      // For other top-level links, ensure they are not just a prefix of a deeper path within another section
      return pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href) && (pathname.length === item.href.length || pathname[item.href.length] === '/'));

    }
    if (item.children) {
      return item.children.some(child => child.href && pathname.startsWith(child.href));
    }
    return false;
  };
  
  const defaultOpenAccordion = navItems.find(item => item.children && item.children.some(child => child.href && pathname.startsWith(child.href)))?.id;


  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="sidebar" collapsible="icon" className="app-layout-sidebar">
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
          <Accordion type="single" collapsible className="w-full" defaultValue={defaultOpenAccordion}>
            <SidebarMenu className="p-2">
              {navItems.map((item) => (
                item.children ? (
                  <AccordionItem key={item.id} value={item.id} className="border-b-0">
                     <SidebarMenuItem className="p-0">
                        <AccordionTrigger 
                          className={cn(
                            "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 data-[state=open]:bg-sidebar-accent/80 data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>svg:last-child]:ml-auto [&>svg:last-child]:group-data-[collapsible=icon]:hidden",
                            isNavItemActive(item) && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground data-[state=open]:bg-sidebar-primary data-[state=open]:text-sidebar-primary-foreground",
                            "group-data-[collapsible=icon]:justify-center"
                          )}
                        >
                          <item.icon className="group-data-[collapsible=icon]:mx-auto" />
                          <span className="group-data-[collapsible=icon]:hidden truncate">{item.label}</span>
                          {/* Chevron is part of AccordionTrigger */}
                        </AccordionTrigger>
                      </SidebarMenuItem>
                    <AccordionContent className="pb-0 group-data-[collapsible=icon]:hidden">
                      <SidebarMenu className="pl-6 pr-0 py-1">
                        {item.children.filter(child => child.allowedRoles.includes(userRole)).map((child) => (
                          <SidebarMenuItem key={child.id}>
                            <Link href={child.href!} asChild>
                              <SidebarMenuButton
                                isActive={pathname === child.href || pathname.startsWith(child.href!)}
                                tooltip={child.label}
                                size="sm"
                                className="gap-1.5"
                              >
                                <child.icon className="h-3.5 w-3.5" />
                                <span>{child.label}</span>
                              </SidebarMenuButton>
                            </Link>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </AccordionContent>
                  </AccordionItem>
                ) : (
                  <SidebarMenuItem key={item.id}>
                    <Link href={item.href!} asChild>
                      <SidebarMenuButton
                        isActive={isNavItemActive(item)}
                        tooltip={item.label}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                )
              ))}
            </SidebarMenu>
          </Accordion>
        </SidebarContent>
        <SidebarFooter className="p-4 items-center group-data-[collapsible=icon]:hidden">
           <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} NGroup Products</p>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="app-layout-header sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
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
        <footer className="app-layout-main-footer p-4 text-center text-sm text-muted-foreground border-t bg-background">
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

