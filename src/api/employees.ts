const API_BASE = import.meta.env.VITE_API_BASE || 'https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod';

// Add session token to all requests
const getAuthHeaders = () => {
  const token = localStorage.getItem('sessionToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export async function fetchEmployees(): Promise<any[]> {
  const response = await fetch(`${API_BASE}/employees`, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch employees');
  }
  
  const data = await response.json();
  return data.employees || [];
}

export async function getEmployeeById(employeeId: string): Promise<any | null> {
  const response = await fetch(`${API_BASE}/employees/${employeeId}`, {
    headers: getAuthHeaders()
  });
  
  if (response.status === 404) {
    return null;
  }
  
  if (!response.ok) {
    throw new Error('Failed to fetch employee');
  }
  
  const data = await response.json();
  return data.employee;
}

export async function getMyProfile(): Promise<any> {
  const response = await fetch(`${API_BASE}/my-profile`, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }
  
  const data = await response.json();
  return data.employee;
}

export async function createEmployee(employeeData: any): Promise<{ message: string; employee: any }> {
  const response = await fetch(`${API_BASE}/employees`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(employeeData)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create employee: ${response.status} ${errorText}`);
  }
  
  return response.json();
}

export async function updateEmployee(employeeId: string, updates: any): Promise<any> {
  const response = await fetch(`${API_BASE}/employees/${employeeId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates)
  });
  
  if (!response.ok) {
    throw new Error('Failed to update employee');
  }
  
  return response.json();
}

export async function deleteEmployee(employeeId: string): Promise<any> {
  const response = await fetch(`${API_BASE}/employees/${employeeId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete employee');
  }
  
  return response.json();
}