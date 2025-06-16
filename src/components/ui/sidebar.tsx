
"use client";

import * as React from "react";
import { PanelLeft, X, ChevronDown, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger as RadixAccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import type { NavItemConfig, UserRole } from "@/lib/types";
import { AppLogo } from "@/components/AppLogo"; // Import AppLogo

const SIDEBAR_WIDTH_EXPANDED = "256px";
const SIDEBAR_WIDTH_COLLAPSED = "80px";

interface SidebarContextProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  isMobile: boolean;
  activePath: string;
  userRole?: UserRole;
  navItems: NavItemConfig[];
  defaultOpenAccordion?: string;
}

const SidebarContext = React.createContext<SidebarContextProps | undefined>(undefined);

export function useSidebarContext() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarContext must be used within a SidebarProvider");
  }
  return context;
}

interface SidebarProviderProps {
  children: React.ReactNode;
  navItems: NavItemConfig[];
  userRole?: UserRole;
  isMobile: boolean;
}

export function SidebarProvider({ children, navItems, userRole, isMobile }: SidebarProviderProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const pathname = usePathname();

  const toggleCollapse = () => {
    if (!isMobile) { // Collapse toggle only for desktop
      setIsCollapsed(!isCollapsed);
    }
  };
  
  const currentNavItemsForUser = userRole
    ? navItems.filter(item => item.allowedRoles.includes(userRole))
    : [];

  const defaultOpenAccordion = userRole ? currentNavItemsForUser.find(item => item.children && item.children.filter(child => child.allowedRoles.includes(userRole)).some(child => child.href && pathname.startsWith(child.href!)))?.id : undefined;


  return (
    <SidebarContext.Provider
      value={{
        isCollapsed: isMobile ? false : isCollapsed,
        toggleCollapse,
        isMobile,
        activePath: pathname,
        userRole,
        navItems: currentNavItemsForUser,
        defaultOpenAccordion,
      }}
    >
      <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
    </SidebarContext.Provider>
  );
}

// This is the trigger component to be placed in the main App Header
export function AppHeaderSidebarTrigger() {
  const { isMobile, isCollapsed, toggleCollapse } = useSidebarContext();

  if (isMobile) {
    return (
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Open Sidebar</span>
        </Button>
      </SheetTrigger>
    );
  }

  // Desktop trigger
  return (
    <Button variant="ghost" size="icon" className="hidden md:flex h-9 w-9" onClick={toggleCollapse}>
      {isCollapsed ? <PanelLeft className="h-5 w-5" /> : <X className="h-5 w-5" />}
      <span className="sr-only">{isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}</span>
    </Button>
  );
}


export function Sidebar({ children, className }: { children: React.ReactNode, className?: string }) {
  const { isCollapsed, isMobile } = useSidebarContext();

  const sidebarStyles = cn(
    "flex flex-col h-full bg-card text-card-foreground border-r border-border",
    "transition-all duration-300 ease-in-out",
    className
  );

  const sidebarDesktopStyles = isCollapsed ? `w-[${SIDEBAR_WIDTH_COLLAPSED}]` : `w-[${SIDEBAR_WIDTH_EXPANDED}]`;

  const sidebarContentInternal = (
    <div className={cn(sidebarStyles, isMobile ? "w-full" : sidebarDesktopStyles)}>
      {children}
    </div>
  );

  if (isMobile) {
    // SheetContent will wrap the sidebar structure for mobile
    return (
      <SheetContent side="left" className="p-0 w-[280px] flex data-[state=closed]:duration-200 data-[state=open]:duration-300">
        {sidebarContentInternal}
      </SheetContent>
    );
  }

  // For desktop, the sidebar is fixed positioned by AppShell
  return sidebarContentInternal;
}

