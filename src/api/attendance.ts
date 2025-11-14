export const API_BASE = "https://ic9wiavkl4.execute-api.us-east-1.amazonaws.com/Stage1";

export async function fetchAttendance() {
  const res = await fetch(`${API_BASE}/attendance`);
  return await res.json();
}

export async function saveAttendance(data: {
  employeeId: string;
  yearMonth: string;
  absentDays: number;
}) {
  const res = await fetch(`${API_BASE}/attendance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return await res.json();
}

export async function deleteAttendance(employeeId: string, yearMonth: string) {
  const res = await fetch(`${API_BASE}/attendance/${employeeId}/${yearMonth}`, {
    method: "DELETE",
  });
  return await res.json();
}
