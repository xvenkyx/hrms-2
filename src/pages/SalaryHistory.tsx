import { useEffect, useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { fetchSalaryHistory } from "@/api/salaryHistory";
import { fetchEmployees } from "@/api/employees";

export default function SalaryHistory() {
    const [salarySlips, setSalarySlips] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Filters
    const [employeeId, setEmployeeId] = useState("all");
    const [department, setDepartment] = useState("all");
    const [year, setYear] = useState("");
    const [month, setMonth] = useState("all");
    const [page, setPage] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        loadEmployees();
        loadSalaryHistory();
    }, []);

    async function loadEmployees() {
        const emps = await fetchEmployees();
        setEmployees(emps);
    }

    async function loadSalaryHistory() {
        setLoading(true);
        try {
            const filters: any = {};
            if (employeeId && employeeId !== "all") filters.employeeId = employeeId;
            if (department !== "all") filters.department = department;
            if (year) filters.year = year;
            if (month !== "all") filters.month = month;

            const data = await fetchSalaryHistory(filters);
            setSalarySlips(data.slips || []);
        } catch (error) {
            console.error("Error loading salary history:", error);
        } finally {
            setLoading(false);
        }
    }

    function clearFilters() {
        setEmployeeId("all");
        setDepartment("all");
        setYear("");
        setMonth("all");
        setPage(1);
    }

    // Get unique departments for filters
    const departments = useMemo(() => {
        const deptSet = new Set(employees.map(emp => emp.department).filter(Boolean));
        return Array.from(deptSet).sort();
    }, [employees]);

    // Pagination
    const totalPages = Math.ceil(salarySlips.length / pageSize);
    const paginated = salarySlips.slice((page - 1) * pageSize, page * pageSize);

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Salary History</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 border rounded-lg bg-gray-50">
                    {/* Employee Filter */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Employee</label>
                        <Select value={employeeId} onValueChange={setEmployeeId}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Employees" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Employees</SelectItem>
                                {employees.map((emp) => (
                                    <SelectItem key={emp.employeeId} value={emp.employeeId}>
                                        {emp.employeeId} - {emp.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Department Filter */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Department</label>
                        <Select value={department} onValueChange={setDepartment}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Departments" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {departments.map((dept) => (
                                    <SelectItem key={dept} value={dept}>
                                        {dept}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Year Filter */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Year</label>
                        <Input
                            type="number"
                            placeholder="e.g., 2025"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                        />
                    </div>

                    {/* Month Filter */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Month</label>
                        <Select value={month} onValueChange={setMonth}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Months" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Months</SelectItem>
                                <SelectItem value="01">January</SelectItem>
                                <SelectItem value="02">February</SelectItem>
                                <SelectItem value="03">March</SelectItem>
                                <SelectItem value="04">April</SelectItem>
                                <SelectItem value="05">May</SelectItem>
                                <SelectItem value="06">June</SelectItem>
                                <SelectItem value="07">July</SelectItem>
                                <SelectItem value="08">August</SelectItem>
                                <SelectItem value="09">September</SelectItem>
                                <SelectItem value="10">October</SelectItem>
                                <SelectItem value="11">November</SelectItem>
                                <SelectItem value="12">December</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-end">
                        <Button onClick={loadSalaryHistory} className="flex-1">
                            Apply Filters
                        </Button>
                        <Button variant="outline" onClick={clearFilters} className="flex-1">
                            Clear
                        </Button>
                    </div>
                </div>

                {/* Results Count */}
                <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                        {salarySlips.length} salary records found
                    </p>
                    {loading && <p className="text-sm text-blue-600">Loading...</p>}
                </div>

                {/* Salary Table */}
                <div className="w-full overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Month</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Basic</TableHead>
                                <TableHead>HRA</TableHead>
                                <TableHead>Fuel</TableHead>
                                <TableHead>Deductions</TableHead>
                                <TableHead>Bonus</TableHead>
                                <TableHead>Net Salary</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {paginated.map((slip) => (
                                <TableRow key={`${slip.employeeId}-${slip.yearMonth}`}>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{slip.employeeName}</div>
                                            <div className="text-sm text-gray-500">{slip.employeeId}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{slip.yearMonth}</TableCell>
                                    <TableCell>{slip.department}</TableCell>
                                    <TableCell>₹{slip.basic?.toLocaleString()}</TableCell>
                                    <TableCell>₹{slip.hra?.toLocaleString()}</TableCell>
                                    <TableCell>₹{slip.fuelAllowance?.toLocaleString()}</TableCell>
                                    <TableCell className="text-red-600">
                                        ₹{(slip.pfAmount + slip.professionalTax + (slip.absentDeduction || 0))?.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-green-600">
                                        ₹{slip.bonus?.toLocaleString() || 0}
                                    </TableCell>
                                    <TableCell className="font-semibold">
                                        ₹{slip.netSalary?.toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))}

                            {paginated.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                                        {salarySlips.length === 0 ? "No salary records found" : "No records match your filters"}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-between items-center pt-4">
                        <Button 
                            variant="outline" 
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                        >
                            Previous
                        </Button>
                        
                        <p className="text-sm">
                            Page {page} of {totalPages}
                        </p>
                        
                        <Button 
                            variant="outline" 
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}