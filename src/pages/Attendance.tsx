import { useEffect, useState, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { fetchAttendance, saveAttendance, deleteAttendance } from "@/api/attendance"
import { fetchEmployees } from "@/api/employees"

export default function Attendance() {
    const [attendance, setAttendance] = useState<any[]>([]) 
    const [employees, setEmployees] = useState<any[]>([]) 
    const [loading, setLoading] = useState(true)

    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const pageSize = 8

    // Form inputs
    const [employeeId, setEmployeeId] = useState("")
    const [yearMonth, setYearMonth] = useState("")
    const [absentDays, setAbsentDays] = useState("")
    const [leaveMode, setLeaveMode] = useState("auto")

    // Edit modal state
    const [editOpen, setEditOpen] = useState(false)
    const [editItem, setEditItem] = useState<any>(null)

    useEffect(() => {
        load()
    }, [])

    async function load() {
        setLoading(true)
        try {
            const [at, emps] = await Promise.all([
                fetchAttendance(),
                fetchEmployees()
            ])
            setAttendance(at)
            setEmployees(emps)
        } catch (error) {
            console.error("Error loading data:", error)
        } finally {
            setLoading(false)
        }
    }

    async function save() {
        if (!employeeId || !yearMonth || !absentDays) {
            alert("All fields are required")
            return
        }

        try {
            await saveAttendance({
                employeeId,
                yearMonth,
                absentDays: Number(absentDays),
                leaveMode: leaveMode
            })
            // Reset form
            setEmployeeId("")
            setYearMonth("")
            setAbsentDays("")
            setLeaveMode("auto")
            // Reload data
            load()
        } catch (error) {
            console.error("Error saving attendance:", error)
            alert("Error saving attendance record")
        }
    }

    async function openEdit(item: any) {
        setEditItem({...item})
        setEditOpen(true)
    }

    async function applyEdit() {
        if (!editItem) return

        try {
            await saveAttendance({
                employeeId: editItem.employeeId,
                yearMonth: editItem.yearMonth,
                absentDays: Number(editItem.absentDays),
                leaveMode: editItem.leaveMode || "auto"
            })
            setEditOpen(false)
            setEditItem(null)
            load()
        } catch (error) {
            console.error("Error updating attendance:", error)
            alert("Error updating attendance record")
        }
    }

    async function remove(empId: string, month: string) {
        if (!confirm("Are you sure you want to delete this attendance record?")) {
            return
        }

        try {
            await deleteAttendance(empId, month)
            load()
        } catch (error) {
            console.error("Error deleting attendance:", error)
            alert("Error deleting attendance record")
        }
    }

    const filtered = useMemo(() => {
        return attendance.filter((a) =>
            a.employeeId.toLowerCase().includes(search.toLowerCase()) ||
            a.employeeName?.toLowerCase().includes(search.toLowerCase())
        )
    }, [attendance, search])

    const totalPages = Math.ceil(filtered.length / pageSize)
    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

    // Get employee name by ID
    const getEmployeeName = (employeeId: string) => {
        const employee = employees.find(emp => emp.employeeId === employeeId)
        return employee?.name || "Unknown"
    }

    // Get leave mode badge color
    const getLeaveModeColor = (mode: string) => {
        switch (mode) {
            case 'auto': return 'bg-blue-100 text-blue-800'
            case 'paid': return 'bg-green-100 text-green-800'
            case 'lop': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    if (loading) {
        return (
            <Card className="w-full">
                <CardContent className="flex items-center justify-center min-h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Loading attendance data...</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Attendance Management</h1>
                    <p className="text-gray-600 mt-1">
                        Track and manage employee attendance records
                    </p>
                </div>
                <Badge variant="secondary" className="text-sm">
                    {attendance.length} records
                </Badge>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-linear-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-600">Total Records</p>
                                <p className="text-2xl font-bold text-blue-900">{attendance.length}</p>
                            </div>
                            <div className="text-2xl">📊</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-linear-to-br from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-600">This Month</p>
                                <p className="text-2xl font-bold text-green-900">
                                    {attendance.filter(a => a.yearMonth === new Date().toISOString().slice(0, 7)).length}
                                </p>
                            </div>
                            <div className="text-2xl">📅</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-linear-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-purple-600">Auto Mode</p>
                                <p className="text-2xl font-bold text-purple-900">
                                    {attendance.filter(a => a.leaveMode === 'auto' || !a.leaveMode).length}
                                </p>
                            </div>
                            <div className="text-2xl">⚡</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-linear-to-br from-orange-50 to-orange-100 border-orange-200">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-orange-600">LOP Cases</p>
                                <p className="text-2xl font-bold text-orange-900">
                                    {attendance.filter(a => a.lopDays > 0).length}
                                </p>
                            </div>
                            <div className="text-2xl">⚠️</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Attendance Records</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Search and Add Section */}
                    <div className="flex flex-col lg:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                            <Input
                                placeholder="Search by Employee ID or Name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        
                        <Button 
                            variant="outline" 
                            onClick={() => setSearch("")}
                            className="whitespace-nowrap"
                        >
                            Clear Search
                        </Button>
                    </div>

                    {/* Add New Record Form */}
                    <Card className="border-dashed">
                        <CardHeader>
                            <CardTitle className="text-lg">Add New Attendance Record</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Select value={employeeId} onValueChange={setEmployeeId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Employee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employees.map((e) => (
                                            <SelectItem key={e.employeeId} value={e.employeeId}>
                                                {e.employeeId} - {e.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Input
                                    type="month"
                                    value={yearMonth}
                                    onChange={(e) => setYearMonth(e.target.value)}
                                    placeholder="Select Month"
                                />

                                <Input
                                    placeholder="Absent Days"
                                    type="number"
                                    min={0}
                                    max={31}
                                    value={absentDays}
                                    onChange={(e) => setAbsentDays(e.target.value)}
                                />

                                <Select value={leaveMode} onValueChange={setLeaveMode}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Leave Mode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="auto">Auto (Casual first)</SelectItem>
                                        <SelectItem value="paid">Paid Leaves Only</SelectItem>
                                        <SelectItem value="lop">Loss of Pay Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <Button 
                                onClick={save} 
                                className="w-full mt-4"
                                disabled={!employeeId || !yearMonth || !absentDays}
                            >
                                Save Attendance Record
                            </Button>
                        </CardContent>
                    </Card>

                    {/* TABLE */}
                    <div className="w-full overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead className="hidden sm:table-cell">Month</TableHead>
                                    <TableHead>Absent</TableHead>
                                    <TableHead className="hidden md:table-cell">Mode</TableHead>
                                    <TableHead className="hidden lg:table-cell">Casual</TableHead>
                                    <TableHead className="hidden lg:table-cell">Sick</TableHead>
                                    <TableHead className="hidden xl:table-cell">Paid</TableHead>
                                    <TableHead>LOP</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {paginated.map((a) => (
                                    <TableRow key={a.employeeId + a.yearMonth} className="hover:bg-gray-50">
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{getEmployeeName(a.employeeId)}</div>
                                                <div className="text-sm text-gray-500">{a.employeeId}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">{a.yearMonth}</TableCell>
                                        <TableCell>
                                            <Badge variant={a.absentDays > 0 ? "destructive" : "outline"}>
                                                {a.absentDays} days
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <Badge variant="outline" className={getLeaveModeColor(a.leaveMode)}>
                                                {a.leaveMode || 'auto'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell text-blue-600">
                                            {a.casualLeavesConsumed || 0}
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell text-green-600">
                                            {a.sickLeavesConsumed || 0}
                                        </TableCell>
                                        <TableCell className="hidden xl:table-cell text-purple-600">
                                            {a.paidLeaveUsed || 0}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={a.lopDays > 0 ? "destructive" : "outline"}>
                                                {a.lopDays || 0}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end space-x-2">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => openEdit(a)}
                                                    className="h-8"
                                                >
                                                    <span className="hidden sm:inline">Edit</span>
                                                    <span className="sm:hidden">✏️</span>
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => remove(a.employeeId, a.yearMonth)}
                                                    className="h-8"
                                                >
                                                    <span className="hidden sm:inline">Delete</span>
                                                    <span className="sm:hidden">🗑️</span>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {paginated.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                                            <div className="flex flex-col items-center space-y-2">
                                                <div className="text-4xl">📅</div>
                                                <p className="text-lg font-medium">No attendance records found</p>
                                                <p className="text-sm">
                                                    {search ? "Try adjusting your search" : "No records in the system"}
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* PAGINATION */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 pt-4 border-t">
                            <div className="text-sm text-gray-600">
                                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} records
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <Button 
                                    variant="outline" 
                                    onClick={() => setPage(Math.max(1, page - 1))}
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
                                    onClick={() => setPage(Math.min(totalPages, page + 1))}
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

            {/* EDIT MODAL */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Attendance Record</DialogTitle>
                    </DialogHeader>

                    {editItem && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="font-medium text-gray-500">Employee</p>
                                    <p className="font-semibold">{getEmployeeName(editItem.employeeId)}</p>
                                    <p className="text-gray-600">{editItem.employeeId}</p>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-500">Month</p>
                                    <p className="font-semibold">{editItem.yearMonth}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Absent Days</label>
                                <Input
                                    type="number"
                                    min={0}
                                    max={31}
                                    value={editItem.absentDays}
                                    onChange={(e) =>
                                        setEditItem({ ...editItem, absentDays: e.target.value })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Leave Mode</label>
                                <Select 
                                    value={editItem.leaveMode || "auto"} 
                                    onValueChange={(value) => setEditItem({ ...editItem, leaveMode: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="auto">Auto (Use casual leaves first)</SelectItem>
                                        <SelectItem value="paid">Use Paid Leaves Only</SelectItem>
                                        <SelectItem value="lop">Loss of Pay Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button onClick={() => setEditOpen(false)} variant="outline">
                            Cancel
                        </Button>
                        <Button onClick={applyEdit}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}