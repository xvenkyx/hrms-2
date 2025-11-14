import { Link, Outlet, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"

export default function MainLayout() {
  const location = useLocation()

  const menu = [
    { name: "Dashboard", path: "/" },
    { name: "Employees", path: "/employees" },
    { name: "Attendance", path: "/attendance" },
    { name: "Performance Bonus", path: "/bonus" },
    { name: "Settings", path: "/settings" },
    { name: "Generate Slip", path: "/generate-slip" },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r p-4 flex flex-col">
        <h1 className="text-xl font-bold mb-6">Payroll System</h1>

        <nav className="flex flex-col gap-2">
          {menu.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100",
                location.pathname === item.path && "bg-gray-200 font-semibold"
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
