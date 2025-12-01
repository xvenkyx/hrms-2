import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { getMyProfile } from "@/api/employees";

export default function MyProfile() {
  const { user, isAuthenticated } = useAuth();
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (isAuthenticated) {
        try {
          setLoading(true);
          const employee = await getMyProfile();
          
          if (employee) {
            setEmployeeData(employee);
          } else {
            setError("Employee profile not found");
          }
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchEmployeeData();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6 text-center">
          <p className="text-lg text-gray-600">Please sign in to view your profile.</p>
          <Button 
            className="mt-4 bg-blue-600 hover:bg-blue-700"
            onClick={() => window.location.href = '/login'}
          >
            Go to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6 text-center">
          <p className="text-lg text-gray-600">Loading your profile...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !employeeData) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6 text-center">
          <p className="text-lg text-gray-600">
            {error || "Profile not found. Please complete your registration."}
          </p>
          <Button 
            className="mt-4 bg-blue-600 hover:bg-blue-700"
            onClick={() => window.location.href = '/register'}
          >
            Complete Registration
          </Button>
        </CardContent>
      </Card>
    );
  }

  const departments = [
    { id: 1, name: 'HR' },
    { id: 2, name: 'Sales' },
    { id: 3, name: 'Marketing' },
    { id: 4, name: 'Technical' },
    { id: 5, name: 'Admin' },
    { id: 6, name: 'Utility' }
  ];

  const getDepartmentName = (deptId: number) => {
    return departments.find(dept => dept.id === deptId)?.name || 'Unknown';
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Calculate employment duration
  const getEmploymentDuration = () => {
    if (!employeeData.createdAt) return 'Not available';
    try {
      const startDate = new Date(employeeData.createdAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const years = Math.floor(diffDays / 365);
      const months = Math.floor((diffDays % 365) / 30);
      
      if (years > 0) {
        return `${years} year${years > 1 ? 's' : ''} ${months > 0 ? `${months} month${months > 1 ? 's' : ''}` : ''}`;
      }
      return `${months} month${months > 1 ? 's' : ''}`;
    } catch {
      return 'Not available';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            My Profile
          </h1>
          <p className="text-gray-600 mt-1">
            Employee ID: {employeeData.employeeId}
          </p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => window.location.href = '/edit-profile'}
        >
          Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Personal Information Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              👤 Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 font-medium">First Name</p>
                <p className="font-semibold text-gray-900 mt-1">
                  {employeeData.firstName || 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Last Name</p>
                <p className="font-semibold text-gray-900 mt-1">
                  {employeeData.lastName || 'Not specified'}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 font-medium">Company Email</p>
                <p className="font-semibold text-gray-900 mt-1">
                  {employeeData.company_email}
                </p>
              </div>
              
              {employeeData.personal_email && (
                <div>
                  <p className="text-sm text-gray-500 font-medium">Personal Email</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {employeeData.personal_email}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employeeData.contact_number && (
                <div>
                  <p className="text-sm text-gray-500 font-medium">Contact Number</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {employeeData.contact_number}
                  </p>
                </div>
              )}
              
              {employeeData.date_of_birth && (
                <div>
                  <p className="text-sm text-gray-500 font-medium">Date of Birth</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {formatDate(employeeData.date_of_birth)}
                  </p>
                </div>
              )}
            </div>

            {employeeData.gender && (
              <div>
                <p className="text-sm text-gray-500 font-medium">Gender</p>
                <p className="font-semibold text-gray-900 mt-1">
                  {employeeData.gender}
                </p>
              </div>
            )}

            {employeeData.address && (
              <div>
                <p className="text-sm text-gray-500 font-medium">Address</p>
                <p className="font-semibold text-gray-900 mt-1 whitespace-pre-line">
                  {employeeData.address}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Employment Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              💼 Employment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {employeeData.designation && (
              <div>
                <p className="text-sm text-gray-500 font-medium">Designation</p>
                <p className="font-semibold text-gray-900 mt-1">
                  {employeeData.designation}
                </p>
              </div>
            )}
            
            {employeeData.department && (
              <div>
                <p className="text-sm text-gray-500 font-medium">Department</p>
                <Badge variant="secondary" className="mt-1">
                  {employeeData.department}
                </Badge>
              </div>
            )}
            
            <div>
              <p className="text-sm text-gray-500 font-medium">Employee Since</p>
              <p className="font-semibold text-gray-900 mt-1">
                {formatDate(employeeData.createdAt)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {getEmploymentDuration()}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 font-medium">Last Updated</p>
              <p className="font-semibold text-gray-900 mt-1">
                {employeeData.updatedAt ? formatDate(employeeData.updatedAt) : 'Never'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bank Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              🏦 Bank Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {employeeData.account_number ? (
              <div>
                <p className="text-sm text-gray-500 font-medium">Account Number</p>
                <p className="font-semibold text-gray-900 mt-1 font-mono">
                  {employeeData.account_number}
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No bank account information provided</p>
            )}
            
            {employeeData.ifsc_code && (
              <div>
                <p className="text-sm text-gray-500 font-medium">IFSC Code</p>
                <p className="font-semibold text-gray-900 mt-1 font-mono">
                  {employeeData.ifsc_code}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Government Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              📄 Government Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {employeeData.pan_number ? (
              <div>
                <p className="text-sm text-gray-500 font-medium">PAN Number</p>
                <p className="font-semibold text-gray-900 mt-1 font-mono">
                  {employeeData.pan_number}
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No PAN number provided</p>
            )}
            
            {employeeData.uan_number ? (
              <div>
                <p className="text-sm text-gray-500 font-medium">UAN Number</p>
                <p className="font-semibold text-gray-900 mt-1 font-mono">
                  {employeeData.uan_number}
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No UAN number provided</p>
            )}
          </CardContent>
        </Card>

        {/* System Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              🔐 System Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 font-medium">Role</p>
              <Badge variant="default" className="mt-1">
                {employeeData.role || 'employee'}
              </Badge>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 font-medium">Profile Status</p>
              <Badge variant="default" className="mt-1 bg-green-100 text-green-800">
                Complete
              </Badge>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 font-medium">Registration Date</p>
              <p className="font-semibold text-gray-900 mt-1">
                {formatDate(employeeData.createdAt)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/edit-profile'}
            >
              Update Personal Info
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/bank-details'}
            >
              Update Bank Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}