import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar is fixed on the left */}
      <Sidebar />
      
      {/* Main content area on the right */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}