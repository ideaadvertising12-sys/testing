
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
  useSidebarContext,
  sidebarVars, 
} from "@/components/ui/sidebar"; 

import { AppLogo } from "@/components/AppLogo";
import { UserProfile } from "@/components/UserProfile";
import { useAuth } from "@/contexts/AuthContext";
import type { NavItemConfig, UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"; 
import { Button } from "@/components/ui/button"; 

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
            if (item.href && currentPath === item.href) {
                return item.label;
            }
            if (item.children) {
                const childLabel = findLabel(item.children, currentPath);
                if (childLabel) return childLabel;
            }
        }
        return null;
    }
    
    let label = findLabel(currentNavItems, pathname);
    if (label) return label;
    
    // Fallback for nested routes if direct match fails and for active parent of a child
    for (const item of currentNavItems) {
        if (item.children) {
            for (const child of item.children) {
                if (child.href && pathname.startsWith(child.href)) {
                     label = findLabel(item.children, pathname); // try to find exact match first
                     if (label) return label;
                     return child.label; // otherwise return matched child label
                }
            }
        }
        // Check if a top-level item matches the base of the pathname
        if (item.href && pathname.startsWith(item.href) && pathname !== item.href) {
             const segments = pathname.split('/');
             const itemSegments = item.href.split('/');
             // Ensure it's a child page of a top-level item not explicitly in children and not a different top-level item
             if (segments.length > itemSegments.length && segments[2] === itemSegments[2]) {
                // This case is tricky if the exact child is not defined,
                // For now, if a direct child label was not found above, but it's a sub-route of a top-level item,
                // prefer the top-level item's label.
                // Or, could try to derive from path, e.g. /app/products/edit -> "Edit Product" if "products" is "Products"
             }
        }
    }


    // Fallback to primary segment if still no specific label
    const primarySegment = pathname.split('/')[2]; 
    const fallbackItem = currentNavItems.find(item => item.id === primarySegment);
    if (fallbackItem) return fallbackItem.label;
    
    return "NGroup Products";
}


function AppShell({ children }: { children: React.ReactNode }) {
  const { 
    isMobile, 
    isCollapsed, 
    toggleCollapse, 
    openMobile, 
    setOpenMobile, 
    navItems, 
    userRole,
    activePath 
  } = useSidebarContext();

  const currentPageLabel = useMemo(
    () => calculateCurrentPageLabel(activePath, userRole, navItems),
    [activePath, userRole, navItems]
  );

  const sidebarActualContent = (
    <React.Fragment>
      <AppNewSidebarHeader>
          <AppLogo size={isMobile ? "sm" : (isCollapsed ? "iconOnly" : "sm")} />
      </AppNewSidebarHeader>
      <AppNewSidebarContent />
      <AppNewSidebarFooter>
      {(!isCollapsed || isMobile) && (
          <p className="text-xs text-sidebar-foreground/70">&copy; {new Date().getFullYear()} NGroup</p>
      )}
      </AppNewSidebarFooter>
    </React.Fragment>
  );

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <div className="flex h-screen bg-background">
          <SheetContent 
            side="left" 
            className="p-0 w-[280px] flex flex-col data-[state=closed]:duration-200 data-[state=open]:duration-300 bg-sidebar text-sidebar-foreground border-r-0"
          >
             <div className="sticky top-0 z-10 flex h-16 items-center justify-end border-b border-sidebar-border px-4">
                 {/* AppLogo removed from here to avoid duplication with AppNewSidebarHeader */}
                 <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setOpenMobile(false)}>
                        <X className="h-5 w-5" />
                        <span className="sr-only">Close sidebar</span>
                    </Button>
                 </SheetTrigger>
            </div>
            <AppNewSidebar className="flex-1 overflow-y-auto">
              {sidebarActualContent}
            </AppNewSidebar>
          </SheetContent>

          <div className="flex-1 flex flex-col overflow-x-hidden">
            <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card/95 px-4 backdrop-blur-sm sm:px-6">
              <div className="flex items-center gap-2">
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setOpenMobile(true)}>
                    <PanelLeft className="h-5 w-5" />
                    <span className="sr-only">Open sidebar</span>
                  </Button>
                </SheetTrigger>
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
      </Sheet>
    );
  }

  // Desktop Layout
  return (
    <div className="flex h-screen bg-background">
      <AppNewSidebar
        className={cn(
          "fixed top-0 left-0 z-40 border-r border-sidebar-border",
          "transition-all duration-300 ease-in-out",
          isCollapsed ? `w-[${sidebarVars.collapsed}]` : `w-[${sidebarVars.expanded}]`
        )}
      >
        {sidebarActualContent}
      </AppNewSidebar>
      
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out overflow-x-hidden",
          isCollapsed ? `ml-[${sidebarVars.collapsed}]` : `ml-[${sidebarVars.expanded}]`
        )}
      >
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card/95 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleCollapse}>
              {isCollapsed ? <PanelLeft className="h-5 w-5" /> : <X className="h-5 w-5" />}
              <span className="sr-only">{isCollapsed ? "Expand sidebar" : "Collapse sidebar"}</span>
            </Button>
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
  const { currentUser, login, logout } = useAuth(); 
  const router = useRouter();
  const pathname = usePathname();
  const isMobileView = useIsMobile(); 
  const [openMobileSidebar, setOpenMobileSidebar] = useState(false);

  useEffect(() => {
    if (currentUser === undefined) return; 

    if (!currentUser && !pathname.startsWith('/_next/')) { 
      router.replace("/");
    }
  }, [currentUser, router, pathname]);

  if (currentUser === undefined || isMobileView === undefined) { 
    return <GlobalPreloaderScreen message="Initializing..." />;
  }

  if (!currentUser && !pathname.startsWith('/_next/')) {
    return <GlobalPreloaderScreen message="Redirecting to login..." />;
  }
  
  const userRole = currentUser?.role;
  const currentNavItemsForUser = userRole 
    ? ALL_NAV_ITEMS.filter(item => item.allowedRoles.includes(userRole)) 
    : [];

  return (
    <NewSidebarProvider 
      navItems={currentNavItemsForUser} 
      userRole={userRole} 
      isMobile={isMobileView} 
      openMobile={openMobileSidebar} 
      setOpenMobile={setOpenMobileSidebar} 
    >
      <AppShell>{children}</AppShell>
    </NewSidebarProvider>
  );
}
