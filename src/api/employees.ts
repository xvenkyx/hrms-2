const API_BASE = 'https://ic9wiavkl4.execute-api.us-east-1.amazonaws.com/Stage1';

export interface Employee {
  employee_id: string;
  cognito_user_id: string;
  company_email: string;
  first_name: string;
  last_name: string;
  personal_email: string;
  contact_number: string;
  date_of_birth: string;
  gender: string;
  address: string;
  designation: string;
  department_id: number;
  account_number: string;
  ifsc_code: string;
  pan_number: string;
  uan_number: string;
  created_at: string;
  updated_at: string;
}

// Get all employees - returns array of employees directly
export async function fetchEmployees(): Promise<Employee[]> {
  const response = await fetch(`${API_BASE}/employees`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch employees');
  }
  
  const data = await response.json();
  return data.employees; // Extract the employees array from the response
}

// Get employee by Cognito user ID
export async function getEmployeeByCognitoId(cognitoUserId: string): Promise<Employee | null> {
  try {
    const response = await fetch(`${API_BASE}/employees/by-cognito/${cognitoUserId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch employee: ${response.status}`);
    }
    
    const data = await response.json();
    return data.employee; // Return the employee object directly
  } catch (error) {
    console.error('Error fetching employee by cognito ID:', error);
    throw error;
  }
}

// Create new employee
export async function createEmployee(employeeData: any): Promise<{ message: string; employee: Employee }> {
  console.log("🌐 Making API call to:", `${API_BASE}/employees`);
  console.log("📦 Request payload:", employeeData);
  
  const response = await fetch(`${API_BASE}/employees`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(employeeData),
  });
  
  console.log("📨 Response status:", response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ API Error response:", errorText);
    throw new Error(`Failed to create employee: ${response.status} ${errorText}`);
  }
  
  const result = await response.json();
  console.log("✅ API Success response:", result);
  return result;
}

// Update employee
export async function updateEmployee(employeeId: string, updates: any): Promise<{ message: string; employee_id: string }> {
  const response = await fetch(`${API_BASE}/employees/${employeeId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update employee');
  }
  
  return response.json();
}

// Delete employee
export async function deleteEmployee(employeeId: string): Promise<{ message: string; employee_id: string }> {
  const response = await fetch(`${API_BASE}/employees/${employeeId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete employee');
  }
  
  return response.json();
}