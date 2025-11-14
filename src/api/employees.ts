export const API_BASE = "https://ic9wiavkl4.execute-api.us-east-1.amazonaws.com/Stage1"

export async function fetchEmployees() {
  const res = await fetch(`${API_BASE}/employees`)
  return await res.json()
}
