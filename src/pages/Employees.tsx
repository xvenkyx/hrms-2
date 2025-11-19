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
import { Badge } from "@/components/ui/badge";
import { fetchEmployees } from "@/api/employees";

export default function Employees() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterDeduction, setFilterDeduction] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 8;

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchEmployees();
      setEmployees(data);
    } catch (error) {
      console.error("Error loading employees:", error);
    } finally {
      setLoading(false);
    }
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

  const getDepartmentColor = (department: string) => {
    const colors: { [key: string]: string } = {
      'Engineering': 'bg-blue-100 text-blue-800',
      'Sales': 'bg-green-100 text-green-800',
      'Marketing': 'bg-purple-100 text-purple-800',
      'HR': 'bg-pink-100 text-pink-800',
      'Finance': 'bg-orange-100 text-orange-800',
      'Operations': 'bg-indigo-100 text-indigo-800'
    };
    return colors[department] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading employees...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-600 mt-1">
            Manage your team members and their details
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <span className="mr-2">+</span>
          Add Employee
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-linear-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Employees</p>
                <p className="text-2xl font-bold text-blue-900">{employees.length}</p>
              </div>
              <div className="text-2xl">👥</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Active</p>
                <p className="text-2xl font-bold text-green-900">{employees.length}</p>
              </div>
              <div className="text-2xl">✅</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Departments</p>
                <p className="text-2xl font-bold text-purple-900">{departments.length}</p>
              </div>
              <div className="text-2xl">🏢</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Avg Salary</p>
                <p className="text-2xl font-bold text-orange-900">
                  ₹{employees.length > 0 ? Math.round(employees.reduce((sum, emp) => sum + emp.baseSalary, 0) / employees.length).toLocaleString() : 0}
                </p>
              </div>
              <div className="text-2xl">💰</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Employee Directory</span>
            <Badge variant="secondary" className="text-sm">
              {filtered.length} employees
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <Input
                placeholder="Search by name or employee ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
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

              <Select value={filterDeduction} onValueChange={setFilterDeduction}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearch("");
                setFilterDepartment("all");
                setFilterDeduction("all");
                setPage(1);
              }}
              className="whitespace-nowrap"
            >
              Clear Filters
            </Button>
          </div>

          {/* Table */}
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="hidden sm:table-cell">Department</TableHead>
                  <TableHead className="hidden md:table-cell">Role</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead className="hidden lg:table-cell">Leaves</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginated.map((emp) => (
                  <TableRow key={emp.employeeId} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-linear-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {emp.name.split(' ').map((n:any) => n[0]).join('').toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{emp.name}</div>
                          <div className="text-sm text-gray-500">{emp.employeeId}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className={getDepartmentColor(emp.department)}>
                        {emp.department || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{emp.role || "-"}</TableCell>
                    <TableCell>
                      <div className="font-semibold">₹{emp.baseSalary?.toLocaleString()}</div>
                      <div className="text-xs text-gray-500 capitalize">{emp.deductionType}</div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600">C: {emp.casualLeavesUsed || 0}/{emp.casualLeavesTotal || 4}</span>
                          <span className="text-green-600">S: {emp.sickLeavesUsed || 0}/{emp.sickLeavesTotal || 2}</span>
                        </div>
                        <div className="text-xs text-gray-500">Remaining: {emp.leavesRemaining}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button size="sm" variant="outline" className="h-8">
                          <span className="hidden sm:inline">Edit</span>
                          <span className="sm:hidden">✏️</span>
                        </Button>
                        <Button size="sm" variant="destructive" className="h-8">
                          <span className="hidden sm:inline">Delete</span>
                          <span className="sm:hidden">🗑️</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

                {paginated.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="text-4xl">👥</div>
                        <p className="text-lg font-medium">No employees found</p>
                        <p className="text-sm">
                          {search || filterDepartment !== "all" || filterDeduction !== "all" 
                            ? "Try adjusting your filters" 
                            : "No employees in the system"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} employees
              </div>
              
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  onClick={prev} 
                  disabled={page === 1}
                  size="sm"
                >
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && <span className="px-2">...</span>}
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={next} 
                  disabled={page === totalPages}
                  size="sm"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}