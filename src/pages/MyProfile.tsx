import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { getMyProfile } from "@/api/employees";
import { useNavigate } from "react-router-dom";

export default function MyProfile() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const fetchEmployeeData = async () => {
      if (isAuthenticated) {
        try {
          console.log("🔄 Fetching profile data...");
          setLoading(true);
          setError(null);
          
          const employee = await getMyProfile();
          console.log("📥 Profile data received:", employee);
          
          if (mounted) {
            if (employee) {
              setEmployeeData(employee);
            } else {
              setError("Profile not found. Please complete your registration.");
            }
          }
        } catch (err: any) {
          if (mounted) {
            console.error("❌ Error fetching profile:", err);
            setError(err.message || "Failed to load profile");
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      } else {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchEmployeeData();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6 text-center">
          <p className="text-lg text-gray-600">Please sign in to view your profile.</p>
          <Button 
            className="mt-4 bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate('/login')}
          >
            Go to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error || !employeeData) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6 text-center">
          <p className="text-lg text-gray-600">
            {error || "Profile not found"}
          </p>
          <div className="mt-6 space-y-3">
            <p className="text-gray-500">
              Unable to load your profile.
            </p>
            <div className="space-y-3">
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => navigate('/register')}
              >
                Complete Registration
              </Button>
              <Button 
                variant="outline"
                className="ml-3"
                onClick={() => window.location.reload()}
              >
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    const requiredFields = [
      'firstName', 'lastName', 'department', 'designation',
      'contact_number', 'date_of_birth', 'address'
    ];
    
    const filledFields = requiredFields.filter(field => 
      employeeData[field] && employeeData[field].toString().trim() !== ''
    );
    
    return Math.round((filledFields.length / requiredFields.length) * 100);
  };

  const profileCompletion = calculateProfileCompletion();
  
  // Determine profile status
  const getProfileStatus = () => {
    if (profileCompletion === 100) return 'Complete';
    if (profileCompletion >= 70) return 'Mostly Complete';
    if (profileCompletion >= 40) return 'Partially Complete';
    return 'Incomplete';
  };

  const getStatusBadgeColor = () => {
    switch (getProfileStatus()) {
      case 'Complete': return 'bg-green-100 text-green-800';
      case 'Mostly Complete': return 'bg-blue-100 text-blue-800';
      case 'Partially Complete': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-red-100 text-red-800';
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString || dateString === '') return 'Not specified';
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
            Employee ID: {employeeData.employeeId || employeeData.id || 'N/A'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={() => navigate('/edit-profile')}
          >
            Edit Profile
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Profile Completion Status */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Profile Completion</h3>
              <p className="text-sm text-gray-500 mt-1">
                Complete your profile to access all features
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${profileCompletion}%` }}
                ></div>
              </div>
              <Badge className={getStatusBadgeColor()}>
                {getProfileStatus()} ({profileCompletion}%)
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

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
                  {employeeData.company_email || employeeData.email || 'Not specified'}
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
                {formatDate(employeeData.createdAt || employeeData.startDate)}
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
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">No bank account information provided</p>
                <Button 
                  variant="link" 
                  className="mt-2"
                  onClick={() => navigate('/edit-profile')}
                >
                  Add Bank Details
                </Button>
              </div>
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
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">No PAN number provided</p>
                <Button 
                  variant="link" 
                  className="mt-2"
                  onClick={() => navigate('/edit-profile')}
                >
                  Add PAN
                </Button>
              </div>
            )}
            
            {employeeData.uan_number ? (
              <div>
                <p className="text-sm text-gray-500 font-medium">UAN Number</p>
                <p className="font-semibold text-gray-900 mt-1 font-mono">
                  {employeeData.uan_number}
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">No UAN number provided</p>
                <Button 
                  variant="link" 
                  className="mt-2"
                  onClick={() => navigate('/edit-profile')}
                >
                  Add UAN
                </Button>
              </div>
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
              <Badge className={`mt-1 ${getStatusBadgeColor()}`}>
                {getProfileStatus()}
              </Badge>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 font-medium">Registration Date</p>
              <p className="font-semibold text-gray-900 mt-1">
                {formatDate(employeeData.createdAt || employeeData.registrationDate)}
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
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate('/edit-profile')}
            >
              Update Profile
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/change-password')}
            >
              Change Password
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Refresh Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}