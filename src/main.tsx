import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "react-oidc-context"

import MainLayout from "@/components/layout/MainLayout"
import Dashboard from "@/pages/Dashboard"
import Employees from "@/pages/Employees"
import Attendance from "@/pages/Attendance"
import Bonus from "@/pages/Bonus"
import Settings from "@/pages/Settings"
import GenerateSlip from "@/pages/GenerateSlip"
import SalaryHistory from "./pages/SalaryHistory"
import EmployeeRegistration from "./pages/EmployeeRegistration" // ADD THIS

import "./index.css"
import MyProfile from "./pages/MyProfile"

const cognitoAuthConfig = {
  authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Jx03mebux",
  client_id: "1kmj8u7md1c1nrkhm2u6ues9q7",
  redirect_uri: "http://localhost:5173",
  response_type: "code",
  scope: "email openid profile",
  automaticSilentRenew: true,
  loadUserInfo: true,
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="employees" element={<Employees />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="bonus" element={<Bonus />} />
            <Route path="settings" element={<Settings />} />
            <Route path="generate-slip" element={<GenerateSlip />} />
            <Route path="salary-history" element={<SalaryHistory />} />
            <Route path="register" element={<EmployeeRegistration />} /> {/* ADD THIS */}
            <Route path="my-profile" element={<MyProfile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
)