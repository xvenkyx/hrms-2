import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { fetchEmployees } from "@/api/employees"
import { generateSlip } from "@/api/salary"
import { generateSalaryPDF } from "@/utils/pdf"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

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
        loadEmployees()
    }, [])

    async function loadEmployees() {
        try {
            const emps = await fetchEmployees()
            setEmployees(emps)
        } catch (error) {
            console.error("Error loading employees:", error)
            showMessage("Error loading employees", "error")
        }
    }

    async function checkExistingSlip() {
        if (!employeeId || !yearMonth) {
            showMessage("Please select both employee and month", "error")
            return
        }

        setLoading(true)
        showMessage("Checking for existing salary slip...", "info")

        try {
            const data = await getExistingSlip({ employeeId, yearMonth })
            
            if (data.slip) {
                setResult(data.slip)
                showMessage("✓ Existing salary slip found", "success")
            } else {
                setResult(null)
                showMessage("No existing slip found. Generate a new one.", "info")
            }
        } catch (error: any) {
            if (error.error === "Salary slip not found") {
                setResult(null)
                showMessage("No existing slip found. Generate a new one.", "info")
            } else {
                showMessage("Error checking for slip: " + (error.error || error.message), "error")
            }
        } finally {
            setLoading(false)
        }
    }

    async function generateNewSlip(forceRegenerate = false) {
        if (!employeeId || !yearMonth) {
            showMessage("Please select both employee and month", "error")
            return
        }

        setLoading(true)
        showMessage(forceRegenerate ? "Regenerating salary slip..." : "Generating new salary slip...", "info")

        try {
            const slipData = await generateSlip({ 
                employeeId, 
                yearMonth,
                forceRegenerate 
            })
            
            if (slipData.slip) {
                setResult(slipData.slip)
                showMessage(
                    forceRegenerate ? "✓ Salary slip regenerated successfully" : "✓ New salary slip generated successfully", 
                    "success"
                )
            } else {
                showMessage("Failed to generate salary slip", "error")
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
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Salary Slip Generator</h1>
                    <p className="text-gray-600 mt-1">
                        Generate and download professional salary slips
                    </p>
                </div>
                <Badge variant="secondary" className="text-sm">
                    JHEX Consulting LLP
                </Badge>
            </div>

            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Generate Salary Slip</CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Input Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                        <Select value={employeeId} onValueChange={setEmployeeId}>
                            <SelectTrigger>
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

                        <Input
                            type="month"
                            value={yearMonth}
                            onChange={(e) => setYearMonth(e.target.value)}
                            placeholder="Select Month"
                        />

                        <div className="flex gap-2">
                            <Button 
                                onClick={checkExistingSlip} 
                                variant="outline"
                                disabled={loading || !employeeId || !yearMonth}
                                className="flex-1"
                            >
                                Check Existing
                            </Button>
                            <Button 
                                onClick={() => generateNewSlip(false)} 
                                disabled={loading || !employeeId || !yearMonth}
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                                Generate New
                            </Button>
                        </div>
                    </div>

                    {/* Message Display */}
                    {message && (
                        <div className={`p-4 rounded-lg border ${
                            messageType === "success" ? "bg-green-50 text-green-800 border-green-200" :
                            messageType === "error" ? "bg-red-50 text-red-800 border-red-200" :
                            "bg-blue-50 text-blue-800 border-blue-200"
                        }`}>
                            <div className="flex items-center">
                                {messageType === "success" && "✅ "}
                                {messageType === "error" && "❌ "}
                                {messageType === "info" && "ℹ️ "}
                                <span className="ml-2">{message}</span>
                            </div>
                        </div>
                    )}

                    {/* Loading Indicator */}
                    {loading && (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-600 mt-4">Processing your request...</p>
                        </div>
                    )}

                    {/* Salary Slip Result */}
                    {result && (
                        <Card className="border-2 border-blue-200 shadow-lg">
                            <CardHeader className="bg-linear-to-r from-blue-50 to-indigo-50 border-b">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <CardTitle className="text-xl">Salary Slip Details</CardTitle>
                                        <p className="text-gray-600 text-sm mt-1">
                                            {result.yearMonth} • {result.employeeId}
                                        </p>
                                    </div>
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
                                            size="sm"
                                            onClick={() => generateSalaryPDF(result)}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            📄 Download PDF
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-6 space-y-6">
                                {/* Employee Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-lg">Employee Information</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Name:</span>
                                                <span className="font-semibold">{result.employeeName}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Employee ID:</span>
                                                <Badge variant="outline">{result.employeeId}</Badge>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Department:</span>
                                                <span>{result.department}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Role:</span>
                                                <span>{result.role}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Month:</span>
                                                <Badge variant="secondary">{result.yearMonth}</Badge>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-lg">Salary Summary</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Base Salary:</span>
                                                <span>₹{result.baseSalary?.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Gross Salary:</span>
                                                <span>₹{result.grossSalary?.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Total Deductions:</span>
                                                <span className="text-red-600">₹{(result.pfAmount + result.professionalTax + (result.absentDeduction || 0)).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between pt-2 border-t">
                                                <span className="text-gray-800 font-semibold">Net Salary:</span>
                                                <span className="text-green-600 font-bold text-lg">₹{result.netSalary?.toLocaleString()}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Earnings & Deductions */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-lg text-green-600">Earnings</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex justify-between">
                                                <span>Basic Salary</span>
                                                <span className="font-semibold">₹{result.basic?.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>House Rent Allowance</span>
                                                <span className="font-semibold">₹{result.hra?.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Fuel Allowance</span>
                                                <span className="font-semibold">₹{result.fuelAllowance?.toLocaleString()}</span>
                                            </div>
                                            {result.bonus > 0 && (
                                                <div className="flex justify-between">
                                                    <span>Performance Bonus</span>
                                                    <span className="font-semibold text-green-600">₹{result.bonus?.toLocaleString()}</span>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-lg text-red-600">Deductions</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex justify-between">
                                                <span>Provident Fund</span>
                                                <span className="font-semibold">₹{result.pfAmount?.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Professional Tax</span>
                                                <span className="font-semibold">₹{result.professionalTax?.toLocaleString()}</span>
                                            </div>
                                            {result.absentDeduction > 0 && (
                                                <div className="flex justify-between">
                                                    <span>Absent Deduction</span>
                                                    <span className="font-semibold text-red-600">₹{result.absentDeduction?.toLocaleString()}</span>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Leave Information */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg">Leave Information</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                                                <div className="text-2xl font-bold text-blue-600">{result.paidLeaveUsed || 0}</div>
                                                <div className="text-sm text-gray-600">Paid Leaves Used</div>
                                            </div>
                                            <div className="text-center p-3 bg-red-50 rounded-lg">
                                                <div className="text-2xl font-bold text-red-600">{result.lopDays || 0}</div>
                                                <div className="text-sm text-gray-600">LOP Days</div>
                                            </div>
                                            <div className="text-center p-3 bg-orange-50 rounded-lg">
                                                <div className="text-2xl font-bold text-orange-600">{result.casualLeavesConsumed || 0}</div>
                                                <div className="text-sm text-gray-600">Casual Leaves</div>
                                            </div>
                                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                                <div className="text-2xl font-bold text-green-600">{result.leavesRemaining || 0}</div>
                                                <div className="text-sm text-gray-600">Leaves Remaining</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 border-t">
                                    <Button variant="outline" onClick={clearForm} className="flex-1">
                                        Generate New Slip
                                    </Button>
                                    <Button onClick={() => generateSalaryPDF(result)} className="flex-1 bg-green-600 hover:bg-green-700">
                                        Download PDF Slip
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* No Results State */}
                    {!result && !loading && message && message.includes("No existing slip found") && (
                        <Card className="text-center py-12 border-dashed">
                            <CardContent>
                                <div className="text-6xl mb-4">📄</div>
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Salary Slip Found</h3>
                                <p className="text-gray-500 mb-6">No salary slip exists for the selected employee and month.</p>
                                <Button 
                                    onClick={() => generateNewSlip(false)} 
                                    className="bg-blue-600 hover:bg-blue-700"
                                    disabled={loading}
                                >
                                    Generate New Salary Slip
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}