import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { fetchEmployees } from "@/api/employees"
import { generateSlip } from "@/api/salary"
import { generateSalaryPDF } from "@/utils/pdf"   // <-- NEW IMPORT

export default function SalarySlip() {
  const [employees, setEmployees] = useState<any[]>([])
  const [employeeId, setEmployeeId] = useState("")
  const [yearMonth, setYearMonth] = useState("")
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const emps = await fetchEmployees()
    setEmployees(emps)
  }

  async function generate() {
    if (!employeeId || !yearMonth) {
      alert("Select employee and month")
      return
    }

    const slip = await generateSlip({ employeeId, yearMonth })
    setResult(slip.slip)
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
            <select
              className="border rounded px-3 py-2 w-full"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            >
              <option value="">Select Employee</option>
              {employees.map((e) => (
                <option key={e.employeeId} value={e.employeeId}>
                  {e.employeeId} — {e.name}
                </option>
              ))}
            </select>

            {/* Month */}
            <Input
              type="month"
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value)}
              className="w-full"
            />

            {/* Generate Button */}
            <Button onClick={generate} className="w-full md:w-auto">
              Generate
            </Button>
          </div>

          {/* OUTPUT CARD */}
          {result && (
            <Card className="mt-6 border shadow-sm">
              <CardHeader>
                <CardTitle>Salary Breakdown</CardTitle>
              </CardHeader>

              <CardContent>

                {/* Employee Info */}
                <div className="mb-4">
                  <p><strong>Name:</strong> {result.employeeName}</p>
                  <p><strong>Employee ID:</strong> {result.employeeId}</p>
                  <p><strong>Month:</strong> {result.yearMonth}</p>
                </div>

                {/* Salary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div className="p-3 border rounded bg-gray-50">
                    <p className="font-medium">Basic</p>
                    <p>₹ {result.basic}</p>
                  </div>

                  <div className="p-3 border rounded bg-gray-50">
                    <p className="font-medium">Allowances</p>
                    <p>₹ {result.allowance}</p>
                  </div>

                  <div className="p-3 border rounded bg-gray-50">
                    <p className="font-medium">Gross Salary</p>
                    <p>₹ {result.grossSalary}</p>
                  </div>

                  <div className="p-3 border rounded bg-gray-50">
                    <p className="font-medium">PF Deduction</p>
                    <p>₹ {result.pfAmount}</p>
                  </div>

                  <div className="p-3 border rounded bg-gray-50">
                    <p className="font-medium">Professional Tax</p>
                    <p>₹ {result.professionalTax}</p>
                  </div>

                  <div className="p-3 border rounded bg-gray-50">
                    <p className="font-medium">Absent Deduction</p>
                    <p>₹ {result.absentDeduction}</p>
                  </div>

                  <div className="p-3 border rounded bg-gray-50">
                    <p className="font-medium">Performance Bonus</p>
                    <p>₹ {result.bonus}</p>
                  </div>

                </div>

                {/* NET SALARY */}
                <div className="p-4 mt-6 border rounded bg-green-50 text-center">
                  <p className="text-xl font-bold">Net Salary: ₹ {result.netSalary}</p>
                </div>

                {/* DOWNLOAD PDF BUTTON */}
                <div className="flex justify-center mt-4">
                  <Button variant="outline" onClick={() => generateSalaryPDF(result)}>
                    Download PDF
                  </Button>
                </div>

              </CardContent>
            </Card>
          )}

        </CardContent>
      </Card>
    </div>
  )
}
