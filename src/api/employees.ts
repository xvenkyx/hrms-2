// api/employees.ts
const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://ic9wiavkl4.execute-api.us-east-1.amazonaws.com/Stage1";

// Get ID token from Cognito (stored by react-oidc-context)
const getIdToken = (): string | null => {
  try {
    // Check for the OIDC user in localStorage
    const userStr = localStorage.getItem(
      "oidc.user:https://cognito-idp.us-east-1.amazonaws.com/us-east-1_CzTJ6iNyo:3dpb9telsc7meq8hv8bt8in391"
    );
    
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id_token || user.access_token;
    }
    
    // Fallback to sessionToken for backward compatibility during migration
    const sessionToken = localStorage.getItem("sessionToken");
    return sessionToken;
  } catch (error) {
    console.error("Error getting token:", error);
    return null;
  }
};

// Add authorization token to all requests
const getAuthHeaders = () => {
  const token = getIdToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    console.log("🔑 Using token for request");
  } else {
    console.warn("⚠️ No token found for request");
  }

  return headers;
};

// Helper function to handle redirect to login
const redirectToLogin = () => {
  localStorage.removeItem("sessionToken");
  localStorage.removeItem("user");
  // Clear OIDC user as well
  localStorage.removeItem("oidc.user:https://cognito-idp.us-east-1.amazonaws.com/us-east-1_CzTJ6iNyo:3dpb9telsc7meq8hv8bt8in391");
  window.location.href = "/login";
};

export async function fetchEmployees(): Promise<any[]> {
  const response = await fetch(`${API_BASE}/employees`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      redirectToLogin();
    }
    throw new Error("Failed to fetch employees");
  }

  const data = await response.json();
  return data.employees.map((emp: any) => ({
    ...emp,
    name: `${emp.firstName || ""} ${emp.lastName || ""}`.trim(),
  }));
}

export async function getEmployeeById(employeeId: string): Promise<any | null> {
  const response = await fetch(`${API_BASE}/employees/${employeeId}`, {
    headers: getAuthHeaders(),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      redirectToLogin();
    }
    throw new Error("Failed to fetch employee");
  }

  const data = await response.json();
  return data.employee;
}

export async function getMyProfile(): Promise<any> {
  try {
    const token = getIdToken();

    if (!token) {
      console.log("❌ No authentication token found");
      redirectToLogin();
      return null;
    }

    console.log("🔍 Using /auth endpoint to get profile");

    // For Cognito, we need to validate the token differently
    // First try the validate endpoint
    const response = await fetch(`${API_BASE}/auth`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        action: "validate",
        sessionToken: token,
      }),
    });

    console.log("📥 Response status:", response.status);

    if (!response.ok) {
      // If validation fails, try to get profile from employees endpoint
      console.log("🔄 Validation failed, trying alternative approach");
      
      // Get the current user's email from Cognito token
      const userStr = localStorage.getItem(
        "oidc.user:https://cognito-idp.us-east-1.amazonaws.com/us-east-1_CzTJ6iNyo:3dpb9telsc7meq8hv8bt8in391"
      );
      
      if (userStr) {
        const user = JSON.parse(userStr);
        const email = user.profile?.email || user.profile?.preferred_username;
        
        if (email) {
          // Search for employee by email
          const allEmployees = await fetchEmployees();
          const currentEmployee = allEmployees.find(emp => 
            emp.company_email === email || emp.email === email
          );
          
          if (currentEmployee) {
            console.log("✅ Found employee via email lookup");
            localStorage.setItem('user', JSON.stringify(currentEmployee));
            return currentEmployee;
          }
        }
      }
      
      console.error("❌ Auth validation failed:", response.status);
      redirectToLogin();
      return null;
    }

    const data = await response.json();
    console.log("✅ Auth response received:", data);

    if (data.valid && data.employee) {
      console.log("✅ Employee data found via validation");
      localStorage.setItem('user', JSON.stringify(data.employee));
      return data.employee;
    } else if (data.employee) {
      // Some endpoints might return employee directly
      console.log("✅ Employee data found directly");
      localStorage.setItem('user', JSON.stringify(data.employee));
      return data.employee;
    } else {
      console.error("❌ Invalid session or no employee data");
      redirectToLogin();
      return null;
    }
  } catch (error) {
    console.error("❌ Error fetching profile:", error);
    // Don't redirect immediately on network errors
    // Try to use cached user first
    const cachedUser = localStorage.getItem('user');
    if (cachedUser) {
      console.log("⚠️ Using cached user due to network error");
      return JSON.parse(cachedUser);
    }
    redirectToLogin();
    return null;
  }
}

export async function createEmployee(
  employeeData: any
): Promise<{ message: string; employee: any }> {
  const response = await fetch(`${API_BASE}/employees`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(employeeData),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      redirectToLogin();
    }
    const errorText = await response.text();
    throw new Error(
      `Failed to create employee: ${response.status} ${errorText}`
    );
  }

  return response.json();
}

export async function updateEmployee(
  employeeId: string,
  updates: any
): Promise<any> {
  const response = await fetch(`${API_BASE}/employees/${employeeId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      redirectToLogin();
    }
    const errorText = await response.text();
    throw new Error(
      `Failed to update employee: ${response.status} ${errorText}`
    );
  }

  return response.json();
}

export async function deleteEmployee(employeeId: string): Promise<any> {
  const response = await fetch(`${API_BASE}/employees/${employeeId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      redirectToLogin();
    }
    throw new Error("Failed to delete employee");
  }

  return response.json();
}

