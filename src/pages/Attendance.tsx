import { useEffect, useState, useMemo } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/context/AuthContext"
import { 
  checkIn, 
  checkOut, 
  getMyAttendance, 
  getAttendanceDashboard,
  getEmployeeAttendance 
} from "@/api/attendance"
import { fetchEmployees } from "@/api/employees"

// Helper to convert UTC to EST with DST awareness
function toEST(date: Date): Date {
  const utcDate = new Date(date.toISOString());
  // EST is UTC-5, EDT is UTC-4
  const isDST = () => {
    const year = utcDate.getUTCFullYear();
    // DST: Second Sunday in March to First Sunday in November
    const march = new Date(Date.UTC(year, 2, 8)); // March 8th
    const november = new Date(Date.UTC(year, 10, 1)); // November 1st
    
    // Find second Sunday in March
    while (march.getUTCDay() !== 0) march.setUTCDate(march.getUTCDate() + 1);
    march.setUTCDate(march.getUTCDate() + 7);
    
    // Find first Sunday in November
    while (november.getUTCDay() !== 0) november.setUTCDate(november.getUTCDate() + 1);
    
    return utcDate >= march && utcDate < november;
  };
  
  const offset = isDST() ? -4 : -5;
  utcDate.setUTCHours(utcDate.getUTCHours() + offset);
  return utcDate;
}

function formatESTTime(date: Date): string {
  const estDate = toEST(date);
  return estDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'America/New_York'
  });
}

function formatESTDate(date: Date): string {
  const estDate = toEST(date);
  return estDate.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/New_York'
  });
}

function getCurrentESTDate(): string {
  const now = new Date();
  const estDate = toEST(now);
  return estDate.toISOString().split('T')[0]; // YYYY-MM-DD
}

function isWorkingHours(): boolean {
  const now = new Date();
  const estDate = toEST(now);
  const hours = estDate.getHours();
  const minutes = estDate.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  
  // 9:00 AM to 6:00 PM EST
  const start = 9 * 60; // 9:00 AM
  const end = 18 * 60; // 6:00 PM
  
  return totalMinutes >= start && totalMinutes <= end;
}

function calculateWorkingHours(checkin: string, checkout: string | null): string {
  if (!checkout) return "Still working";
  
  const checkinDate = new Date(checkin);
  const checkoutDate = new Date(checkout);
  const diffMs = checkoutDate.getTime() - checkinDate.getTime();
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
}

function getAttendanceStatus(checkin: string, checkout: string | null): {
  status: "present" | "absent" | "half-day" | "on-leave";
  label: string;
  color: string;
} {
  if (!checkin) return { status: "absent", label: "Absent", color: "bg-red-100 text-red-800" };
  
  const checkinDate = new Date(checkin);
  const estCheckin = toEST(checkinDate);
  const checkinHour = estCheckin.getHours();
  
  // Late after 9:30 AM
  if (checkinHour > 9 || (checkinHour === 9 && estCheckin.getMinutes() > 30)) {
    if (!checkout) return { status: "present", label: "Present (Late)", color: "bg-yellow-100 text-yellow-800" };
    
    const checkoutDate = new Date(checkout);
    const diffMs = checkoutDate.getTime() - checkinDate.getTime();
    const hours = diffMs / (1000 * 60 * 60);
    
    if (hours < 8) {
      return { status: "half-day", label: "Half Day", color: "bg-orange-100 text-orange-800" };
    }
    return { status: "present", label: "Present (Late)", color: "bg-yellow-100 text-yellow-800" };
  }
  
  if (!checkout) return { status: "present", label: "Present", color: "bg-green-100 text-green-800" };
  
  const checkoutDate = new Date(checkout);
  const diffMs = checkoutDate.getTime() - checkinDate.getTime();
  const hours = diffMs / (1000 * 60 * 60);
  
  if (hours < 8) {
    return { status: "half-day", label: "Half Day", color: "bg-orange-100 text-orange-800" };
  }
  
  return { status: "present", label: "Present", color: "bg-green-100 text-green-800" };
}

