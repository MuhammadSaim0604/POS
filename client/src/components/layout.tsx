import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tags,
  Truck,
  Receipt,
  BarChart3,
  AlertTriangle,
  Settings,
  HelpCircle,
  Menu,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/use-settings";

function matchesShortcut(e: KeyboardEvent, shortcut: string): boolean {
  if (!shortcut) return false;
  const parts = shortcut.toLowerCase().split("+").map((p) => p.trim());
  const needsCtrl = parts.includes("ctrl");
  const needsShift = parts.includes("shift");
  const needsAlt = parts.includes("alt");
  const keyPart = parts.find((p) => !["ctrl", "shift", "alt", "meta"].includes(p)) || "";
  const eventKey = e.key.toLowerCase();
  let keyMatches = false;
  if (keyPart === "space") keyMatches = e.key === " ";
  else if (keyPart === "enter") keyMatches = e.key === "Enter";
  else keyMatches = eventKey === keyPart;
  return e.ctrlKey === needsCtrl && e.shiftKey === needsShift && e.altKey === needsAlt && keyMatches;
}

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  {
    icon: Receipt,
    label: "Bills",
    href: "/bills",
    submenu: [
      { label: "All Bills", href: "/bills" },
      { label: "Create Bill", href: "/bills/create" },
    ],
  },
  { icon: Package, label: "Medicines", href: "/medicines" },
  { icon: Tags, label: "Categories", href: "/categories" },
  { icon: Truck, label: "Restock", href: "/restock" },
  { icon: ShoppingCart, label: "Sales History", href: "/sales" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: AlertTriangle, label: "Low Stock", href: "/alerts" },
  { icon: Settings, label: "Settings", href: "/settings" },
  { icon: HelpCircle, label: "Help", href: "/help" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { settings } = useSettings();

  const initialExpanded = location.startsWith("/bills") ? "Bills" : null;
  const [expandedMenu, setExpandedMenu] = useState<string | null>(
    initialExpanded,
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (matchesShortcut(e, settings?.shortcutGoToCreateBill || "Ctrl+B")) {
        e.preventDefault();
        setLocation("/bills/create");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [settings, setLocation]);

  // Auto-expand Bills when navigating to it
  useEffect(() => {
    if (location.startsWith("/bills")) {
      setExpandedMenu("Bills");
      setIsCollapsed(false);
    }
  }, [location]);

  const NavContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <div
      className={`flex flex-col h-full bg-slate-900 text-white shadow-2xl transition-all duration-300 ${collapsed ? "w-20" : "w-64"}`}
    >
      <div
        className={`p-6 border-b border-white/10 ${collapsed ? "items-center px-4" : ""} flex flex-col`}
      >
        {!collapsed ? (
          <>
            <h1 className="text-2xl font-bold font-display tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent truncate max-w-full">
              {settings?.storeName || "Nexus POS"}
            </h1>
            <p className="text-xs text-slate-400 mt-1">v2.0.1 Enterprise</p>
          </>
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-bold text-xl">
            {settings?.storeName?.charAt(0) || "N"}
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {sidebarItems.map((item) => {
          const isActive = location === item.href;
          const isSubmenuOpen = expandedMenu === item.label;
          const hasSubmenu = (item as any).submenu?.length > 0;

          return (
            <div key={item.href}>
              <div className="relative group">
                <Link href={item.href}>
                  <button
                    onClick={() => {
                      if (hasSubmenu) {
                        setExpandedMenu(isSubmenuOpen ? null : item.label);
                      } else {
                        setMobileOpen(false);
                      }
                    }}
                    className={`w-full flex items-center justify-between space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? "bg-primary text-white shadow-lg shadow-primary/25 font-semibold"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    } ${collapsed ? "justify-center px-0" : ""}`}
                  >
                    <div
                      className={`flex items-center ${collapsed ? "justify-center" : "space-x-3"} w-full`}
                    >
                      <item.icon
                        className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-500 group-hover:text-white"}`}
                      />
                      {!collapsed && <span>{item.label}</span>}
                    </div>
                    {!collapsed && hasSubmenu && (
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${isSubmenuOpen ? "rotate-180" : ""}`}
                      />
                    )}
                  </button>
                </Link>
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </div>

              {!collapsed && hasSubmenu && isSubmenuOpen && (
                <div className="mt-1 ml-4 space-y-1">
                  {(item as any).submenu.map((subitem: any) => {
                    const isSubActive = location === subitem.href;
                    return (
                      <Link key={subitem.href} href={subitem.href}>
                        <button
                          onClick={() => setMobileOpen(false)}
                          className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 text-sm ${
                            isSubActive
                              ? "bg-primary/20 text-white font-medium"
                              : "text-slate-400 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <span>{subitem.label}</span>
                        </button>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div
        className={`p-4 border-t border-white/10 bg-slate-950/30 ${collapsed ? "flex justify-center" : ""}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent to-primary flex items-center justify-center text-white font-bold shrink-0">
            {settings?.storeName?.slice(0, 2).toUpperCase() || "AD"}
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-medium truncate w-32">
                {settings?.storeName || "Admin User"}
              </p>
              <p className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />{" "}
                Online
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      {/* Desktop Sidebar Toggle - Positioned Outside */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden lg:flex absolute top-4 left-[248px] z-50 w-8 h-8 items-center justify-center bg-slate-900 text-white rounded-full border border-white/10 shadow-lg hover:bg-slate-800 transition-all duration-300"
        style={{ left: isCollapsed ? "80px" : "256px" }}
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block h-full shrink-0 transition-all duration-300 overflow-hidden ${isCollapsed ? "w-20" : "w-64"}`}
      >
        <NavContent collapsed={isCollapsed} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b bg-card">
          <h1 className="text-xl font-bold text-primary">
            {settings?.storeName || "Nexus POS"}
          </h1>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 border-r-0">
              <NavContent />
            </SheetContent>
          </Sheet>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 animate-enter">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