// ==================== LEAVE REQUEST FUNCTIONS ====================

/**
 * Submit a new leave request
 */
export async function submitLeaveRequest(leaveData: {
  yearMonth: string;
  days: number;
  leaveType: "casual" | "sick" | "earned";
  reason?: string;
}): Promise<{ message: string; request: any }> {
  const response = await fetch(`${API_BASE}/leave-requests`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(leaveData),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      redirectToLogin();
    }
    const errorText = await response.text();
    throw new Error(
      `Failed to submit leave request: ${response.status} ${errorText}`
    );
  }

  return response.json();
}

/**
 * Get current user's leave requests
 */
export async function getMyLeaveRequests(): Promise<any[]> {
  try {
    // First get the employee profile to get employeeId
    const profile = await getMyProfile();
    if (!profile || !profile.employeeId) {
      throw new Error("Unable to load employee profile");
    }

    const employeeId = profile.employeeId;
    console.log("Getting leave requests for employee:", employeeId);

    // Call the API with employeeId as query parameter
    const response = await fetch(
      `${API_BASE}/my-leave-requests?employeeId=${encodeURIComponent(
        employeeId
      )}`,
      {
        headers: getAuthHeaders(),
        method: "GET",
      }
    );

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        redirectToLogin();
      }
      const errorText = await response.text();
      console.error("API Error Response:", errorText);
      throw new Error("Failed to fetch leave requests");
    }

    const data = await response.json();
    return data.requests || [];
  } catch (error) {
    console.error("Error in getMyLeaveRequests:", error);
    throw error;
  }
}

/**
 * Get all leave requests (for HR/Admin)
 */
export async function getAllLeaveRequests(status?: string): Promise<any[]> {
  const url = status
    ? `${API_BASE}/leave-requests?status=${status}`
    : `${API_BASE}/leave-requests`;

  const response = await fetch(url, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      redirectToLogin();
    }
    throw new Error("Failed to fetch leave requests");
  }

  const data = await response.json();
  return data.requests || [];
}

/**
 * Approve or reject a leave request (for HR/Admin)
 */
export async function processLeaveRequest(
  requestId: string,
  action: "approve" | "reject",
  comments?: string
): Promise<{ message: string; requestId: string; status: string }> {
  const response = await fetch(`${API_BASE}/leave-requests/${requestId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ action, comments: comments || "" }),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      redirectToLogin();
    }
    const errorText = await response.text();
    throw new Error(
      `Failed to process leave request: ${response.status} ${errorText}`
    );
  }

  return response.json();
}

/**
 * Check if user has pending leave request for a specific month
 */
export async function hasPendingLeaveForMonth(
  yearMonth: string
): Promise<boolean> {
  try {
    const myRequests = await getMyLeaveRequests();
    return myRequests.some(
      (request) =>
        request.yearMonth === yearMonth && request.status === "pending"
    );
  } catch (error) {
    console.error("Error checking pending leaves:", error);
    return false;
  }
}

/**
 * Get leave statistics for current user
 */
export async function getMyLeaveStats(): Promise<{
  totalLeaves: number;
  leavesRemaining: number;
  casualLeavesUsed: number;
  casualLeavesTotal: number;
  sickLeavesUsed: number;
  sickLeavesTotal: number;
  pendingRequests: number;
  approvedRequests: number;
}> {
  try {
    // Get employee profile and leave requests
    const profile = await getMyProfile();
    const myRequests = await getMyLeaveRequests();

    const pendingRequests = myRequests.filter(
      (r) => r.status === "pending"
    ).length;
    const approvedRequests = myRequests.filter(
      (r) => r.status === "approved"
    ).length;

    return {
      totalLeaves: profile?.totalLeaves || 0,
      leavesRemaining: profile?.leavesRemaining || 0,
      casualLeavesUsed: profile?.casualLeavesUsed || 0,
      casualLeavesTotal: profile?.casualLeavesTotal || 4,
      sickLeavesUsed: profile?.sickLeavesUsed || 0,
      sickLeavesTotal: profile?.sickLeavesTotal || 2,
      pendingRequests,
      approvedRequests,
    };
  } catch (error) {
    console.error("Error getting leave stats:", error);
    return {
      totalLeaves: 0,
      leavesRemaining: 0,
      casualLeavesUsed: 0,
      casualLeavesTotal: 4,
      sickLeavesUsed: 0,
      sickLeavesTotal: 2,
      pendingRequests: 0,
      approvedRequests: 0,
    };
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Clear all authentication data
 */
export function clearAuthData(): void {
  localStorage.removeItem("sessionToken");
  localStorage.removeItem("user");
  localStorage.removeItem(
    "oidc.user:https://cognito-idp.us-east-1.amazonaws.com/us-east-1_CzTJ6iNyo:3dpb9telsc7meq8hv8bt8in391"
  );
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const token = getIdToken();
  const user = localStorage.getItem('user');
  return !!(token && user);
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser(): any | null {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing user:', error);
    return null;
  }
}