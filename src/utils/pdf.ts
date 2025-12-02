// utils/pdf.js - Updated to match your payslip format
import jsPDF from "jspdf";

export function generateSalaryPDF(slip: {
  totalDays: any;
  daysPresent: any;
  arrearDays: any;
  monthName: any;
  bankName: any;
  companyName?: string;
  companyAddress?: string;
  uanNumber: any;
  panNumber: any;
  accountNumber: any;
  ifscCode: any;
  employeeId: any;
  employeeName: any;
  yearMonth: any;
  department: any;
  designation: any;
  baseSalary?: number;
  grossSalary?: number;
  netSalary: any;
  basic: any;
  hra: any;
  fuelAllowance: any;
  pfAmount: any;
  pfApplicable?: boolean;
  professionalTax: any;
  absentDeduction: any;
  bonus: any;
  paidLeaveUsed?: number;
  lopDays: any;
  casualLeavesConsumed?: number;
  sickLeavesConsumed?: number;
  leavesRemaining?: number;
  daysInMonth: any;
  perDaySalary?: number;
  createdAt?: string;
  calculationNotes?: string | undefined;
  joiningDate?: any;
}) {
  const doc = new jsPDF();

  // Company Header
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("JHEX Consulting LLP", 105, 15, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    "FF-Block-A-103, Ganesh Meridian, Opp High Court, SG Highway, Ghatlodiya Ahmedabad – (380061)",
    105,
    22,
    { align: "center" }
  );

  // Title
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Pay slip for the month of ${slip.monthName || slip.yearMonth}`,
    105,
    32,
    { align: "center" }
  );

  // Employee Information - Left Side
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  let yPos = 45;

  doc.text(`EMP Code: ${slip.employeeId}`, 20, yPos);
  doc.text(`Name: ${slip.employeeName}`, 20, yPos + 6);
  doc.text(`DOJ: ${slip.joiningDate || "Not specified"}`, 20, yPos + 12);

  // Employee Information - Right Side
  doc.text(`Bank: ${slip.bankName || "State Bank of India"}`, 110, yPos);
  doc.text(`A/C No: ${slip.accountNumber || "Not specified"}`, 110, yPos + 6);
  doc.text(`IFSC Code: ${slip.ifscCode || "Not specified"}`, 110, yPos + 12);

  // Employee Information - Second Row Left
  doc.text(`Designation: ${slip.designation}`, 20, yPos + 20);
  doc.text(`UAN No: ${slip.uanNumber || "Not specified"}`, 20, yPos + 26);

  // Employee Information - Second Row Right
  doc.text(`Department: ${slip.department}`, 110, yPos + 20);
  doc.text(`PAN No: ${slip.panNumber || "Not specified"}`, 110, yPos + 26);

  // Salary Summary Box
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(
    `Total Salary: ₹${slip.netSalary?.toLocaleString("en-IN")}`,
    105,
    yPos + 40,
    { align: "center" }
  );

  // Attendance Summary
  yPos += 50;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const attendanceY = yPos;
  doc.text(
    `Total Days: ${slip.totalDays || slip.daysInMonth || 30}`,
    20,
    attendanceY
  );
  doc.text(`Arrear Days: ${slip.arrearDays || 0}`, 60, attendanceY);
  doc.text(`LWP/Absent: ${slip.lopDays || 0}.0`, 100, attendanceY);
  doc.text(
    `Days Present: ${
      slip.daysPresent || slip.daysInMonth - slip.lopDays || 30
    }`,
    140,
    attendanceY
  );

  // Earnings & Deductions Table
  yPos += 15;
  doc.setFont("helvetica", "bold");
  doc.text("Earning", 20, yPos);
  doc.text("Amount", 160, yPos, { align: "right" });

  // Line separator
  doc.line(20, yPos + 2, 190, yPos + 2);

  yPos += 10;
  doc.setFont("helvetica", "normal");

  // Earnings
  const earnings = [
    { label: "Basic", amount: slip.basic },
    { label: "HRA", amount: slip.hra },
    { label: "Fuel Allowance", amount: slip.fuelAllowance },
  ];

  earnings.forEach((earning) => {
    doc.text(earning.label, 20, yPos);
    doc.text(`₹${earning.amount?.toLocaleString("en-IN")}.00`, 160, yPos, {
      align: "right",
    });
    yPos += 6;
  });

  // Bonus if exists
  if (slip.bonus > 0) {
    doc.text(
      `Performance Incentive (${slip.monthName?.split(" ")[0] || "Month"})`,
      20,
      yPos
    );
    doc.text(`₹${slip.bonus?.toLocaleString("en-IN")}.00`, 160, yPos, {
      align: "right",
    });
    yPos += 6;
  }

  // Deductions
  const deductions = [
    { label: "PF", amount: -slip.pfAmount },
    { label: "PT", amount: -slip.professionalTax },
  ];

  if (slip.absentDeduction > 0) {
    deductions.push({
      label: "Absent Deduction",
      amount: -slip.absentDeduction,
    });
  }

  deductions.forEach((deduction) => {
    doc.text(deduction.label, 20, yPos);
    doc.text(
      `₹${Math.abs(deduction.amount)?.toLocaleString("en-IN")}.00`,
      160,
      yPos,
      { align: "right" }
    );
    yPos += 6;
  });

  // Total Earning line
  yPos += 4;
  doc.line(20, yPos, 190, yPos);
  yPos += 6;

  doc.setFont("helvetica", "bold");
  doc.text("Total Earning", 20, yPos);
  const totalEarning = slip.basic + slip.hra + slip.fuelAllowance + slip.bonus;
  doc.text(`₹${totalEarning?.toLocaleString("en-IN")}.00`, 160, yPos, {
    align: "right",
  });

  // Net Pay
  yPos += 15;
  doc.setFontSize(12);
  doc.text("Net Pay", 20, yPos);
  doc.text(`₹${slip.netSalary?.toLocaleString("en-IN")}.00`, 160, yPos, {
    align: "right",
  });

  // Amount in words
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const amountInWords = convertToWords(slip.netSalary);
  doc.text(`In words: ${amountInWords}`, 20, yPos);

  // Footer
  yPos += 15;
  doc.setFontSize(9);
  doc.text(
    "This is the system generated pay slip, Signature not required",
    105,
    yPos,
    { align: "center" }
  );

  // Save PDF
  const fileName = `Payslip for ${slip.employeeName} - ${
    slip.monthName || slip.yearMonth
  }.pdf`;
  doc.save(fileName);
}

// Helper function to convert number to words
function convertToWords(num: number) {
  const a = [
    "",
    "one ",
    "two ",
    "three ",
    "four ",
    "five ",
    "six ",
    "seven ",
    "eight ",
    "nine ",
    "ten ",
    "eleven ",
    "twelve ",
    "thirteen ",
    "fourteen ",
    "fifteen ",
    "sixteen ",
    "seventeen ",
    "eighteen ",
    "nineteen ",
  ];
  const b = [
    "",
    "",
    "twenty",
    "thirty",
    "forty",
    "fifty",
    "sixty",
    "seventy",
    "eighty",
    "ninety",
  ];

  if (num === 0) return "zero";

  let words = "";
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundred = Math.floor((num % 1000) / 100);
  const tens = num % 100;

  if (crore > 0) words += convertToWords(crore) + " crore ";
  if (lakh > 0) words += convertToWords(lakh) + " lakh ";
  if (thousand > 0) words += convertToWords(thousand) + " thousand ";
  if (hundred > 0) words += convertToWords(hundred) + " hundred ";

  if (tens > 0) {
    if (tens < 20) {
      words += a[tens];
    } else {
      words += b[Math.floor(tens / 10)];
      if (tens % 10 > 0) words += "-" + a[tens % 10];
    }
  }

  return words.trim().toUpperCase() + " ONLY";
}
