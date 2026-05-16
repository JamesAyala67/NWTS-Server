// Sidebar component with role based navigation
// Where Admin can access all links
// Staff can only access Dashboard, Clients, and Plot Map
// (waiting to be finalized dae ko aram kung okay yn)

import {
  LayoutDashboard,
  Users,
  Map,
  ClipboardList,
  Clock,
  User as UserIcon,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  userRole: "Admin" | "Staff" | string;
  userName: string;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export default function Sidebar({
  userRole,
  userName,
  activePath,
  onNavigate,
  onLogout,
}: SidebarProps) {
  // Define navigation items
  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      adminOnly: false,
    },
    { name: "Clients", path: "/clients", icon: Users, adminOnly: false },
    { name: "Plot Map", path: "/plots", icon: Map, adminOnly: false },
    { name: "Request", path: "/request", icon: ClipboardList, adminOnly: true },
    { name: "Logs", path: "/logs", icon: Clock, adminOnly: true },
    { name: "Account", path: "/account", icon: UserIcon, adminOnly: true },
  ];

  return (
    <aside className="w-64 bg-[#4A5D4E] text-white flex-col justify-between hidden md:flex shadow-xl min-h-screen">
      <div>
        {/* Header Area */}
        <div className="p-6 pt-8 flex items-center gap-3 border-b border-[#5a6e5e]">
          <div>
            <h1 className="text-sm font-serif font-bold text-[#f9f8f3] tracking-wide leading-tight">
              NEW HEAVEN'S WAY
            </h1>
            <p className="text-[10px] text-[#e2dcc8] tracking-widest uppercase">
              Memorial Garden
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-2 mt-4">
          {navItems.map((item) => {
            // Hide admin only items if the user is not an Admin
            if (item.adminOnly && userRole !== "Admin") return null;

            const isActive = activePath === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                onClick={() => onNavigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
                  isActive
                    ? "bg-white/20 text-white shadow-sm"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="h-5 w-5" /> {item.name}
              </button>
            );
          })}

          {/* Logout Button */}
          <div className="pt-4 mt-4 border-t border-[#5a6e5e]">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 text-white/70 hover:text-white hover:bg-white/10 px-4 py-3 rounded-lg font-medium transition"
            >
              <LogOut className="h-5 w-5" /> Logout
            </button>
          </div>
        </nav>
      </div>

      {/* Footer / User Profile Area */}
      <div className="p-6 bg-[#3b4b3e] flex items-center justify-between mt-auto">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[#f9f8f3] text-[#4A5D4E] flex items-center justify-center font-bold shadow-inner uppercase">
            {/* Grab the first letter of the user's name for the avatar */}
            {userName ? userName.charAt(0) : "?"}
          </div>
          <div className="flex flex-col text-left">
            <p className="text-sm font-bold text-white leading-tight">
              {userName}
            </p>
            <p className="text-xs text-white/70 mt-0.5">{userRole}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
