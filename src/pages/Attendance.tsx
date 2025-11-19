import { useEffect, useState, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

import { fetchAttendance, saveAttendance, deleteAttendance } from "@/api/attendance"
import { fetchEmployees } from "@/api/employees"

export default function Attendance() {
    const [attendance, setAttendance] = useState<any[]>([]) 
    const [employees, setEmployees] = useState<any[]>([]) 

    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const pageSize = 8

    // Form inputs
    const [employeeId, setEmployeeId] = useState("")
    const [yearMonth, setYearMonth] = useState("")
    const [absentDays, setAbsentDays] = useState("")
    const [leaveMode, setLeaveMode] = useState("auto") // "auto", "paid", or "lop"

    // Edit modal state
    const [editOpen, setEditOpen] = useState(false)
    const [editItem, setEditItem] = useState<any>(null)

    useEffect(() => {
        load()
    }, [])

    async function load() {
        const at = await fetchAttendance()
        const emps = await fetchEmployees()

        setAttendance(at)
        setEmployees(emps)
    }

    async function save() {
        if (!employeeId || !yearMonth || !absentDays) return alert("All fields required")

        await saveAttendance({
            employeeId,
            yearMonth,
            absentDays: Number(absentDays),
            leaveMode: leaveMode
        })
        setEmployeeId("")
        setYearMonth("")
        setAbsentDays("")
        setLeaveMode("auto")
        load()
    }

    async function openEdit(item: any) {
        setEditItem(item)
        setEditOpen(true)
    }

    async function applyEdit() {
        if (!editItem) return

        await saveAttendance({
            employeeId: editItem.employeeId,
            yearMonth: editItem.yearMonth,
            absentDays: Number(editItem.absentDays),
            leaveMode: editItem.leaveMode || "auto"
        })
        setEditOpen(false)
        setEditItem(null)
        load()
    }

    async function remove(empId: string, month: string) {
        await deleteAttendance(empId, month)
        load()
    }

    const filtered = useMemo(() => {
        return attendance.filter((a) =>
            a.employeeId.toLowerCase().includes(search.toLowerCase())
        )
    }, [attendance, search])

    const totalPages = Math.ceil(filtered.length / pageSize)
    const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

    return (
        <>
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Attendance</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Search + Add Attendance */}
                    <div className="flex flex-col md:flex-row gap-3 justify-between">
                        {/* SEARCH */}
                        <Input
                            className="md:w-1/3"
                            placeholder="Search by Employee ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        {/* ADD FORM */}
                        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                            {/* employee dropdown */}
                            <select
                                className="border rounded px-3 py-2"
                                value={employeeId}
                                onChange={(e) => setEmployeeId(e.target.value)}
                            >
                                <option value="">Select Employee</option>
                                {employees.map((e) => (
                                    <option key={e.employeeId} value={e.employeeId}>
                                        {e.employeeId} - {e.name}
                                    </option>
                                ))}
                            </select>

                            <Input
                                type="month"
                                value={yearMonth}
                                onChange={(e) => setYearMonth(e.target.value)}
                            />

                            <Input
                                placeholder="Absent Days"
                                type="number"
                                min={0}
                                max={30}
                                value={absentDays}
                                onChange={(e) => setAbsentDays(e.target.value)}
                            />

                            {/* Leave Mode Dropdown */}
                            <select
                                className="border rounded px-3 py-2"
                                value={leaveMode}
                                onChange={(e) => setLeaveMode(e.target.value)}
                            >
                                <option value="auto">Auto (Use casual leaves first)</option>
                                <option value="paid">Use Paid Leaves Only</option>
                                <option value="lop">Loss of Pay Only</option>
                            </select>

                            <Button onClick={save}>Save</Button>
                        </div>
                    </div>

                    {/* TABLE */}
                    <div className="w-full overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee ID</TableHead>
                                    <TableHead>Month</TableHead>
                                    <TableHead>Absent Days</TableHead>
                                    <TableHead>Leave Mode</TableHead>
                                    <TableHead>Casual Used</TableHead>
                                    <TableHead>Sick Used</TableHead>
                                    <TableHead>Paid Leaves</TableHead>
                                    <TableHead>LOP Days</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {paginated.map((a) => (
                                    <TableRow key={a.employeeId + a.yearMonth}>
                                        <TableCell>{a.employeeId}</TableCell>
                                        <TableCell>{a.yearMonth}</TableCell>
                                        <TableCell>{a.absentDays}</TableCell>
                                        <TableCell className="capitalize">{a.leaveMode || 'auto'}</TableCell>
                                        <TableCell className="text-blue-600">{a.casualLeavesConsumed || 0}</TableCell>
                                        <TableCell className="text-green-600">{a.sickLeavesConsumed || 0}</TableCell>
                                        <TableCell className="text-purple-600">{a.paidLeaveUsed || 0}</TableCell>
                                        <TableCell className="text-red-600">{a.lopDays || 0}</TableCell>
                                        <TableCell className="text-right flex gap-2 justify-end">
                                            <Button variant="outline" size="sm" onClick={() => openEdit(a)}>
                                                Edit
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => remove(a.employeeId, a.yearMonth)}
                                            >
                                                Delete
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {paginated.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-6 text-gray-500">
                                            No records found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* PAGINATION */}
                    <div className="flex justify-between items-center pt-3">
                        <Button variant="outline" onClick={() => setPage(Math.max(1, page - 1))}>
                            Previous
                        </Button>
                        <p>Page {page} of {totalPages}</p>
                        <Button variant="outline" onClick={() => setPage(Math.min(totalPages, page + 1))}>
                            Next
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* EDIT MODAL */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Attendance</DialogTitle>
                    </DialogHeader>

                    {editItem && (
                        <div className="space-y-4">
                            <p><strong>Employee:</strong> {editItem.employeeId}</p>
                            <p><strong>Month:</strong> {editItem.yearMonth}</p>

                            <Input
                                type="number"
                                min={0}
                                max={30}
                                value={editItem.absentDays}
                                onChange={(e) =>
                                    setEditItem({ ...editItem, absentDays: e.target.value })
                                }
                            />

                            {/* Leave Mode Dropdown in Edit Modal */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Leave Mode</label>
                                <select
                                    className="border rounded px-3 py-2 w-full"
                                    value={editItem.leaveMode || "auto"}
                                    onChange={(e) => setEditItem({ ...editItem, leaveMode: e.target.value })}
                                >
                                    <option value="auto">Auto (Use casual leaves first)</option>
                                    <option value="paid">Use Paid Leaves Only</option>
                                    <option value="lop">Loss of Pay Only</option>
                                </select>
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
        </>
    )
}