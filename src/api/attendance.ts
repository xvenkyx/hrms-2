// @/api/attendance.ts
const API_BASE = import.meta.env.VITE_API_BASE || 'https://ic9wiavkl4.execute-api.us-east-1.amazonaws.com/Stage1';

// Add session token to all requests
const getAuthHeaders = () => {
  const token = localStorage.getItem('sessionToken');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

export interface AttendanceRecord {
  checkinId: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string; // YYYY-MM-DD
  checkinTime: string;
  checkoutTime: string | null;
  totalHours: number | null;
  createdAt: string;
}

export interface DashboardData {
  totalEmployees: number;
  checkedIn: number;
  checkedOut: number;
  notCheckedIn: number;
  attendanceRecords: AttendanceRecord[];
  timestamp: string;
}

export interface CheckInResponse {
  message: string;
  checkinTime: string;
  attendance: AttendanceRecord;
}

export interface CheckOutResponse {
  message: string;
  checkoutTime: string;
  totalHours: string;
}

// Check in for the current day
export async function checkIn(): Promise<CheckInResponse> {
  const response = await fetch(`${API_BASE}/attendance/checkin`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to check in: ${response.status} ${errorText}`);
  }

  return response.json();
}

// Check out for the current day
export async function checkOut(checkinId?: string): Promise<CheckOutResponse> {
  const response = await fetch(`${API_BASE}/attendance/checkout`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ checkinId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to check out: ${response.status} ${errorText}`);
  }

  return response.json();
}

// Get user's own attendance records
export async function getMyAttendance(
  startDate?: string, // YYYY-MM-DD
  endDate?: string // YYYY-MM-DD
): Promise<AttendanceRecord[]> {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const response = await fetch(`${API_BASE}/my-attendance?${params.toString()}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch attendance: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.attendance || [];
}

// Get today's check-in status
export async function getTodayStatus(): Promise<{
  hasCheckedIn: boolean;
  checkinTime?: string;
  checkinId?: string;
  hasCheckedOut?: boolean;
}> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const attendance = await getMyAttendance(today, today);
    const todayRecord = attendance.find(a => a.date === today);

    if (todayRecord) {
      return {
        hasCheckedIn: true,
        checkinTime: todayRecord.checkinTime,
        checkinId: todayRecord.checkinId,
        hasCheckedOut: !!todayRecord.checkoutTime,
      };
    }
    return { hasCheckedIn: false };
  } catch (error) {
    console.error('Error getting today status:', error);
    return { hasCheckedIn: false };
  }
}

// Get real-time attendance dashboard (HR/Admin only)
export async function getAttendanceDashboard(): Promise<DashboardData> {
  const response = await fetch(`${API_BASE}/attendance/dashboard`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch dashboard: ${response.status} ${errorText}`);
  }

  return response.json();
}

// Get specific employee's attendance (HR/Admin only)
export async function getEmployeeAttendance(
  employeeId: string,
  startDate?: string,
  endDate?: string
): Promise<AttendanceRecord[]> {
  const params = new URLSearchParams();
  params.append('employeeId', employeeId);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  // Note: This endpoint needs to be implemented in your Lambda
  // For now, using the same endpoint structure as other files
  const response = await fetch(`${API_BASE}/attendance/employee?${params.toString()}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch employee attendance: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.attendance || [];
}

// Get attendance statistics for a specific period
export async function getAttendanceStats(
  startDate: string,
  endDate: string
): Promise<{
  totalRecords: number;
  averageHours: number;
  presentDays: number;
  halfDays: number;
  absentDays: number;
}> {
  const attendance = await getMyAttendance(startDate, endDate);

  let totalHours = 0;
  let presentCount = 0;
  let halfDayCount = 0;

  attendance.forEach(record => {
    if (record.checkinTime && record.checkoutTime) {
      const checkin = new Date(record.checkinTime);
      const checkout = new Date(record.checkoutTime);
      const hours = (checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60);
      totalHours += hours;

      // Simple logic for status - you might want to refine this
      if (hours >= 8) {
        presentCount++;
      } else if (hours >= 4) {
        halfDayCount++;
      }
    }
  });

  const totalDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return {
    totalRecords: attendance.length,
    averageHours: attendance.length > 0 ? totalHours / attendance.length : 0,
    presentDays: presentCount,
    halfDays: halfDayCount,
    absentDays: totalDays - presentCount - halfDayCount,
  };
}

// Export attendance data (HR/Admin only) - Optional endpoint
export async function exportAttendance(
  startDate: string,
  endDate: string,
  department?: string
): Promise<Blob> {
  const params = new URLSearchParams();
  params.append('startDate', startDate);
  params.append('endDate', endDate);
  if (department) params.append('department', department);

  const response = await fetch(`${API_BASE}/attendance/export?${params.toString()}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to export attendance: ${response.status} ${errorText}`);
  }

  return response.blob();
}

// Get today's attendance summary for all employees
export async function getTodaysAttendanceSummary(): Promise<{
  checkedIn: AttendanceRecord[];
  checkedOut: AttendanceRecord[];
  notCheckedIn: string[]; // employee IDs
}> {
  const dashboard = await getAttendanceDashboard();
  
  const checkedIn = dashboard.attendanceRecords.filter(
    (record) => record.checkinTime && !record.checkoutTime
  );
  
  const checkedOut = dashboard.attendanceRecords.filter(
    (record) => record.checkoutTime
  );

  // Note: You might need to fetch all employees to get notCheckedIn list
  // This is a simplified version
  const allEmployees: any[] = []; // You might want to fetch this from employees API
  
  const checkedInEmployeeIds = new Set(
    dashboard.attendanceRecords.map((record) => record.employeeId)
  );
  
  const notCheckedIn = allEmployees
    .filter((emp) => !checkedInEmployeeIds.has(emp.employeeId))
    .map((emp) => emp.employeeId);

  return {
    checkedIn,
    checkedOut,
    notCheckedIn,
  };
}