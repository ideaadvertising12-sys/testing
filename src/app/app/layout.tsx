
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useMemo } from "react";
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
} from "lucide-react";

import {
  SidebarProvider as NewSidebarProvider,
  Sidebar as AppNewSidebar,
  SidebarHeader as AppNewSidebarHeader,
  SidebarContent as AppNewSidebarContent,
  SidebarFooter as AppNewSidebarFooter,
  AppHeaderSidebarTrigger, // The trigger for the header
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
import { Sheet } from "@/components/ui/sheet"; // For mobile sidebar container

const CustomInventoryIcon = ({ className: propClassName }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24" // Ensure consistent size with other icons
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
            // Exact match or dashboard prefix match
            if (item.href && (currentPath === item.href || (isDashboard && currentPath.startsWith(item.href)))) {
                 // Further check for non-dashboard items to ensure it's not a partial prefix of another route
                 if (isDashboard || currentPath.length === item.href.length || currentPath[item.href.length] === '/') {
                    return item.label;
                 }
            }
            // Check children, ensuring they are more specific
            if (item.children) {
                const childLabel = findLabel(item.children, currentPath);
                if (childLabel) return childLabel;
            }
        }
        return null;
    }
    
    const label = findLabel(currentNavItems, pathname);
    if (label) return label;
    
    // Fallback for cases where the active route might be a sub-page not explicitly in nav (e.g., /app/products/edit/123)
    // This part can be tricky and might need refinement based on exact routing patterns
    const primarySegment = pathname.split('/')[2]; // e.g., 'dashboard', 'products'
    const fallbackItem = currentNavItems.find(item => item.id === primarySegment);
    if (fallbackItem) return fallbackItem.label;
    
    return "NGroup Products";
}


function AppShell({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const userRole = currentUser?.role;
  const pathname = usePathname();
  // isCollapsed and navItems will be sourced from useSidebarContext
  const { isCollapsed, isMobile, navItems } = useSidebarContext();

  const currentPageLabel = useMemo(
    () => calculateCurrentPageLabel(pathname, userRole, navItems),
    [pathname, userRole, navItems]
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar: Fixed position */}
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

      {/* Mobile Sidebar: Handled by Sheet component. The <AppHeaderSidebarTrigger /> inside will become the <SheetTrigger> */}
      {isMobile && (
        <Sheet> 
          <AppHeaderSidebarTrigger /> {/* This will render the <SheetTrigger> for mobile */}
          <AppNewSidebar> {/* This will render as <SheetContent> */}
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
          // Adjust margin only for desktop based on sidebar state
          !isMobile && (isCollapsed ? `ml-[${sidebarVars.collapsed}]` : `ml-[${sidebarVars.expanded}]`)
        )}
      >
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card/95 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-2">
            {/* 
              The mobile trigger is now part of the Sheet component instance above.
              The desktop trigger is removed from the header as per the request to hide it on larger screens.
            */}
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
  const isMobile = useIsMobile(); // Detect mobile state once

  useEffect(() => {
    // Ensure this effect doesn't run for Next.js internal paths during build/dev
    if (!currentUser && !pathname.startsWith('/_next/')) { 
      router.replace("/");
    }
  }, [currentUser, router, pathname]);

  // Show preloader if not logged in and not an internal Next.js path
  if (!currentUser && !pathname.startsWith('/_next/')) {
    return <GlobalPreloaderScreen message="Loading application..." />;
  }
  
  const userRole = currentUser?.role;
  // Filter nav items based on role BEFORE passing to provider
  const currentNavItemsForUser = userRole 
    ? ALL_NAV_ITEMS.filter(item => item.allowedRoles.includes(userRole)) 
    : [];

  return (
    <NewSidebarProvider 
      navItems={currentNavItemsForUser} 
      userRole={userRole} 
      isMobile={isMobile}
    >
      <AppShell>{children}</AppShell>
    </NewSidebarProvider>
  );
}

    
