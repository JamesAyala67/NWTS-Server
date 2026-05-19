import { useState } from "react";
import { Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";

// Assuming you pass these down from your main App or Auth context
interface LayoutProps {
  children: React.ReactNode;
  userRole: string;
  userName: string;
  activePath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export default function DashboardLayout({
  children,
  userRole,
  userName,
  activePath,
  onNavigate,
  onLogout,
}: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Wrap the navigation handler to close the mobile menu when a link is clicked
  const handleNavigate = (path: string) => {
    onNavigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F9F8F3] flex font-sans">
      {/* 1. Desktop Sidebar (Hidden on Mobile) */}
      <div className="hidden md:block shrink-0">
        <Sidebar
          userRole={userRole}
          userName={userName}
          activePath={activePath}
          onNavigate={handleNavigate}
          onLogout={onLogout}
        />
      </div>

      {/* 2. Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 3. Mobile Sidebar (Slides in from left) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          userRole={userRole}
          userName={userName}
          activePath={activePath}
          onNavigate={handleNavigate}
          onLogout={onLogout}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header (Only visible on small screens) */}
        <header className="md:hidden bg-[#4A5D4E] text-white p-4 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-serif font-bold tracking-wide">
              NEW HEAVEN'S WAY
            </h1>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1 hover:bg-white/10 rounded-md transition"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </header>

        {/* The actual page content goes here! */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
