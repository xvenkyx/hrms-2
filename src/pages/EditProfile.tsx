import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getMyProfile, updateEmployee } from "@/api/employees";

export default function EditProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    personalEmail: "",
    contactNumber: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    designation: "",
    department: "",
    accountNumber: "",
    ifscCode: "",
    panNumber: "",
    uanNumber: "",
  });
  
  const [loading, setLoading] = useState(true);

  const departments = [
    "HR",
    "Sales",
    "Marketing",
    "Technical",
    "Admin",
    "Utility",
  ];

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const employeeData = await getMyProfile();
        
        if (employeeData) {
          setFormData({
            firstName: employeeData.firstName || "",
            lastName: employeeData.lastName || "",
            personalEmail: employeeData.personal_email || "",
            contactNumber: employeeData.contact_number || "",
            dateOfBirth: employeeData.date_of_birth || "",
            gender: employeeData.gender || "",
            address: employeeData.address || "",
            designation: employeeData.designation || "",
            department: employeeData.department || "",
            accountNumber: employeeData.account_number || "",
            ifscCode: employeeData.ifsc_code || "",
            panNumber: employeeData.pan_number || "",
            uanNumber: employeeData.uan_number || "",
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.employeeId) {
      alert("No employee ID found. Please log in again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        personal_email: formData.personalEmail || "",
        contact_number: formData.contactNumber || "",
        date_of_birth: formData.dateOfBirth || "",
        gender: formData.gender || "",
        address: formData.address || "",
        designation: formData.designation || "",
        department: formData.department || "",
        account_number: formData.accountNumber || "",
        ifsc_code: formData.ifscCode || "",
        pan_number: formData.panNumber || "",
        uan_number: formData.uanNumber || "",
      };

      await updateEmployee(user.employeeId, updateData);
      
      alert("Profile updated successfully!");
      navigate('/my-profile');
      
    } catch (error: any) {
      console.error("❌ Update error:", error);
      alert(`Error updating profile: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Edit Profile
        </h1>
        <p className="text-gray-600 mt-2">
          Update your personal and professional information
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Edit Profile Information</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/my-profile')}
              className="text-sm"
            >
              Back to Profile
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Required fields marked with *
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    required
                    placeholder="John"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    required
                    placeholder="Doe"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="personalEmail">Personal Email</Label>
                  <Input
                    id="personalEmail"
                    type="email"
                    value={formData.personalEmail}
                    onChange={(e) =>
                      handleChange("personalEmail", e.target.value)
                    }
                    placeholder="john.doe@personal.com"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactNumber">Contact Number</Label>
                  <Input
                    id="contactNumber"
                    value={formData.contactNumber}
                    onChange={(e) =>
                      handleChange("contactNumber", e.target.value)
                    }
                    placeholder="+91 1234567890"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      handleChange("dateOfBirth", e.target.value)
                    }
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => handleChange("gender", value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                      <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e: { target: { value: string; }; }) => handleChange("address", e.target.value)}
                  placeholder="123 Street, City, State, PIN Code"
                  disabled={isSubmitting}
                  rows={3}
                />
              </div>
            </div>

            {/* Employment Details */}
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Employment Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    value={formData.designation}
                    onChange={(e) =>
                      handleChange("designation", e.target.value)
                    }
                    placeholder="e.g., Software Engineer, HR Manager"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => handleChange("department", value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Bank & Government Details */}
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Bank & Government Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Bank Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={formData.accountNumber}
                    onChange={(e) =>
                      handleChange("accountNumber", e.target.value)
                    }
                    placeholder="123456789012"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ifscCode">IFSC Code</Label>
                  <Input
                    id="ifscCode"
                    value={formData.ifscCode}
                    onChange={(e) => handleChange("ifscCode", e.target.value)}
                    placeholder="SBIN0001234"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="panNumber">PAN Number</Label>
                  <Input
                    id="panNumber"
                    value={formData.panNumber}
                    onChange={(e) => handleChange("panNumber", e.target.value)}
                    placeholder="ABCDE1234F"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="uanNumber">UAN Number</Label>
                  <Input
                    id="uanNumber"
                    value={formData.uanNumber}
                    onChange={(e) => handleChange("uanNumber", e.target.value)}
                    placeholder="123456789012"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t gap-4">
              <div className="text-sm text-gray-500">
                <p>Fields marked with * are required</p>
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/my-profile')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}