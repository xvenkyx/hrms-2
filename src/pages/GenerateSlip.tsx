// SalarySlip.tsx - Complete Updated Version
import { useState, useEffect, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { fetchEmployees } from "@/api/employees"
import { generateSlip, getExistingSlip } from "@/api/salary"
import { generateSalaryPDF } from "@/utils/pdf"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

interface Employee {
  employeeId: string
  firstName: string
  lastName: string
  department: string
  designation: string
  company_email: string
  baseSalary: number
  pfApplicable: boolean | 'pending'
  pfStartDate?: string
  joiningDate?: string
  account_number?: string
  ifsc_code?: string
  pan_number?: string
  uan_number?: string
}

interface SalarySlip {
  employeeId: string
  employeeName: string
  yearMonth: string
  monthName?: string
  department: string
  designation: string
  baseSalary: number
  grossSalary: number
  netSalary: number
  basic: number
  hra: number
  fuelAllowance: number
  pfAmount: number
  pfApplicable: boolean
  professionalTax: number
  absentDeduction: number
  bonus: number
  paidLeaveUsed: number
  lopDays: number
  casualLeavesConsumed: number
  sickLeavesConsumed: number
  leavesRemaining: number
  daysInMonth: number
  perDaySalary: number
  createdAt: string
  totalDays?: number
  daysPresent?: number
  arrearDays?: number
  uanNumber?: string
  panNumber?: string
  accountNumber?: string
  ifscCode?: string
  bankName?: string
  companyName?: string
  companyAddress?: string
  calculationNotes?: string
}

// Custom toast component
const Toast = ({ message, type = "info", onClose }: { 
  message: string; 
  type?: "info" | "success" | "error"; 
  onClose: () => void 
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  const bgColor = type === "success" ? "bg-green-50 border-green-200 text-green-800" :
                  type === "error" ? "bg-red-50 border-red-200 text-red-800" :
                  "bg-blue-50 border-blue-200 text-blue-800"

  const icon = type === "success" ? "✅" :
               type === "error" ? "❌" :
               "ℹ️"

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg border shadow-lg ${bgColor} max-w-sm`}>
      <div className="flex items-start gap-3">
        <span className="text-lg">{icon}</span>
        <div className="flex-1">
          <p className="font-medium">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>
    </div>
  )
}

// Helper function to format month name
function formatMonthName(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(year, month - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// Helper function to convert number to words
function convertToWords(num: number): string {
  const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
  const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  
  if (num === 0) return 'zero';
  
  let words = '';
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundred = Math.floor((num % 1000) / 100);
  const tens = num % 100;
  
  if (crore > 0) words += convertToWords(crore) + ' crore ';
  if (lakh > 0) words += convertToWords(lakh) + ' lakh ';
  if (thousand > 0) words += convertToWords(thousand) + ' thousand ';
  if (hundred > 0) words += convertToWords(hundred) + ' hundred ';
  
  if (tens > 0) {
    if (tens < 20) {
      words += a[tens];
    } else {
      words += b[Math.floor(tens / 10)];
      if (tens % 10 > 0) words += '-' + a[tens % 10];
    }
  }
  
  return words.trim().toUpperCase() + ' ONLY';
}

export default function SalarySlip() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [employeeId, setEmployeeId] = useState("")
  const [yearMonth, setYearMonth] = useState("")
  const [result, setResult] = useState<SalarySlip | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingEmployees, setLoadingEmployees] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: "info" | "success" | "error" } | null>(null)

  useEffect(() => {
    loadEmployees()
  }, [])

  async function loadEmployees() {
    setLoadingEmployees(true)
    try {
      const emps = await fetchEmployees()
      // Transform employees to include name field
      const transformedEmps = emps.map(emp => ({
        ...emp,
        name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim()
      }))
      setEmployees(transformedEmps)
    } catch (error) {
      console.error("Error loading employees:", error)
      showToast("Failed to load employees", "error")
    } finally {
      setLoadingEmployees(false)
    }
  }

  // Get current month in YYYY-MM format
  const currentMonth = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }, [])

  // Filter employees who have a base salary
  const eligibleEmployees = useMemo(() => {
    return employees.filter(emp => emp.baseSalary > 0)
  }, [employees])

  async function checkExistingSlip() {
    if (!employeeId || !yearMonth) {
      showToast("Please select both employee and month", "error")
      return
    }

    const selectedEmp = employees.find(e => e.employeeId === employeeId)
    if (!selectedEmp) return

    setLoading(true)
    
    try {
      const data = await getExistingSlip({ employeeId, yearMonth })
      
      if (data.slip) {
        setResult(data.slip)
        showToast("✓ Existing salary slip found", "success")
      } else {
        setResult(null)
        showToast("No existing slip found. Generate a new one.", "info")
      }
    } catch (error: any) {
      if (error.error === "Salary slip not found") {
        setResult(null)
        showToast("No existing slip found. Generate a new one.", "info")
      } else {
        showToast("Failed to check for existing slip", "error")
      }
    } finally {
      setLoading(false)
    }
  }

  async function generateNewSlip(forceRegenerate = false) {
    if (!employeeId || !yearMonth) {
      showToast("Please select both employee and month", "error")
      return
    }

    const selectedEmp = employees.find(e => e.employeeId === employeeId)
    if (!selectedEmp) return

    setLoading(true)
    
    try {
      const slipData = await generateSlip({ 
        employeeId, 
        yearMonth,
        forceRegenerate 
      })
      
      if (slipData.slip) {
        setResult(slipData.slip)
        showToast(
          forceRegenerate 
            ? "✓ Salary slip regenerated successfully" 
            : "✓ New salary slip generated successfully", 
          "success"
        )
      } else {
        showToast("Failed to generate salary slip", "error")
      }
    } catch (error: any) {
      showToast(error.error || "Failed to generate slip", "error")
    } finally {
      setLoading(false)
    }
  }

  function showToast(message: string, type: "info" | "success" | "error" = "info") {
    setToast({ message, type })
  }

  function handleDownloadPDF() {
    if (!result) return
    
    // Check if PDF generation is available
    if (typeof generateSalaryPDF === 'function') {
      // Ensure we have all required fields for PDF
      const slipData = {
        ...result,
        // Add default values if missing
        totalDays: result.totalDays || result.daysInMonth || 30,
        daysPresent: result.daysPresent || ((result.daysInMonth || 30) - (result.lopDays || 0)),
        arrearDays: result.arrearDays || 0,
        monthName: result.monthName || formatMonthName(result.yearMonth),
        bankName: result.bankName || "State Bank of India",
        companyName: result.companyName || "JHEX Consulting LLP",
        companyAddress: result.companyAddress || "FF-Block-A-103, Ganesh Meridian, Opp High Court, SG Highway, Ghatlodiya Ahmedabad – (380061)",
        uanNumber: result.uanNumber || "",
        panNumber: result.panNumber || "",
        accountNumber: result.accountNumber || "",
        ifscCode: result.ifscCode || ""
      };
      
      generateSalaryPDF(slipData);
    } else {
      // Fallback: Create a simple HTML slip
      const slipContent = `
        <html>
          <head>
            <title>Salary Slip - ${result.employeeName}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
              .company-name { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
              .company-address { font-size: 12px; color: #666; margin-bottom: 10px; }
              .slip-title { font-size: 16px; font-weight: bold; margin-top: 15px; }
              .employee-info { display: flex; justify-content: space-between; margin: 20px 0; }
              .info-column { flex: 1; }
              .info-label { font-weight: bold; color: #555; }
              .info-value { margin-bottom: 8px; }
              .salary-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .salary-table th, .salary-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
              .salary-table th { background-color: #f5f5f5; font-weight: bold; }
              .earning { color: green; }
              .deduction { color: red; }
              .net-salary { font-size: 18px; font-weight: bold; text-align: center; margin: 20px 0; color: #2e7d32; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 15px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="company-name">JHEX Consulting LLP</div>
              <div class="company-address">FF-Block-A-103, Ganesh Meridian, Opp High Court, SG Highway, Ghatlodiya Ahmedabad – (380061)</div>
              <div class="slip-title">Pay slip for the month of ${formatMonthName(result.yearMonth)}</div>
            </div>
            
            <div class="employee-info">
              <div class="info-column">
                <div class="info-value"><span class="info-label">EMP Code:</span> ${result.employeeId}</div>
                <div class="info-value"><span class="info-label">Name:</span> ${result.employeeName}</div>
                <div class="info-value"><span class="info-label">Department:</span> ${result.department}</div>
                <div class="info-value"><span class="info-label">Designation:</span> ${result.designation || "Not specified"}</div>
              </div>
              <div class="info-column">
                <div class="info-value"><span class="info-label">Bank:</span> State Bank of India</div>
                <div class="info-value"><span class="info-label">A/C No:</span> ${result.accountNumber || "Not specified"}</div>
                <div class="info-value"><span class="info-label">IFSC Code:</span> ${result.ifscCode || "Not specified"}</div>
                <div class="info-value"><span class="info-label">UAN No:</span> ${result.uanNumber || "Not specified"}</div>
                <div class="info-value"><span class="info-label">PAN No:</span> ${result.panNumber || "Not specified"}</div>
              </div>
            </div>
            
            <div class="employee-info">
              <div class="info-column">
                <div class="info-value"><span class="info-label">Total Days:</span> ${result.daysInMonth || 30}</div>
                <div class="info-value"><span class="info-label">Days Present:</span> ${(result.daysInMonth || 30) - (result.lopDays || 0)}</div>
              </div>
              <div class="info-column">
                <div class="info-value"><span class="info-label">Arrear Days:</span> 0</div>
                <div class="info-value"><span class="info-label">LWP/Absent:</span> ${result.lopDays || 0}.0</div>
              </div>
            </div>
            
            <table class="salary-table">
              <tr>
                <th>Earning</th>
                <th>Amount</th>
                <th>Deductions</th>
                <th>Amount</th>
              </tr>
              <tr>
                <td>Basic</td>
                <td class="earning">₹${result.basic?.toLocaleString()}.00</td>
                <td>PF</td>
                <td class="deduction">-₹${result.pfAmount?.toLocaleString()}.00</td>
              </tr>
              <tr>
                <td>HRA</td>
                <td class="earning">₹${result.hra?.toLocaleString()}.00</td>
                <td>PT</td>
                <td class="deduction">-₹${result.professionalTax?.toLocaleString()}.00</td>
              </tr>
              <tr>
                <td>Fuel Allowance</td>
                <td class="earning">₹${result.fuelAllowance?.toLocaleString()}.00</td>
                <td>${result.absentDeduction > 0 ? 'Absent Deduction' : ''}</td>
                <td class="deduction">${result.absentDeduction > 0 ? `-₹${result.absentDeduction?.toLocaleString()}.00` : ''}</td>
              </tr>
              ${result.bonus > 0 ? `
              <tr>
                <td>Performance Bonus</td>
                <td class="earning">+₹${result.bonus?.toLocaleString()}.00</td>
                <td></td>
                <td></td>
              </tr>
              ` : ''}
              <tr>
                <td><strong>Total Earning</strong></td>
                <td><strong>₹${(result.basic + result.hra + result.fuelAllowance + result.bonus)?.toLocaleString()}.00</strong></td>
                <td></td>
                <td></td>
              </tr>
            </table>
            
            <div class="net-salary">
              Net Pay: ₹${result.netSalary?.toLocaleString()}.00
              <div style="font-size: 14px; font-weight: normal; margin-top: 10px;">
                In words: ${convertToWords(result.netSalary)}
              </div>
            </div>
            
            <div class="footer">
              This is the system generated pay slip, Signature not required<br>
              Generated on: ${new Date().toLocaleDateString()}
            </div>
          </body>
        </html>
      `;
      
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(slipContent)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  function clearForm() {
    setEmployeeId("")
    setYearMonth("")
    setResult(null)
  }

  // Get selected employee details
  const selectedEmployee = useMemo(() => {
    return employees.find(e => e.employeeId === employeeId)
  }, [employeeId, employees])

  if (loadingEmployees) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading employees...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Salary Slip Generator</h1>
          <p className="text-gray-600 mt-1">
            Generate and download professional salary slips for employees
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
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Select Employee *
              </label>
              <Select 
                value={employeeId} 
                onValueChange={(value) => {
                  setEmployeeId(value)
                  setResult(null)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleEmployees.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No eligible employees found
                    </SelectItem>
                  ) : (
                    eligibleEmployees.map((emp) => (
                      <SelectItem key={emp.employeeId} value={emp.employeeId}>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {`${emp.firstName} ${emp.lastName}`.trim()}
                          </span>
                          <span className="text-xs text-gray-500">
                            {emp.employeeId} • {emp.department} • ₹{emp.baseSalary?.toLocaleString()}/month
                          </span>
                          <span className="text-xs mt-1">
                            <Badge variant="outline" className={
                              emp.pfApplicable === true ? "bg-green-100 text-green-800" :
                              emp.pfApplicable === "pending" ? "bg-yellow-100 text-yellow-800" :
                              "bg-gray-100 text-gray-800"
                            }>
                              {emp.pfApplicable === true ? "PF Applicable" :
                               emp.pfApplicable === "pending" ? "PF Pending" :
                               "PF Not Applicable"}
                            </Badge>
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedEmployee && (
                <div className="mt-2 text-sm text-gray-600">
                  <span className="font-medium">PF Status:</span>{" "}
                  {selectedEmployee.pfApplicable === true ? "Applicable" :
                   selectedEmployee.pfApplicable === "pending" ? `Pending (starts ${selectedEmployee.pfStartDate})` :
                   "Not Applicable"}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Select Month *
              </label>
              <Input
                type="month"
                value={yearMonth}
                onChange={(e) => {
                  setYearMonth(e.target.value)
                  setResult(null)
                }}
                className="w-full"
                max={currentMonth}
              />
              <div className="mt-2 text-xs text-gray-500">
                Select any past or current month
              </div>
            </div>

            <div className="flex flex-col justify-end gap-2">
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
              {eligibleEmployees.length === 0 && (
                <div className="text-sm text-amber-600 mt-2">
                  Note: Only employees with base salary set can generate slips
                </div>
              )}
            </div>
          </div>

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
                      {formatMonthName(result.yearMonth)} • {result.employeeId}
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
                      onClick={handleDownloadPDF}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      📄 Download PDF
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={clearForm}
                    >
                      Clear
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
                        <span className="text-gray-600">Designation:</span>
                        <span>{result.designation || "Not specified"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">PF Applicable:</span>
                        <Badge variant={result.pfApplicable ? "default" : "secondary"}>
                          {result.pfApplicable ? "Yes" : "No"}
                        </Badge>
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
                        <span className="text-red-600">
                          ₹{(result.pfAmount + result.professionalTax + (result.absentDeduction || 0)).toLocaleString()}
                        </span>
                      </div>
                      {result.bonus > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Performance Bonus:</span>
                          <span className="text-green-600">+ ₹{result.bonus?.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-gray-800 font-semibold">Net Salary:</span>
                        <span className="text-green-600 font-bold text-lg">
                          ₹{result.netSalary?.toLocaleString()}
                        </span>
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
                        <span>House Rent Allowance (HRA)</span>
                        <span className="font-semibold">₹{result.hra?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fuel Allowance</span>
                        <span className="font-semibold">₹{result.fuelAllowance?.toLocaleString()}</span>
                      </div>
                      {result.bonus > 0 && (
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-green-600">Performance Bonus</span>
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
                      {result.pfAmount > 0 && (
                        <div className="flex justify-between">
                          <span>Provident Fund (PF)</span>
                          <span className="font-semibold">₹{result.pfAmount?.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Professional Tax (PT)</span>
                        <span className="font-semibold">₹{result.professionalTax?.toLocaleString()}</span>
                      </div>
                      {result.absentDeduction > 0 && (
                        <div className="flex justify-between">
                          <span>Absent Deduction ({result.lopDays} days × ₹{result.perDaySalary}/day)</span>
                          <span className="font-semibold text-red-600">₹{result.absentDeduction?.toLocaleString()}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Leave & Attendance Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Leave & Attendance Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{result.paidLeaveUsed || 0}</div>
                        <div className="text-sm text-gray-600">Paid Leaves Used</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{result.lopDays || 0}</div>
                        <div className="text-sm text-gray-600">Loss of Pay Days</div>
                        {result.lopDays > 0 && (
                          <div className="text-xs text-red-500 mt-1">
                            ₹{result.perDaySalary}/day × {result.lopDays} days
                          </div>
                        )}
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
                    <div className="mt-4 text-sm text-gray-500">
                      <p>Working Days: {result.daysInMonth || 30} | Per Day Rate: ₹{result.perDaySalary?.toLocaleString()}</p>
                      <p>Days Present: {(result.daysInMonth || 30) - (result.lopDays || 0)} | LWP Days: {result.lopDays || 0}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 border-t">
                  <Button variant="outline" onClick={clearForm} className="flex-1">
                    Generate New Slip
                  </Button>
                  <Button 
                    onClick={handleDownloadPDF} 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    📄 Download PDF Slip
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Results State */}
          {!result && !loading && eligibleEmployees.length > 0 && (
            <Card className="text-center py-12 border-dashed">
              <CardContent>
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Generate Salary Slip</h3>
                <p className="text-gray-500 mb-6">
                  Select an employee and month to generate or check existing salary slip
                </p>
              </CardContent>
            </Card>
          )}

          {/* No Eligible Employees */}
          {eligibleEmployees.length === 0 && !loading && (
            <Card className="text-center py-12 border-dashed">
              <CardContent>
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Eligible Employees</h3>
                <p className="text-gray-500 mb-6">
                  Employees need to have their base salary set before generating salary slips.
                </p>
                <p className="text-sm text-gray-400">
                  Contact HR/Admin to set up employee salary information.
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}