export default function Attendance() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("my-attendance")
  const [myAttendance, setMyAttendance] = useState<any[]>([])
  const [dashboard, setDashboard] = useState<any>(null)
  const [employees, setEmployees] = useState<any[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<string>("")
  const [employeeAttendance, setEmployeeAttendance] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  })

  const [checkinStatus, setCheckinStatus] = useState<{
    hasCheckedIn: boolean;
    checkinTime?: string;
    checkinId?: string;
  }>({ hasCheckedIn: false })

  // Current EST time display
  const [currentTime, setCurrentTime] = useState<string>("")
  const [currentDate, setCurrentDate] = useState<string>("")

  useEffect(() => {
    // Update current EST time every second
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(formatESTTime(now));
      setCurrentDate(formatESTDate(now));
    }, 1000);

    return () => clearInterval(timer);
  }, [])

  useEffect(() => {
    loadData()
  }, [activeTab, selectedEmployee, dateRange])

  async function loadData() {
    setLoading(true)
    try {
      if (user?.role === 'employee') {
        // For employees, show their attendance
        const [attendance, todayStatus] = await Promise.all([
          getMyAttendance(dateRange.from.toISOString().split('T')[0], dateRange.to.toISOString().split('T')[0]),
          checkTodayStatus()
        ])
        setMyAttendance(attendance)
        setCheckinStatus(todayStatus)
      } else if (user?.role === 'hr' || user?.role === 'admin') {
        // For HR/Admin, show dashboard and employees list
        const [dashboardData, employeesList] = await Promise.all([
          getAttendanceDashboard(),
          fetchEmployees()
        ])
        setDashboard(dashboardData)
        setEmployees(employeesList)

        // If an employee is selected, load their attendance
        if (selectedEmployee) {
          const empAttendance = await getEmployeeAttendance(
            selectedEmployee,
            dateRange.from.toISOString().split('T')[0],
            dateRange.to.toISOString().split('T')[0]
          )
          setEmployeeAttendance(empAttendance)
        }
      }
    } catch (error) {
      console.error("Error loading attendance data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function checkTodayStatus() {
    try {
      const today = getCurrentESTDate()
      const myAttendance = await getMyAttendance(today, today)
      const todayRecord = myAttendance.find((a: any) => a.date === today)
      
      if (todayRecord) {
        return {
          hasCheckedIn: true,
          checkinTime: todayRecord.checkinTime,
          checkinId: todayRecord.checkinId,
          hasCheckedOut: !!todayRecord.checkoutTime
        }
      }
      return { hasCheckedIn: false }
    } catch (error) {
      return { hasCheckedIn: false }
    }
  }

  async function handleCheckIn() {
    try {
      await checkIn()
      setCheckinStatus({
        hasCheckedIn: true,
        checkinTime: new Date().toISOString()
      })
      await loadData()
    } catch (error) {
      console.error("Error checking in:", error)
      alert("Failed to check in")
    }
  }

  async function handleCheckOut() {
    try {
      await checkOut(checkinStatus.checkinId!)
      setCheckinStatus({ hasCheckedIn: false })
      await loadData()
    } catch (error) {
      console.error("Error checking out:", error)
      alert("Failed to check out")
    }
  }

  // Statistics for current month
  const currentMonthStats = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    const monthAttendance = myAttendance.filter(a => a.date.startsWith(currentMonth))
    
    const presentDays = monthAttendance.filter(a => {
      const status = getAttendanceStatus(a.checkinTime, a.checkoutTime)
      return status.status === "present"
    }).length
    
    const halfDays = monthAttendance.filter(a => {
      const status = getAttendanceStatus(a.checkinTime, a.checkoutTime)
      return status.status === "half-day"
    }).length
    
    const workingDays = new Date().getDate() // Days elapsed in current month
    const attendancePercentage = workingDays > 0 ? ((presentDays + (halfDays * 0.5)) / workingDays) * 100 : 0
    
    const totalWorkingHours = monthAttendance.reduce((total, a) => {
      if (a.checkinTime && a.checkoutTime) {
        const checkinDate = new Date(a.checkinTime)
        const checkoutDate = new Date(a.checkoutTime)
        const diffMs = checkoutDate.getTime() - checkinDate.getTime()
        return total + (diffMs / (1000 * 60 * 60))
      }
      return total
    }, 0)
    
    return {
      presentDays,
      halfDays,
      absentDays: workingDays - presentDays - halfDays,
      workingDays,
      attendancePercentage: Math.round(attendancePercentage),
      totalWorkingHours: Math.round(totalWorkingHours),
      averageDailyHours: monthAttendance.length > 0 ? (totalWorkingHours / monthAttendance.length).toFixed(1) : "0.0"
    }
  }, [myAttendance])

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
      {/* Header with current time */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600 mt-1">
            EST Timezone • Working Hours: 9:00 AM - 6:00 PM EST
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{currentTime}</div>
          <div className="text-sm text-gray-600">{currentDate} (EST)</div>
          {!isWorkingHours() && (
            <Badge variant="outline" className="mt-1 bg-yellow-50 text-yellow-700 border-yellow-200">
              ⚠️ Outside working hours
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="my-attendance">My Attendance</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard {user?.role !== 'employee' && '(HR/Admin)'}</TabsTrigger>
        </TabsList>

        {/* My Attendance Tab - For all users */}
        <TabsContent value="my-attendance" className="space-y-6">
          {/* Check-in/Check-out Card */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Daily Check-in</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Check in when you arrive and check out when you leave
                  </p>
                  {checkinStatus.hasCheckedIn && checkinStatus.checkinTime && (
                    <p className="text-sm text-green-600 mt-2">
                      Checked in at: {formatESTTime(new Date(checkinStatus.checkinTime))}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-3">
                  {!checkinStatus.hasCheckedIn ? (
                    <Button 
                      onClick={handleCheckIn}
                      disabled={!isWorkingHours()}
                      className="bg-green-600 hover:bg-green-700 px-6"
                    >
                      📍 Check In
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleCheckOut}
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50 px-6"
                    >
                      🏠 Check Out
                    </Button>
                  )}
                  
                  {!isWorkingHours() && !checkinStatus.hasCheckedIn && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      Check-in available 9:00 AM - 6:00 PM EST
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Present Days</p>
                    <p className="text-2xl font-bold text-gray-900">{currentMonthStats.presentDays}</p>
                  </div>
                  <div className="text-2xl">✅</div>
                </div>
                <Progress value={currentMonthStats.attendancePercentage} className="mt-2" />
                <p className="text-xs text-gray-500 mt-1">{currentMonthStats.attendancePercentage}% attendance</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Half Days</p>
                    <p className="text-2xl font-bold text-gray-900">{currentMonthStats.halfDays}</p>
                  </div>
                  <div className="text-2xl">⏰</div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {currentMonthStats.workingDays - currentMonthStats.presentDays - currentMonthStats.halfDays} full absent days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Hours</p>
                    <p className="text-2xl font-bold text-gray-900">{currentMonthStats.totalWorkingHours}h</p>
                  </div>
                  <div className="text-2xl">⏱️</div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Avg: {currentMonthStats.averageDailyHours}h per day
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Working Days</p>
                    <p className="text-2xl font-bold text-gray-900">{currentMonthStats.workingDays}</p>
                  </div>
                  <div className="text-2xl">📅</div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date().toLocaleDateString('en-US', { month: 'long' })} {new Date().getFullYear()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Attendance History */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Working Hours</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myAttendance.length > 0 ? myAttendance.map((record) => {
                    const status = getAttendanceStatus(record.checkinTime, record.checkoutTime)
                    return (
                      <TableRow key={record.checkinId}>
                        <TableCell className="font-medium">
                          {formatESTDate(new Date(record.date))}
                        </TableCell>
                        <TableCell>
                          {record.checkinTime ? formatESTTime(new Date(record.checkinTime)) : "-"}
                        </TableCell>
                        <TableCell>
                          {record.checkoutTime ? formatESTTime(new Date(record.checkoutTime)) : "-"}
                        </TableCell>
                        <TableCell>
                          {calculateWorkingHours(record.checkinTime, record.checkoutTime)}
                        </TableCell>
                        <TableCell>
                          <Badge className={status.color}>
                            {status.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  }) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No attendance records found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dashboard Tab - HR/Admin only */}
        {(user?.role === 'hr' || user?.role === 'admin') && (
          <TabsContent value="dashboard" className="space-y-6">
            {/* Real-time Dashboard */}
            <Card>
              <CardHeader>
                <CardTitle>Real-time Attendance Dashboard</CardTitle>
                <p className="text-sm text-gray-600">
                  Live view of today's attendance ({getCurrentESTDate()})
                </p>
              </CardHeader>
              <CardContent>
                {dashboard ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-600">Checked In</p>
                            <p className="text-2xl font-bold text-green-900">{dashboard.checkedIn}</p>
                          </div>
                          <div className="text-2xl">✅</div>
                        </div>
                        <p className="text-xs text-green-700 mt-1">
                          Currently working
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-600">Checked Out</p>
                            <p className="text-2xl font-bold text-blue-900">{dashboard.checkedOut}</p>
                          </div>
                          <div className="text-2xl">🏠</div>
                        </div>
                        <p className="text-xs text-blue-700 mt-1">
                          Finished for today
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-yellow-50 border-yellow-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-yellow-600">Not Checked In</p>
                            <p className="text-2xl font-bold text-yellow-900">{dashboard.notCheckedIn}</p>
                          </div>
                          <div className="text-2xl">⏰</div>
                        </div>
                        <p className="text-xs text-yellow-700 mt-1">
                          Yet to arrive or absent
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-50 border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Employees</p>
                            <p className="text-2xl font-bold text-gray-900">{dashboard.totalEmployees}</p>
                          </div>
                          <div className="text-2xl">👥</div>
                        </div>
                        <p className="text-xs text-gray-700 mt-1">
                          All active employees
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Loading dashboard...</p>
                )}
              </CardContent>
            </Card>

            {/* Employee Selector for HR/Admin */}
            <Card>
              <CardHeader>
                <CardTitle>View Employee Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger className="w-full md:w-64">
                      <SelectValue placeholder="Select Employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.employeeId} value={emp.employeeId}>
                          {emp.employeeId} - {emp.firstName} {emp.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Date Range:</span>{" "}
                      {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDateRange({
                          from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                          to: new Date()
                        })
                      }}
                    >
                      This Month
                    </Button>
                  </div>
                </div>

                {selectedEmployee && employeeAttendance.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Check-in</TableHead>
                        <TableHead>Check-out</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeeAttendance.map((record) => {
                        const status = getAttendanceStatus(record.checkinTime, record.checkoutTime)
                        const employee = employees.find(e => e.employeeId === record.employeeId)
                        return (
                          <TableRow key={record.checkinId}>
                            <TableCell>{formatESTDate(new Date(record.date))}</TableCell>
                            <TableCell>
                              <div className="font-medium">{employee?.firstName} {employee?.lastName}</div>
                              <div className="text-sm text-gray-500">{record.employeeId}</div>
                            </TableCell>
                            <TableCell>{record.department}</TableCell>
                            <TableCell>
                              {record.checkinTime ? formatESTTime(new Date(record.checkinTime)) : "-"}
                            </TableCell>
                            <TableCell>
                              {record.checkoutTime ? formatESTTime(new Date(record.checkoutTime)) : "-"}
                            </TableCell>
                            <TableCell>
                              <Badge className={status.color}>
                                {status.label}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                ) : selectedEmployee ? (
                  <p className="text-gray-500 text-center py-8">No attendance records found for this employee</p>
                ) : (
                  <p className="text-gray-500 text-center py-8">Select an employee to view their attendance</p>
                )}
              </CardContent>
            </Card>

            {/* Today's Attendance List */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Attendance ({getCurrentESTDate()})</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard?.attendanceRecords && dashboard.attendanceRecords.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Check-in Time</TableHead>
                        <TableHead>Check-out Time</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboard.attendanceRecords.map((record: any) => {
                        const status = getAttendanceStatus(record.checkinTime, record.checkoutTime)
                        return (
                          <TableRow key={record.checkinId}>
                            <TableCell>
                              <div className="font-medium">{record.employeeName}</div>
                              <div className="text-sm text-gray-500">{record.employeeId}</div>
                            </TableCell>
                            <TableCell>{record.department}</TableCell>
                            <TableCell>
                              {record.checkinTime ? formatESTTime(new Date(record.checkinTime)) : "-"}
                            </TableCell>
                            <TableCell>
                              {record.checkoutTime ? formatESTTime(new Date(record.checkoutTime)) : "-"}
                            </TableCell>
                            <TableCell>
                              <Badge className={status.color}>
                                {status.label}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-gray-500 text-center py-8">No attendance records for today yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}