export async function generateSlip(data: { employeeId: string; yearMonth: string }) {
  const res = await fetch(
    `${import.meta.env.VITE_API_BASE}/generateSlip`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }
  )

  return res.json()
}
