import { useEffect, useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchEmployees } from "@/api/employees";

export default function Employees() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterDeduction, setFilterDeduction] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const data = await fetchEmployees();
    setEmployees(data);
  }

  // Get unique departments for filter
  const departments = useMemo(() => {
    const deptSet = new Set(
      employees.map((emp) => emp.department).filter(Boolean)
    );
    return Array.from(deptSet).sort();
  }, [employees]);

  // Filter + Search Logic
  const filtered = useMemo(() => {
    return employees
      .filter(
        (emp) =>
          emp.name.toLowerCase().includes(search.toLowerCase()) ||
          emp.employeeId.toLowerCase().includes(search.toLowerCase())
      )
      .filter((emp) => {
        if (filterDeduction === "all") return true;
        return emp.deductionType === filterDeduction;
      })
      .filter((emp) => {
        if (filterDepartment === "all") return true;
        return emp.department === filterDepartment;
      });
  }, [employees, search, filterDeduction, filterDepartment]);

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  function prev() {
    setPage((p) => Math.max(1, p - 1));
  }

  function next() {
    setPage((p) => Math.min(totalPages, p + 1));
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Employees</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Top Controls */}
        <div className="flex flex-col md:flex-row gap-3 justify-between">
          {/* Search */}
          <Input
            className="md:w-1/3"
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            {/* Department Filter */}
            <Select
              value={filterDepartment}
              onValueChange={setFilterDepartment}
            >
              <SelectTrigger className="md:w-40 w-full">
                <SelectValue placeholder="Department" />
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

            {/* Deduction Type Filter */}
            <Select value={filterDeduction} onValueChange={setFilterDeduction}>
              <SelectTrigger className="md:w-40 w-full">
                <SelectValue placeholder="Deduction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="fixed">Fixed</SelectItem>
              </SelectContent>
            </Select>

            {/* Add Employee Button */}
            <Button className="w-full md:w-auto">Add Employee</Button>
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Base Salary</TableHead>
                <TableHead>Deduction Type</TableHead>
                <TableHead>Leaves Used</TableHead>
                <TableHead>Casual Used</TableHead>
                <TableHead>Sick Used</TableHead>
                <TableHead>Casual Remaining</TableHead>
                <TableHead>Sick Remaining</TableHead>
                <TableHead>Leaves Remaining</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginated.map((emp) => (
                <TableRow key={emp.employeeId}>
                  <TableCell className="font-medium">
                    {emp.employeeId}
                  </TableCell>
                  <TableCell>{emp.name}</TableCell>
                  <TableCell>{emp.department || "-"}</TableCell>
                  <TableCell>{emp.role || "-"}</TableCell>
                  <TableCell>${emp.baseSalary?.toLocaleString()}</TableCell>
                  <TableCell className="capitalize">
                    {emp.deductionType}
                  </TableCell>
                  <TableCell>{emp.leavesUsed}</TableCell>
                  <TableCell>
                    {emp.casualLeavesUsed || 0}/{emp.casualLeavesTotal || 4}
                  </TableCell>
                  <TableCell>
                    {emp.sickLeavesUsed || 0}/{emp.sickLeavesTotal || 2}
                  </TableCell>
                  <TableCell>
                    {(emp.casualLeavesTotal || 4) - (emp.casualLeavesUsed || 0)}
                  </TableCell>
                  <TableCell>
                    {(emp.sickLeavesTotal || 2) - (emp.sickLeavesUsed || 0)}
                  </TableCell>
                  <TableCell>{emp.leavesRemaining}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" className="mr-2">
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive">
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {paginated.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-6 text-gray-500"
                  >
                    No employees found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center pt-3">
          <Button variant="outline" onClick={prev} disabled={page === 1}>
            Previous
          </Button>

          <p className="text-sm">
            Page {page} of {totalPages}
          </p>

          <Button
            variant="outline"
            onClick={next}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
