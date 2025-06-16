
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  View,
  PlusSquare,
  FileText,
  ClipboardList,
  Warehouse,
  UserCheck,
  PanelLeft,
  X,
} from "lucide-react";

import {
  SidebarProvider as NewSidebarProvider,
  Sidebar as AppNewSidebar,
  SidebarHeader as AppNewSidebarHeader,
  SidebarContent as AppNewSidebarContent,
  SidebarFooter as AppNewSidebarFooter,
  AppHeaderSidebarTrigger, 
  sidebarVars,
  useSidebarContext,
} from "@/components/ui/sidebar"; 

import { AppLogo } from "@/components/AppLogo";
import { UserProfile } from "@/components/UserProfile";
import { useAuth } from "@/contexts/AuthContext";
import type { NavItemConfig, UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetTrigger } from "@/components/ui/sheet"; 

const CustomInventoryIcon = ({ className: propClassName }: { className?: string }) => (
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
    className={cn("lucide lucide-archive", propClassName)}
  >
    <rect width="20" height="5" x="2" y="3" rx="1"></rect>
    <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"></path>
    <path d="M10 12h4"></path>
  </svg>
);

const ALL_NAV_ITEMS: NavItemConfig[] = [
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

function calculateCurrentPageLabel(pathname: string, userRole: UserRole | undefined, currentNavItems: NavItemConfig[]): string {
    if (!userRole) return "NGroup Products";
    
    const findLabel = (items: NavItemConfig[], currentPath: string): string | null => {
        for (const item of items) {
            const isDashboard = item.href === "/app/dashboard";
            if (item.href && (currentPath === item.href || (isDashboard && currentPath.startsWith(item.href)))) {
                 if (isDashboard || currentPath.length === item.href.length || currentPath[item.href.length] === '/') {
                    return item.label;
                 }
            }
            if (item.children) {
                const childLabel = findLabel(item.children, currentPath);
                if (childLabel) return childLabel;
            }
        }
        return null;
    }
    
    const label = findLabel(currentNavItems, pathname);
    if (label) return label;
    
    const primarySegment = pathname.split('/')[2]; 
    const fallbackItem = currentNavItems.find(item => item.id === primarySegment);
    if (fallbackItem) return fallbackItem.label;
    
    return "NGroup Products";
}


function AppShell({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const userRole = currentUser?.role;
  const pathname = usePathname();
  const { isCollapsed, isMobile, navItems, openMobile, setOpenMobile } = useSidebarContext();

  const currentPageLabel = useMemo(
    () => calculateCurrentPageLabel(pathname, userRole, navItems),
    [pathname, userRole, navItems]
  );

  return (
    <div className="flex h-screen bg-background">
      {!isMobile && (
        <div className={cn(
            "fixed inset-y-0 left-0 z-20 transition-all duration-300 ease-in-out",
            isCollapsed ? `w-[${sidebarVars.collapsed}]` : `w-[${sidebarVars.expanded}]`
        )}>
            <AppNewSidebar>
                <AppNewSidebarHeader>
                    <AppLogo size={isCollapsed ? "iconOnly" : "sm"} />
                </AppNewSidebarHeader>
                <AppNewSidebarContent />
                <AppNewSidebarFooter>
                {!isCollapsed && (
                    <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} NGroup</p>
                )}
                </AppNewSidebarFooter>
            </AppNewSidebar>
        </div>
      )}

      {isMobile && (
        <Sheet open={openMobile} onOpenChange={setOpenMobile}>
          {/* The AppHeaderSidebarTrigger for mobile is effectively the SheetTrigger */}
          <AppNewSidebar> 
            <AppNewSidebarHeader>
                <AppLogo size={"sm"} />
            </AppNewSidebarHeader>
            <AppNewSidebarContent />
            <AppNewSidebarFooter>
                <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} NGroup</p>
            </AppNewSidebarFooter>
          </AppNewSidebar>
        </Sheet>
      )}
      
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out overflow-x-hidden",
          !isMobile && (isCollapsed ? `ml-[${sidebarVars.collapsed}]` : `ml-[${sidebarVars.expanded}]`)
        )}
      >
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card/95 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-2">
            {/* Mobile trigger is part of Sheet - uses AppHeaderSidebarTrigger internally */}
            {/* Desktop trigger */}
            <AppHeaderSidebarTrigger />
            <h1 className="text-xl font-semibold font-headline hidden sm:block">
              {currentPageLabel}
            </h1>
          </div>
          <UserProfile />
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile(); 
  const [openMobile, setOpenMobile] = useState(false);

  useEffect(() => {
    if (!currentUser && !pathname.startsWith('/_next/')) { 
      router.replace("/");
    }
  }, [currentUser, router, pathname]);

  if (!currentUser && !pathname.startsWith('/_next/')) {
    return <GlobalPreloaderScreen message="Loading application..." />;
  }
  
  const userRole = currentUser?.role;
  const currentNavItemsForUser = userRole 
    ? ALL_NAV_ITEMS.filter(item => item.allowedRoles.includes(userRole)) 
    : [];

  return (
    <NewSidebarProvider 
      navItems={currentNavItemsForUser} 
      userRole={userRole} 
      isMobile={isMobile}
      openMobile={openMobile}
      setOpenMobile={setOpenMobile}
    >
      <AppShell>{children}</AppShell>
    </NewSidebarProvider>
  );
}
