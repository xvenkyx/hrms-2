export async function generateSlip(data: { 
    employeeId: string; 
    yearMonth: string; 
    forceRegenerate?: boolean;
}) {
    const res = await fetch(
        `${import.meta.env.VITE_API_BASE || 'https://ic9wiavkl4.execute-api.us-east-1.amazonaws.com/Stage1'}/generateSlip`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        }
    );
    return res.json();
}