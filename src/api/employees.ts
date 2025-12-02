const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://ic9wiavkl4.execute-api.us-east-1.amazonaws.com/Stage1";

// Add session token to all requests
const getAuthHeaders = () => {
  const token = localStorage.getItem("sessionToken");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json"
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return headers;
};

export async function fetchEmployees(): Promise<any[]> {
  const response = await fetch(`${API_BASE}/employees`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
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
    throw new Error("Failed to fetch employee");
  }

  const data = await response.json();
  return data.employee;
}

export async function getMyProfile(): Promise<any> {
  try {
    const sessionToken = localStorage.getItem('sessionToken');
    
    if (!sessionToken) {
      console.log("❌ No session token found");
      window.location.href = '/login';
      return null;
    }

    console.log("🔍 Using /auth endpoint to get profile");
    
    // Use /auth endpoint with validate action (this works!)
    const response = await fetch(`${API_BASE}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        action: 'validate',
        sessionToken: sessionToken
      })
    });

    console.log("📥 Response status:", response.status);
    
    if (!response.ok) {
      console.error("❌ Auth validation failed:", response.status);
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return null;
    }
    
    const data = await response.json();
    console.log("✅ Auth response received:", data);
    
    if (data.valid && data.employee) {
      console.log("✅ Employee data found");
      return data.employee;
    } else {
      console.error("❌ Invalid session or no employee data");
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return null;
    }
    
  } catch (error) {
    console.error("❌ Error fetching profile:", error);
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
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
    const errorText = await response.text();
    throw new Error(`Failed to update employee: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function deleteEmployee(employeeId: string): Promise<any> {
  const response = await fetch(`${API_BASE}/employees/${employeeId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to delete employee");
  }

  return response.json();
}


// Add these functions to your existing employees.ts file

// ==================== LEAVE REQUEST FUNCTIONS ====================

/**
 * Submit a new leave request
 */
export async function submitLeaveRequest(leaveData: {
  yearMonth: string;
  days: number;
  leaveType: 'casual' | 'sick' | 'earned';
  reason?: string;
}): Promise<{ message: string; request: any }> {
  const response = await fetch(`${API_BASE}/leave-requests`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(leaveData),
  });

  if (!response.ok) {
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
  const response = await fetch(`${API_BASE}/my-leave-requests`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch leave requests");
  }

  const data = await response.json();
  return data.requests || [];
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
  action: 'approve' | 'reject',
  comments?: string
): Promise<{ message: string; requestId: string; status: string }> {
  const response = await fetch(`${API_BASE}/leave-requests/${requestId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ action, comments: comments || '' }),
  });

  if (!response.ok) {
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
export async function hasPendingLeaveForMonth(yearMonth: string): Promise<boolean> {
  try {
    const myRequests = await getMyLeaveRequests();
    return myRequests.some(
      (request) => 
        request.yearMonth === yearMonth && 
        request.status === 'pending'
    );
  } catch (error) {
    console.error('Error checking pending leaves:', error);
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
    // Get employee profile
    const profile = await getMyProfile();
    const myRequests = await getMyLeaveRequests();
    
    const pendingRequests = myRequests.filter(r => r.status === 'pending').length;
    const approvedRequests = myRequests.filter(r => r.status === 'approved').length;
    
    return {
      totalLeaves: profile?.totalLeaves || 0,
      leavesRemaining: profile?.leavesRemaining || 0,
      casualLeavesUsed: profile?.casualLeavesUsed || 0,
      casualLeavesTotal: profile?.casualLeavesTotal || 0,
      sickLeavesUsed: profile?.sickLeavesUsed || 0,
      sickLeavesTotal: profile?.sickLeavesTotal || 0,
      pendingRequests,
      approvedRequests
    };
  } catch (error) {
    console.error('Error getting leave stats:', error);
    return {
      totalLeaves: 0,
      leavesRemaining: 0,
      casualLeavesUsed: 0,
      casualLeavesTotal: 0,
      sickLeavesUsed: 0,
      sickLeavesTotal: 0,
      pendingRequests: 0,
      approvedRequests: 0
    };
  }
}