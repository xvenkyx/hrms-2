import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "@/context/AuthContext"

import MainLayout from "@/components/layout/MainLayout"
import Dashboard from "@/pages/Dashboard"
import Employees from "@/pages/Employees"
import Attendance from "@/pages/Attendance"
import Settings from "@/pages/Settings"
import GenerateSlip from "@/pages/GenerateSlip"
import SalaryHistory from "./pages/SalaryHistory"
import EmployeeRegistration from "./pages/EmployeeRegistration"
import MyProfile from "./pages/MyProfile"
import Login from "./pages/Login"
import LeaveRequests from "./pages/LeaveRequests"
import MyLeaveRequests from "./pages/MyLeaveRequests"
import EditProfile from "./pages/EditProfile" // NEW - ADD THIS IMPORT

import "./index.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="employees" element={<Employees />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="settings" element={<Settings />} />
            <Route path="generate-slip" element={<GenerateSlip />} />
            <Route path="salary-history" element={<SalaryHistory />} />
            <Route path="register" element={<EmployeeRegistration />} />
            <Route path="my-profile" element={<MyProfile />} />
            <Route path="leave-requests" element={<LeaveRequests />} />
            <Route path="my-leave-requests" element={<MyLeaveRequests />} />
            <Route path="edit-profile" element={<EditProfile />} /> {/* NEW - ADD THIS ROUTE */}
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
)