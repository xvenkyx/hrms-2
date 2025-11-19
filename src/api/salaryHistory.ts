export const API_BASE = "https://ic9wiavkl4.execute-api.us-east-1.amazonaws.com/Stage1";

export interface SalaryHistoryFilters {
    employeeId?: string;
    department?: string;
    year?: string;
    month?: string;
    startDate?: string;
    endDate?: string;
}

export async function fetchSalaryHistory(filters: SalaryHistoryFilters = {}) {
    try {
        const queryParams = new URLSearchParams();
        
        Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== "all") {
                queryParams.append(key, value);
            }
        });

        const url = `${API_BASE}/salary-history${queryParams.toString() ? `?${queryParams}` : ''}`;
        // console.log("Fetching salary history:", url);
        
        const res = await fetch(url);
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        return await res.json();
    } catch (error) {
        console.error("Error fetching salary history:", error);
        throw error;
    }
}