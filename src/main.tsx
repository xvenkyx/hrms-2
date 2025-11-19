import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Routes, Route } from "react-router-dom"

import MainLayout from "@/components/layout/MainLayout"

import Dashboard from "@/pages/Dashboard"
import Employees from "@/pages/Employees"
import Attendance from "@/pages/Attendance"
import Bonus from "@/pages/Bonus"
import Settings from "@/pages/Settings"
import GenerateSlip from "@/pages/GenerateSlip"

import "./index.css"
import SalaryHistory from "./pages/SalaryHistory"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
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
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
