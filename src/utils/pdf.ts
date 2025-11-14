import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function generateSalaryPDF(slip: any) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text("Salary Slip", 14, 20);

  doc.setFontSize(12);
  doc.text(`Employee: ${slip.employeeId}`, 14, 30);
  doc.text(`Month: ${slip.yearMonth}`, 14, 36);

  // Table of salary details
  const rows = [
    ["Basic Salary", `₹ ${slip.basic}`],
    ["Allowance", `₹ ${slip.allowance}`],
    ["Gross Salary", `₹ ${slip.grossSalary}`],
    ["PF Deduction", `₹ ${slip.pfAmount}`],
    ["Professional Tax", `₹ ${slip.professionalTax}`],
    ["Absent Days", `${slip.absentDays}`],
    ["Absent Deduction", `₹ ${slip.absentDeduction}`],
    ["Bonus", `₹ ${slip.bonus}`],
    ["Net Salary", `₹ ${slip.netSalary}`],
  ];

  autoTable(doc, {
    startY: 45,
    head: [["Component", "Amount"]],
    body: rows,
  });

  doc.save(`SalarySlip_${slip.employeeId}_${slip.yearMonth}.pdf`);
}
