// src/api/salary.ts
const API_BASE = import.meta.env.VITE_API_BASE || 'https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod';

export interface SalarySlipRequest {
  employeeId: string;
  yearMonth: string;
  forceRegenerate?: boolean;
}

export interface SalarySlipResponse {
  slip: any;
  message: string;
  source: string;
  calculationNotes?: any;
}

export async function getExistingSlip(data: SalarySlipRequest): Promise<SalarySlipResponse> {
  const token = localStorage.getItem('sessionToken');
  
  const response = await fetch(`${API_BASE}/get-salary-slip`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": token ? `Bearer ${token}` : ""
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw error;
  }
  
  return response.json();
}

export async function generateSlip(data: SalarySlipRequest): Promise<SalarySlipResponse> {
  const token = localStorage.getItem('sessionToken');
  
  const response = await fetch(`${API_BASE}/generateSlip`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": token ? `Bearer ${token}` : ""
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw error;
  }
  
  return response.json();
}

// Optional: Add a function to get employee's salary history
export async function getSalaryHistory(employeeId: string): Promise<SalarySlipResponse[]> {
  const token = localStorage.getItem('sessionToken');
  
  const response = await fetch(`${API_BASE}/salary-history`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": token ? `Bearer ${token}` : ""
    },
    body: JSON.stringify({ employeeId })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw error;
  }
  
  return response.json();
}