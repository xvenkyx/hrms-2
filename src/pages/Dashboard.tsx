import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { fetchEmployees } from "@/api/employees";
import { fetchSalaryHistory } from "@/api/salaryHistory";
import { fetchAttendance } from "@/api/attendance";
import { useAuth } from "@/context/AuthContext";
import type { User } from "@/context/AuthContext";

interface DashboardStats {
  totalEmployees: number;
  pendingSlips: number;
  thisMonthAttendance: number;
  totalBonus: number;
  totalProcessedSlips: number;
}

interface RecentActivity {
  action: string;
  employee?: string;
  month?: string;
  netSalary?: number;
  time: string;
  amount?: number;
}

interface Birthday {
  name: string;
  date: string;
  daysUntil: number;
  department: string;
}



interface HRDashboardProps {
  stats: DashboardStats;
  recentActivities: RecentActivity[];
  upcomingBirthdays: Birthday[];
  user: User | null;
  navigate: (path: string) => void;
}

interface EmployeeDashboardProps {
  stats: DashboardStats;
  recentActivities: RecentActivity[];
  user: User | null;
  navigate: (path: string) => void;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    pendingSlips: 0,
    thisMonthAttendance: 0,
    totalBonus: 0,
    totalProcessedSlips: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<Birthday[]>([]);
  const [loading, setLoading] = useState(true);

  // Separate dashboard data loading based on role
  useEffect(() => {
    if (user?.role === 'hr' || user?.role === 'admin') {
      loadHRDashboardData();
    } else {
      loadEmployeeDashboardData();
    }
  }, [user]);

