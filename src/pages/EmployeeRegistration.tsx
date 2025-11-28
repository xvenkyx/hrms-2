import { useState } from "react";
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
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";
import { createEmployee } from "@/api/employees";

export default function EmployeeRegistration() {
  const auth = useAuth();
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

  const departments = [
    "HR",
    "Sales",
    "Marketing",
    "Engineering",
    "Admin",
    "Utility",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.department) {
      alert("Please fill in all required fields: First Name, Last Name, and Department");
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert department name to department_id
      const departmentMap: { [key: string]: number } = {
        HR: 1,
        Sales: 2,
        Marketing: 3,
        Engineering: 4,
        Admin: 5,
        Utility: 6,
      };

      const employeeData = {
        cognito_user_id: auth.user?.profile.sub,
        company_email: auth.user?.profile.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        personal_email: formData.personalEmail || "",
        contact_number: formData.contactNumber || "",
        date_of_birth: formData.dateOfBirth || "",
        gender: formData.gender || "",
        address: formData.address || "",
        designation: formData.designation || "",
        department_id: departmentMap[formData.department],
        account_number: formData.accountNumber || "",
        ifsc_code: formData.ifscCode || "",
        pan_number: formData.panNumber || "",
        uan_number: formData.uanNumber || "",
      };

      console.log("📤 Sending employee data:", employeeData);
      console.log("🔑 Cognito User ID:", auth.user?.profile.sub);
      console.log("📧 Company Email:", auth.user?.profile.email);
      console.log("🏢 Department selected:", formData.department);
      console.log("🔢 Department ID:", departmentMap[formData.department]);

      const result = await createEmployee(employeeData);
      console.log("✅ Employee created:", result);

      alert("Registration completed successfully!");
      navigate("/my-profile");
    } catch (error: any) {
      console.error("❌ Registration error:", error);
      alert(`Error saving registration: ${error.message}`);
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

  if (!auth.isAuthenticated) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6 text-center">
          <p className="text-lg text-gray-600">
            Please sign in to complete your registration.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Complete Your Profile
        </h1>
        <p className="text-gray-600 mt-2">
          Welcome to JHEX! Please complete your employee profile.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Registration Form</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    required
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
                    placeholder="your.personal@email.com"
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => handleChange("gender", value)}
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
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Full address including city, state, and PIN code"
                />
              </div>
            </div>

            {/* Employment Details */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold">Employment Details</h3>

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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => handleChange("department", value)}
                    required
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

            {/* Bank Details */}
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold">
                Bank & Government Details
              </h3>

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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ifscCode">IFSC Code</Label>
                  <Input
                    id="ifscCode"
                    value={formData.ifscCode}
                    onChange={(e) => handleChange("ifscCode", e.target.value)}
                    placeholder="SBIN0001234"
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="uanNumber">UAN Number</Label>
                  <Input
                    id="uanNumber"
                    value={formData.uanNumber}
                    onChange={(e) => handleChange("uanNumber", e.target.value)}
                    placeholder="123456789012"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Complete Registration"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}