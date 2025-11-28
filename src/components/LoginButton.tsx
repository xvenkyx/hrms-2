import { useAuth } from "react-oidc-context";
import { useEffect } from "react";

export function LoginButton() {
  const auth = useAuth();

  // Only log when auth state actually changes
  useEffect(() => {
    console.log("Auth state changed:", {
      isLoading: auth.isLoading,
      isAuthenticated: auth.isAuthenticated,
      error: auth.error,
      user: auth.user
    });
  }, [auth.isLoading, auth.isAuthenticated, auth.error, auth.user]);

  const handleLogout = () => {
    const clientId = "1kmj8u7md1c1nrkhm2u6ues9q7";
    const logoutUri = "http://localhost:5173";
    const cognitoDomain = "https://us-east-1jx03mebux.auth.us-east-1.amazoncognito.com";
    
    auth.removeUser();
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };

  if (auth.isLoading) {
    return <div className="text-sm">Loading...</div>;
  }

  if (auth.error) {
    return <div className="text-sm text-red-600">Error: {auth.error.message}</div>;
  }

  if (auth.isAuthenticated) {
    return (
      <div className="flex items-center space-x-3">
        <span className="text-sm text-gray-700">
          👋 {auth.user?.profile.email}
        </span>
        <button 
          onClick={handleLogout}
          className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md transition-colors"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={() => auth.signinRedirect()}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
    >
      Sign in
    </button>
  );
}