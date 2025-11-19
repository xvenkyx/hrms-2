import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { fetchEmployees } from "@/api/employees"
import { generateSlip } from "@/api/salary"
import { generateSalaryPDF } from "@/utils/pdf"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

// New API function for checking existing slips
async function getExistingSlip(data: { employeeId: string; yearMonth: string }) {
    const res = await fetch(
        `${import.meta.env.VITE_API_BASE || 'https://ic9wiavkl4.execute-api.us-east-1.amazonaws.com/Stage1'}/get-salary-slip`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        }
    );
    return res.json();
}

export default function SalarySlip() {
    const [employees, setEmployees] = useState<any[]>([])
    const [employeeId, setEmployeeId] = useState("")
    const [yearMonth, setYearMonth] = useState("")
    const [result, setResult] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")
    const [messageType, setMessageType] = useState<"info" | "success" | "error">("info")

    useEffect(() => {
        load()
    }, [])

    async function load() {
        const emps = await fetchEmployees()
        setEmployees(emps)
    }

    async function checkExistingSlip() {
        if (!employeeId || !yearMonth) {
            showMessage("Select employee and month first", "error")
            return
        }

        setLoading(true)
        setMessage("Checking for existing salary slip...")
        setMessageType("info")

        try {
            const data = await getExistingSlip({ employeeId, yearMonth })
            
            if (data.slip) {
                setResult(data.slip)
                showMessage("✓ Existing salary slip found", "success")
            } else {
                setResult(null)
                showMessage("No existing slip found. Click 'Generate New' to create one.", "info")
            }
        } catch (error: any) {
            if (error.error === "Salary slip not found") {
                setResult(null)
                showMessage("No existing slip found. Click 'Generate New' to create one.", "info")
            } else {
                showMessage("Error checking for slip: " + (error.error || error.message), "error")
            }
        } finally {
            setLoading(false)
        }
    }

    async function generateNewSlip(forceRegenerate = false) {
        if (!employeeId || !yearMonth) {
            alert("Select employee and month")
            return
        }

        setLoading(true)
        setMessage(forceRegenerate ? "Regenerating salary slip..." : "Generating new salary slip...")
        setMessageType("info")

        try {
            const slipData = await generateSlip({ 
                employeeId, 
                yearMonth,
                forceRegenerate 
            })
            
            if (slipData.slip) {
                setResult(slipData.slip)
                showMessage(
                    forceRegenerate ? "✓ Salary slip regenerated" : "✓ New salary slip generated", 
                    "success"
                )
            } else {
                showMessage("Failed to generate slip", "error")
            }
        } catch (error: any) {
            showMessage("Error generating slip: " + (error.error || error.message), "error")
        } finally {
            setLoading(false)
        }
    }

    function showMessage(text: string, type: "info" | "success" | "error") {
        setMessage(text)
        setMessageType(type)
    }

    function clearForm() {
        setEmployeeId("")
        setYearMonth("")
        setResult(null)
        setMessage("")
    }

    return (
        <div className="p-4">
            <Card className="w-full max-w-3xl mx-auto">
                <CardHeader>
                    <CardTitle>Generate Salary Slip</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* INPUT ROW */}
                    <div className="flex flex-col md:flex-row gap-3 w-full">
                        {/* Employee Dropdown */}
                        <Select value={employeeId} onValueChange={setEmployeeId}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select Employee" />
                            </SelectTrigger>
                            <SelectContent>
                                {employees.map((e) => (
                                    <SelectItem key={e.employeeId} value={e.employeeId}> 
                                        {e.employeeId} - {e.name} ({e.department})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Month */}
                        <Input
                            type="month"
                            value={yearMonth}
                            onChange={(e) => setYearMonth(e.target.value)}
                            className="w-full"
                        />

                        {/* Action Buttons */}
                        <div className="flex gap-2 w-full md:w-auto">
                            <Button 
                                onClick={checkExistingSlip} 
                                variant="outline"
                                disabled={loading}
                                className="flex-1"
                            >
                                Check Existing
                            </Button>
                            <Button 
                                onClick={() => generateNewSlip(false)} 
                                disabled={loading}
                                className="flex-1"
                            >
                                Generate New
                            </Button>
                        </div>
                    </div>

                    {/* Message Display */}
                    {message && (
                        <div className={`p-3 rounded-md text-sm ${
                            messageType === "success" ? "bg-green-50 text-green-800 border border-green-200" :
                            messageType === "error" ? "bg-red-50 text-red-800 border border-red-200" :
                            "bg-blue-50 text-blue-800 border border-blue-200"
                        }`}>
                            {message}
                        </div>
                    )}

                    {/* Loading Indicator */}
                    {loading && (
                        <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-sm text-gray-600 mt-2">Processing...</p>
                        </div>
                    )}

                    {/* OUTPUT CARD */}
                    {result && (
                        <Card className="mt-6 border shadow-sm">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle>Salary Breakdown</CardTitle>
                                    <div className="flex gap-2">
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => generateNewSlip(true)}
                                            disabled={loading}
                                        >
                                            Regenerate
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => generateSalaryPDF(result)}
                                        >
                                            Download PDF
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent>
                                {/* Employee Info */}
                                <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                                    <h3 className="font-semibold mb-2">Employee Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        <p><strong>Name:</strong> {result.employeeName}</p>
                                        <p><strong>Employee ID:</strong> {result.employeeId}</p>
                                        <p><strong>Department:</strong> {result.department}</p>
                                        <p><strong>Role:</strong> {result.role}</p>
                                        <p><strong>Month:</strong> {result.yearMonth}</p>
                                        <p><strong>Base Salary:</strong> ₹{result.baseSalary?.toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Salary Grid */}
                                <div className="mb-6">
                                    <h3 className="font-semibold mb-3">Salary Components</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-3 border rounded bg-gray-50">
                                            <p className="font-medium">Basic (30%)</p>
                                            <p className="text-lg">₹{result.basic?.toLocaleString()}</p>
                                        </div>

                                        <div className="p-3 border rounded bg-gray-50">
                                            <p className="font-medium">HRA (70% of Basic)</p>
                                            <p className="text-lg">₹{result.hra?.toLocaleString()}</p>
                                        </div>

                                        <div className="p-3 border rounded bg-gray-50">
                                            <p className="font-medium">Fuel Allowance</p>
                                            <p className="text-lg">₹{result.fuelAllowance?.toLocaleString()}</p>
                                        </div>

                                        <div className="p-3 border rounded bg-gray-50">
                                            <p className="font-medium">Gross Salary</p>
                                            <p className="text-lg">₹{result.grossSalary?.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Deductions & Bonus */}
                                <div className="mb-6">
                                    <h3 className="font-semibold mb-3">Deductions & Bonus</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-3 border rounded bg-red-50">
                                            <p className="font-medium">PF Deduction</p>
                                            <p className="text-lg">₹{result.pfAmount?.toLocaleString()}</p>
                                        </div>

                                        <div className="p-3 border rounded bg-red-50">
                                            <p className="font-medium">Professional Tax</p>
                                            <p className="text-lg">₹{result.professionalTax?.toLocaleString()}</p>
                                        </div>

                                        <div className="p-3 border rounded bg-red-50">
                                            <p className="font-medium">Absent Deduction</p>
                                            <p className="text-lg">₹{result.absentDeduction?.toLocaleString()}</p>
                                            <p className="text-sm text-gray-600">
                                                ({result.lopDays} LOP days × ₹{result.perDaySalary}/day)
                                            </p>
                                        </div>

                                        <div className="p-3 border rounded bg-green-50">
                                            <p className="font-medium">Performance Bonus</p>
                                            <p className="text-lg">₹{result.bonus?.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Leave Information */}
                                <div className="mb-6 p-4 border rounded-lg bg-blue-50">
                                    <h3 className="font-semibold mb-2">Leave Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        <p><strong>Paid Leaves Used:</strong> {result.paidLeaveUsed}</p>
                                        <p><strong>LOP Days:</strong> {result.lopDays}</p>
                                        <p><strong>Leaves Remaining:</strong> {result.leavesRemaining}</p>
                                    </div>
                                </div>

                                {/* NET SALARY */}
                                <div className="p-6 border rounded bg-green-50 text-center">
                                    <p className="text-2xl font-bold text-green-800">
                                        Net Salary: ₹{result.netSalary?.toLocaleString()}
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-center gap-4 mt-6">
                                    <Button variant="outline" onClick={clearForm}>
                                        New Slip
                                    </Button>
                                    <Button onClick={() => generateSalaryPDF(result)}>
                                        Download PDF
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* No Results State */}
                    {!result && !loading && message && message.includes("No existing slip found") && (
                        <div className="text-center py-8 text-gray-500">
                            <p>No salary slip found for the selected criteria.</p>
                            <Button 
                                onClick={() => generateNewSlip(false)} 
                                className="mt-4"
                                disabled={loading}
                            >
                                Generate New Slip
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}