  // HR/Admin Dashboard
  async function loadHRDashboardData() {
    setLoading(true);
    try {
      const [employees, salaryHistory, attendance] = await Promise.all([
        fetchEmployees(),
        fetchSalaryHistory({}),
        fetchAttendance(),
      ]);

      // Calculate birthdays
      const upcomingBdays = calculateUpcomingBirthdays(employees);
      setUpcomingBirthdays(upcomingBdays);

      // Calculate current month for filtering (format: YYYY-MM)
      const currentDate = new Date();
      const currentYearMonth = `${currentDate.getFullYear()}-${String(
        currentDate.getMonth() + 1
      ).padStart(2, "0")}`;
      const previousYearMonth = getPreviousMonth(currentYearMonth);

      // Calculate stats
      const totalEmployees = employees.length;

      // Count slips for previous month (assuming we process previous month's payroll)
      const previousMonthSlips =
        salaryHistory.slips?.filter(
          (slip: any) => slip.yearMonth === previousYearMonth
        ) || [];
      const totalProcessedSlips = previousMonthSlips.length;

      // Calculate pending slips (employees without slips for previous month)
      const pendingSlips = totalEmployees - totalProcessedSlips;

      // Calculate this month's attendance percentage
      const currentMonthAttendance = attendance.filter(
        (a: any) => a.yearMonth === currentYearMonth
      );
      const attendancePercentage =
        totalEmployees > 0
          ? Math.round((currentMonthAttendance.length / totalEmployees) * 100)
          : 0;

      // Calculate total bonus (from all slips)
      const totalBonus =
        salaryHistory.slips?.reduce(
          (sum: number, slip: any) => sum + (slip.bonus || 0),
          0
        ) || 0;

      // Get recent activities (last 5 salary slips)
      const recentSlips =
        salaryHistory.slips
          ?.sort(
            (a: any, b: any) =>
              new Date(b.processedAt || b.yearMonth).getTime() -
              new Date(a.processedAt || a.yearMonth).getTime()
          )
          .slice(0, 4) || [];

      const activities = recentSlips.map((slip: any) => ({
        action: "Salary slip generated",
        employee: slip.employeeName,
        time: formatTimeAgo(slip.processedAt || slip.yearMonth),
        amount: slip.netSalary,
      }));

      setStats({
        totalEmployees,
        pendingSlips: Math.max(0, pendingSlips),
        thisMonthAttendance: attendancePercentage,
        totalBonus,
        totalProcessedSlips,
      });

      setRecentActivities(activities);
    } catch (error) {
      console.error("Error loading HR dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  // Employee Dashboard
  async function loadEmployeeDashboardData() {
    setLoading(true);
    try {
      // Fetch employee-specific data
      const [salaryHistory, attendance] = await Promise.all([
        fetchSalaryHistory({ employeeId: user?.employeeId }),
        fetchAttendance(),
      ]);

      // Get recent salary slips
      const recentSlips = salaryHistory.slips
        ?.sort((a: any, b: any) => 
          new Date(b.processedAt || b.yearMonth).getTime() -
          new Date(a.processedAt || a.yearMonth).getTime()
        )
        .slice(0, 3) || [];

      // Format activities for employee
      const activities = recentSlips.map((slip: any) => ({
        action: "Salary slip generated",
        month: slip.yearMonth,
        netSalary: slip.netSalary,
        time: formatTimeAgo(slip.processedAt || slip.yearMonth),
      }));

      // Calculate employee-specific stats
      const currentDate = new Date();
      const currentYearMonth = `${currentDate.getFullYear()}-${String(
        currentDate.getMonth() + 1
      ).padStart(2, "0")}`;

      const currentMonthAttendance = attendance.filter(
        (a: any) => a.yearMonth === currentYearMonth && a.employeeId === user?.employeeId
      );

      // Calculate total bonus
      const totalBonus = recentSlips.reduce(
        (sum: number, slip: any) => sum + (slip.bonus || 0),
        0
      );

      setStats({
        totalEmployees: 1,
        pendingSlips: 0,
        thisMonthAttendance: currentMonthAttendance.length > 0 ? 100 : 0,
        totalBonus,
        totalProcessedSlips: recentSlips.length,
      });

      setRecentActivities(activities);
    } catch (error) {
      console.error("Error loading employee dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  // Helper function for birthdays
  function calculateUpcomingBirthdays(employees: any[]): Birthday[] {
    const today = new Date();
    const upcoming: Birthday[] = [];

    for (const emp of employees) {
      if (emp.date_of_birth) {
        try {
          const birthDate = new Date(emp.date_of_birth);
          const nextBirthday = new Date(
            today.getFullYear(),
            birthDate.getMonth(),
            birthDate.getDate()
          );

          if (nextBirthday < today) {
            nextBirthday.setFullYear(today.getFullYear() + 1);
          }

          const daysUntil = Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntil <= 30) {
            upcoming.push({
              name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
              date: emp.date_of_birth,
              daysUntil,
              department: emp.department || 'Unknown',
            });
          }
        } catch (e) {
          console.error("Error processing birthday for employee:", emp.employeeId, e);
        }
      }
    }

    return upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
  }

  // Helper function to get previous month
  function getPreviousMonth(yearMonth: string): string {
    const [year, month] = yearMonth.split("-").map(Number);
    let prevYear = year;
    let prevMonth = month - 1;

    if (prevMonth === 0) {
      prevYear = year - 1;
      prevMonth = 12;
    }
    return `${prevYear}-${String(prevMonth).padStart(2, "0")}`;
  }

  // Helper function to format time ago
  function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  // Format birthday display
  function formatBirthdayDisplay(birthday: Birthday): string {
    const birthDate = new Date(birthday.date);
    const today = new Date();
    const nextBirthday = new Date(
      today.getFullYear(),
      birthDate.getMonth(),
      birthDate.getDate()
    );

    if (nextBirthday.getDate() === today.getDate() && 
        nextBirthday.getMonth() === today.getMonth()) {
      return "🎉 Today!";
    } else if (birthday.daysUntil === 1) {
      return "🎂 Tomorrow";
    } else {
      return `🎂 In ${birthday.daysUntil} days`;
    }
  }

  // Render different dashboards based on role
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (user?.role === 'hr' || user?.role === 'admin') {
    return <HRDashboard 
      stats={stats} 
      recentActivities={recentActivities}
      upcomingBirthdays={upcomingBirthdays}
      user={user}
      navigate={navigate}
    />;
  } else {
    return <EmployeeDashboard 
      stats={stats}
      recentActivities={recentActivities}
      user={user}
      navigate={navigate}
    />;
  }
}

// HR/Admin Dashboard Component
function HRDashboard({ stats, recentActivities, upcomingBirthdays, user, navigate }: HRDashboardProps) {
  const quickActions = [
    {
      title: "Manage Employees",
      description: "Add, edit, or view employee details",
      icon: "👥",
      path: "/employees",
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Mark Attendance",
      description: "Record daily attendance and leaves",
      icon: "📅",
      path: "/attendance",
      color: "from-green-500 to-green-600",
    },
    {
      title: "Generate Salary Slip",
      description: "Create and download salary slips",
      icon: "💰",
      path: "/generate-slip",
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "Leave Requests",
      description: "Review pending leave requests",
      icon: "📋",
      path: "/leave-requests",
      color: "from-orange-500 to-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-linear-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Welcome to JHEX Payroll, {user?.firstName}!
        </h1>
        <p className="text-blue-100">
          {stats.totalEmployees} employees • {stats.totalProcessedSlips} slips processed this month
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-linear-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Employees</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalEmployees}</p>
                <p className="text-xs text-blue-700 mt-1">Active staff</p>
              </div>
              <div className="text-3xl">👥</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Pending Slips</p>
                <p className="text-2xl font-bold text-green-900">{stats.pendingSlips}</p>
                <p className="text-xs text-green-700 mt-1">For this month</p>
              </div>
              <div className="text-3xl">📄</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Attendance</p>
                <p className="text-2xl font-bold text-purple-900">{stats.thisMonthAttendance}%</p>
                <p className="text-xs text-purple-700 mt-1">This month</p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Total Bonus</p>
                <p className="text-2xl font-bold text-orange-900">
                  ₹{stats.totalBonus?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-orange-700 mt-1">All time</p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Upcoming Birthdays */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => navigate(action.path)}
                  className={`p-4 rounded-xl bg-linear-to-r ${action.color} text-white text-left transition-transform hover:scale-105 shadow-md`}
                >
                  <div className="text-2xl mb-2">{action.icon}</div>
                  <h3 className="font-semibold text-sm mb-1">{action.title}</h3>
                  <p className="text-white text-opacity-90 text-xs">{action.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Birthdays */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Birthdays</CardTitle>
            <span className="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded-full">
              {upcomingBirthdays.length} upcoming
            </span>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingBirthdays.length > 0 ? (
                upcomingBirthdays.slice(0, 5).map((bday, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-pink-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-linear-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-white">
                        {bday.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{bday.name}</p>
                        <p className="text-sm text-gray-600">{bday.department}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-pink-600">{formatBirthdayDisplay(bday)}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(bday.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">🎂</div>
                  <p>No upcoming birthdays in the next 30 days</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50"
                  >
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.action}
                      </p>
                      <p className="text-sm text-gray-600">
                        {activity.employee}
                      </p>
                      <p className="text-xs text-green-600 font-medium">
                        ₹{activity.amount?.toLocaleString()}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {activity.time}
                    </span>
                  </div>
                ))
              ) : ( 
                <div className="text-center py-8 text-gray-500">
                  <p>No recent activity</p>
                  <p className="text-sm mt-1">
                    Generate some salary slips to see activity here
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-sm">Payroll Processing</p>
                  <p className="text-xs text-gray-600">
                    {stats.totalProcessedSlips} slips processed
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-sm">Employee Database</p>
                  <p className="text-xs text-gray-600">
                    {stats.totalEmployees} employees
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-sm">Attendance System</p>
                  <p className="text-xs text-gray-600">
                    {stats.thisMonthAttendance}% this month
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-sm">Leave Management</p>
                  <p className="text-xs text-gray-600">
                    Active and running
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Employee Dashboard Component
function EmployeeDashboard({ stats, recentActivities, user, navigate }: EmployeeDashboardProps) {
  const quickActions = [
    {
      title: "My Profile",
      description: "View and update your personal information",
      icon: "👤",
      path: "/my-profile",
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Apply Leave",
      description: "Submit new leave requests",
      icon: "📋",
      path: "/my-leave-requests",
      color: "from-green-500 to-green-600",
    },
    {
      title: "Salary Slips",
      description: "View and download your salary slips",
      icon: "💰",
      path: "/salary-history",
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "Attendance",
      description: "Check your attendance records",
      icon: "📅",
      path: "/attendance",
      color: "from-orange-500 to-orange-600",
    },
  ];

  // Format birthday date
  const formatBirthday = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (e) {
      return "Invalid date";
    }
  };

  // Calculate years of service
  const calculateServiceYears = (): number => {
    if (!user?.joiningDate) return 0;
    try {
      const joiningDate = new Date(user.joiningDate);
      const today = new Date();
      const years = today.getFullYear() - joiningDate.getFullYear();
      const monthDiff = today.getMonth() - joiningDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < joiningDate.getDate())) {
        return years - 1;
      }
      return years;
    } catch (e) {
      return 0;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section for Employee */}
      <div className="bg-linear-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-blue-100">
          {user?.department || 'Employee'} • {user?.designation || 'Staff'}
        </p>
      </div>

      {/* Employee Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-linear-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Leaves Remaining</p>
                <p className="text-2xl font-bold text-blue-900">
                  {user?.leavesRemaining || 0}
                </p>
                <div className="text-xs text-blue-700 mt-1 space-y-1">
                  <div>Casual: {user?.casualLeavesUsed || 0}/{user?.casualLeavesTotal || 4}</div>
                  <div>Sick: {user?.sickLeavesUsed || 0}/{user?.sickLeavesTotal || 2}</div>
                </div>
              </div>
              <div className="text-3xl">🍃</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Monthly Salary</p>
                <p className="text-2xl font-bold text-green-900">
                  ₹{user?.baseSalary?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-green-700 mt-1">Base salary</p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Attendance</p>
                <p className="text-2xl font-bold text-purple-900">{stats.thisMonthAttendance}%</p>
                <p className="text-xs text-purple-700 mt-1">This month</p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Service Years</p>
                <p className="text-2xl font-bold text-orange-900">
                  {calculateServiceYears()}
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  {user?.joiningDate ? `Since ${new Date(user.joiningDate).getFullYear()}` : 'Not specified'}
                </p>
              </div>
              <div className="text-3xl">⭐</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions for Employee */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => navigate(action.path)}
                className={`p-4 rounded-xl bg-linear-to-r ${action.color} text-white text-left transition-transform hover:scale-105 shadow-md`}
              >
                <div className="text-2xl mb-2">{action.icon}</div>
                <h3 className="font-semibold text-sm mb-1">{action.title}</h3>
                <p className="text-white text-opacity-90 text-xs">{action.description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Salary Slips */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Salary Slips</CardTitle>
          <Button variant="outline" size="sm" onClick={() => navigate('/salary-history')}>
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start justify-between p-3 rounded-lg bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-600">{activity.month}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-green-600">
                      ₹{activity.netSalary?.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">📄</div>
                <p>No salary slips yet</p>
                <p className="text-sm mt-1">Your salary slips will appear here once generated</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Important Reminders & Personal Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Important Reminders */}
        <Card>
          <CardHeader>
            <CardTitle>Important Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <div className="text-yellow-600">📅</div>
                <div>
                  <p className="font-medium text-sm">Submit Timesheet</p>
                  <p className="text-xs text-gray-600">Due by end of month</p>
                </div>
              </div>
              
              {user?.date_of_birth && (
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="text-blue-600">🎂</div>
                  <div>
                    <p className="font-medium text-sm">Your Birthday</p>
                    <p className="text-xs text-gray-600">
                      {formatBirthday(user.date_of_birth)}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="text-green-600">💼</div>
                <div>
                  <p className="font-medium text-sm">Performance Review</p>
                  <p className="text-xs text-gray-600">Schedule with your manager</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Your Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Employee ID</span>
                <span className="font-medium">{user?.employeeId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Department</span>
                <Badge variant="outline" className="capitalize">
                  {user?.department}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Designation</span>
                <span className="font-medium">{user?.designation || 'Not specified'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">PF Status</span>
                <Badge variant={user?.pfApplicable ? "default" : "secondary"}>
                  {user?.pfApplicable ? "Applicable" : "Not Applicable"}
                </Badge>
              </div>
              <div className="pt-3 border-t">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/my-profile')}
                >
                  View Full Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// This needs to be defined outside but accessible to both components
function formatBirthdayDisplay(birthday: Birthday): string {
  const birthDate = new Date(birthday.date);
  const today = new Date();
  const nextBirthday = new Date(
    today.getFullYear(),
    birthDate.getMonth(),
    birthDate.getDate()
  );

  if (nextBirthday.getDate() === today.getDate() && 
      nextBirthday.getMonth() === today.getMonth()) {
    return "🎉 Today!";
  } else if (birthday.daysUntil === 1) {
    return "🎂 Tomorrow";
  } else {
    return `🎂 In ${birthday.daysUntil} days`;
  }
}