import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { LoginButton } from "@/components/LoginButton";
import { useAuth } from "react-oidc-context";
import { getEmployeeByCognitoId } from "@/api/employees";

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);
  const auth = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Updated useEffect for checking registration
  useEffect(() => {
    const checkEmployeeRegistration = async () => {
      if (auth.isAuthenticated && auth.user) {
        try {
          console.log("Checking registration for user:", auth.user.profile.sub);
          const employee = await getEmployeeByCognitoId(auth.user.profile.sub);
          const registered = !!employee;
          
          setIsRegistered(registered);

          console.log("Registration check result:", {
            isRegistered: registered,
            path: location.pathname,
          });

          // If NOT registered AND not already on registration page, redirect to register
          if (!registered && location.pathname !== "/register") {
            console.log("Redirecting to registration page");
            navigate("/register");
          }

          // If already registered AND on registration page, redirect to dashboard
          if (registered && location.pathname === "/register") {
            console.log("Already registered, redirecting to dashboard");
            navigate("/");
          }
        } catch (error) {
          console.error("Error checking registration:", error);
          setIsRegistered(false);
        }
      } else {
        setIsRegistered(false);
      }
    };

    if (auth.isAuthenticated) {
      checkEmployeeRegistration();
    } else {
      setIsRegistered(false);
    }
  }, [auth.isAuthenticated, auth.user, location.pathname, navigate]);

  const baseMenu = [
    { name: "Dashboard", path: "/", icon: "📊" },
    { name: "Attendance", path: "/attendance", icon: "📅" },
  ];

  const employeeMenu = [
    { name: "My Profile", path: "/my-profile", icon: "👤" },
    { name: "Leave Requests", path: "/leave-requests", icon: "📋" },
  ];

  const getMenu = () => {
    if (!auth.isAuthenticated) {
      return baseMenu;
    }

    // Show loading state while checking registration
    if (isRegistered === null) {
      return baseMenu;
    }

    if (!isRegistered) {
      // Show only basic menu + registration link
      return [
        ...baseMenu,
        { name: "Complete Registration", path: "/register", icon: "📝" },
      ];
    }

    return [...baseMenu, ...employeeMenu];
  };

  const menu = getMenu();

  // Rest of your component remains the same...
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Company Name */}
            <div className="flex items-center">
              <div className="shrink-0 flex items-center">
                <div className="w-8 h-8 bg-linear-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">J</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">JHEX</h1>
              </div>
            </div>

            {/* Desktop: Login + Time */}
            <div className="hidden md:flex items-center space-x-4">
              <LoginButton />
              <div className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full border">
                🕒 {currentTime.toLocaleTimeString()}
              </div>
              <div className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full border">
                📅 {currentTime.toLocaleDateString()}
              </div>
            </div>

            {/* Mobile: Login + Menu Button */}
            <div className="flex md:hidden items-center space-x-2">
              <LoginButton />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {isMobileMenuOpen ? "✕" : "☰"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:pt-16">
          <div className="flex-1 flex flex-col min-h-0 bg-white border-r">
            <nav className="flex-1 px-4 py-4 space-y-2">
              {menu.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                    location.pathname === item.path
                      ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Mobile Sidebar */}
            <div className="md:hidden fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-linear-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-sm">J</span>
                  </div>
                  <h1 className="text-lg font-bold text-gray-900">JHEX</h1>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  ✕
                </button>
              </div>

              <nav className="px-4 py-4 space-y-2">
                {menu.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                      location.pathname === item.path
                        ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
              </nav>

              {/* Mobile Time Display */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
                <div className="text-center text-sm text-gray-600 space-y-2">
                  <div className="pb-2">
                    <LoginButton />
                  </div>
                  <div>🕒 {currentTime.toLocaleTimeString()}</div>
                  <div>📅 {currentTime.toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Main Content */}
        <main
          className={cn(
            "flex-1 transition-all duration-300",
            isMobileMenuOpen ? "md:ml-64 translate-x-64" : "md:ml-64"
          )}
        >
          <div className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}