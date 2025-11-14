import { useEffect, useState, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetchEmployees } from "@/api/employees"

export default function Employees() {
  const [employees, setEmployees] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [filterDeduction, setFilterDeduction] = useState("all")
  const [page, setPage] = useState(1)
  const pageSize = 8

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const data = await fetchEmployees()
    setEmployees(data)
  }

  // 🔍 Filter + Search Logic
  const filtered = useMemo(() => {
    return employees
      .filter((emp) =>
        emp.name.toLowerCase().includes(search.toLowerCase())
      )
      .filter((emp) => {
        if (filterDeduction === "all") return true
        return emp.deductionType === filterDeduction
      })
  }, [employees, search, filterDeduction])

  // 📄 Pagination logic
  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  function prev() {
    setPage((p) => Math.max(1, p - 1))
  }
  function next() {
    setPage((p) => Math.max(1, Math.min(totalPages, p + 1)))
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
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Filter */}
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

        {/* Table */}
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Base Salary</TableHead>
                <TableHead>Deduction Type</TableHead>
                <TableHead>Leaves Used</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginated.map((e) => (
                <TableRow key={e.employeeId}>
                  <TableCell>{e.employeeId}</TableCell>
                  <TableCell>{e.name}</TableCell>
                  <TableCell>₹{e.baseSalary}</TableCell>
                  <TableCell className="capitalize">{e.deductionType}</TableCell>
                  <TableCell>{e.leavesUsed}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline">Edit</Button>
                    <Button size="sm" variant="destructive" className="ml-2">Delete</Button>
                  </TableCell>
                </TableRow>
              ))}

              {paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-gray-500">
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

          <Button variant="outline" onClick={next} disabled={page === totalPages}>
            Next
          </Button>
        </div>

      </CardContent>
    </Card>
  )
}
