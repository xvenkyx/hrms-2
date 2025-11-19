import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { fetchEmployees } from "@/api/employees";
import { fetchSalaryHistory } from "@/api/salaryHistory";
import { fetchAttendance } from "@/api/attendance";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    pendingSlips: 0,
    thisMonthAttendance: 0,
    totalBonus: 0,
    totalProcessedSlips: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [employees, salaryHistory, attendance] = await Promise.all([
        fetchEmployees(),
        fetchSalaryHistory({}),
        fetchAttendance(),
      ]);

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
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
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

  // Quick actions
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
      icon: "🧾",
      path: "/generate-slip",
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "Salary History",
      description: "View past salary records",
      icon: "📈",
      path: "/salary-history",
      color: "from-orange-500 to-orange-600",
    },
  ];

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

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-linear-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Welcome to JHEX Payroll
        </h1>
        <p className="text-blue-100">
          {stats.totalEmployees} employees • {stats.totalProcessedSlips} slips
          processed this month
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-linear-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">
                  Total Employees
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {stats.totalEmployees}
                </p>
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
                <p className="text-sm font-medium text-green-600">
                  Pending Slips
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {stats.pendingSlips}
                </p>
                <p className="text-xs text-green-700 mt-1">For this month</p>
              </div>
              <div className="text-3xl">⏳</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-linear-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">
                  Attendance
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  {stats.thisMonthAttendance}%
                </p>
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
                <p className="text-sm font-medium text-orange-600">
                  Total Bonus
                </p>
                <p className="text-2xl font-bold text-orange-900">
                  ₹{stats.totalBonus.toLocaleString()}
                </p>
                <p className="text-xs text-orange-700 mt-1">All time</p>
              </div>
              <div className="text-3xl">⭐</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
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
                  <p className="text-white text-opacity-90 text-xs">
                    {action.description}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Button variant="outline" size="sm" onClick={loadDashboardData}>
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
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