export function SidebarHeader({ children, className }: { children: React.ReactNode, className?: string }) {
  const { isCollapsed } = useSidebarContext();
  return (
    <div className={cn(
        "h-16 flex items-center border-b border-border",
        isCollapsed ? "justify-center px-2" : "px-4 justify-between",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SidebarContent({ className }: { className?: string }) {
  const { navItems, defaultOpenAccordion } = useSidebarContext();
  
  return (
    <ScrollArea className={cn("flex-1", className)}>
      <nav className="px-2 py-4">
        <Accordion type="single" collapsible className="w-full" defaultValue={defaultOpenAccordion}>
          {navItems.map((item) => (
            <SidebarNavItem key={item.id} item={item} />
          ))}
        </Accordion>
      </nav>
    </ScrollArea>
  );
}

interface SidebarNavItemProps {
  item: NavItemConfig;
}

function SidebarNavItem({ item }: SidebarNavItemProps) {
  const { isCollapsed, activePath, userRole } = useSidebarContext();
  const Icon = item.icon;

  const checkIsActive = (path: string, navHref?: string) => {
    if (!navHref) return false;
    if (navHref === "/app/dashboard") return path === navHref || path.startsWith(navHref + '/');
    return path === navHref || (navHref !== "/" && path.startsWith(navHref + '/') );
  };
  
  const isActive = item.href
    ? checkIsActive(activePath, item.href)
    : (item.children && userRole ? item.children.filter(c => c.allowedRoles.includes(userRole)).some(child => child.href && checkIsActive(activePath, child.href)) : false);


  if (item.children && item.children.length > 0) {
    const filteredChildren = userRole ? item.children.filter(child => child.allowedRoles.includes(userRole)) : [];
    if (filteredChildren.length === 0) return null;

    return (
      <AccordionItem value={item.id} className="border-b-0 mb-1">
        <Tooltip disableHoverableContent={!isCollapsed}>
          <TooltipTrigger asChild>
            <RadixAccordionTrigger
              className={cn(
                "flex items-center w-full rounded-md text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "transition-colors duration-150 group",
                isCollapsed ? "justify-center h-12" : "justify-between h-11 px-3 py-2",
                isActive && !isCollapsed && "bg-primary/10 text-primary",
                isActive && isCollapsed && "bg-primary text-primary-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn("h-5 w-5 shrink-0", isActive && isCollapsed ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </div>
              {!isCollapsed && <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 accordion-chevron" />}
            </RadixAccordionTrigger>
          </TooltipTrigger>
          {isCollapsed && <TooltipContent side="right">{item.label}</TooltipContent>}
        </Tooltip>
        {!isCollapsed && (
          <AccordionContent className="pl-7 pt-1 pb-0">
            <ul className="space-y-1 border-l border-border pl-4">
              {filteredChildren.map(child => (
                <li key={child.id}>
                  <Link href={child.href!} legacyBehavior passHref>
                    <a
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted",
                        checkIsActive(activePath, child.href) && "bg-muted font-semibold text-primary"
                      )}
                    >
                      {child.icon && <child.icon className="h-4 w-4 text-muted-foreground shrink-0" />}
                      <span className="truncate">{child.label}</span>
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </AccordionContent>
        )}
      </AccordionItem>
    );
  }

  return (
    <Tooltip disableHoverableContent={!isCollapsed}>
      <TooltipTrigger asChild>
        <Link href={item.href!} legacyBehavior passHref>
          <a
            className={cn(
              "flex items-center gap-3 rounded-md text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group",
              "transition-colors duration-150 mb-1",
              isCollapsed ? "justify-center h-12" : "px-3 py-2 h-11",
              isActive && !isCollapsed && "bg-primary/10 text-primary",
              isActive && isCollapsed && "bg-primary text-primary-foreground"
            )}
          >
            <Icon className={cn("h-5 w-5 shrink-0", isActive && isCollapsed ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
            {!isCollapsed && <span className="truncate">{item.label}</span>}
          </a>
        </Link>
      </TooltipTrigger>
      {isCollapsed && <TooltipContent side="right">{item.label}</TooltipContent>}
    </Tooltip>
  );
}

export function SidebarFooter({ children, className }: { children: React.ReactNode, className?: string }) {
   const { isCollapsed } = useSidebarContext();
  return (
    <div className={cn(
        "p-4 border-t border-border mt-auto", 
        isCollapsed ? "flex justify-center" : "",
        className
      )}
    >
      {children}
    </div>
  );
}

export const sidebarVars = {
  expanded: SIDEBAR_WIDTH_EXPANDED,
  collapsed: SIDEBAR_WIDTH_COLLAPSED,
};

    