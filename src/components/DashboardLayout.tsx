"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("id");
    }

    // Force navigation + reload to clear any cached state
    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-800 text-white p-6">
        <h2 className="text-xl font-bold mb-6">Dashboard</h2>
        <ul className="space-y-3">
          <li>
            <Link href="/dashboard">Booking Form</Link>
          </li>
          <li>
            <Link href="/dashboard/bookings">Previous Bookings</Link>
          </li>
          <li>
            <button onClick={handleLogout} className="text-red-400">Logout</button>
          </li>
        </ul>
      </aside>
      <main className="flex-1 p-6 bg-gray-100 overflow-y-auto">{children}</main>
    </div>
  );
}
