import jsPDF from "jspdf";

export function generateSalaryPDF(slip: any) {
  const doc = new jsPDF();

  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  const format = (amount: number) =>
    (amount || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // OUTER BORDER
  doc.setLineWidth(0.7);
  doc.rect(8, 8, W - 16, H - 16);

  // HEADER
  doc.setFontSize(15).setFont("helvetica", "bold");
  doc.text("JHEX CONSULTING LLP", W / 2, 22, { align: "center" });

  doc.setFontSize(10).setFont("helvetica", "normal");
  doc.text("SALARY SLIP", W / 2, 28, { align: "center" });

  doc.setLineWidth(0.4);
  doc.line(12, 32, W - 12, 32);

  // EMPLOYEE INFO + DAYS INFO
  doc.setFontSize(9);
  doc.text(`Employee: ${slip.employeeName}`, 12, 40);
  doc.text(`ID: ${slip.employeeId}`, 12, 45);
  doc.text(`Department: ${slip.department}`, 12, 50);

  doc.text(`Period: ${slip.yearMonth}`, W - 12, 40, { align: "right" });
  doc.text(`Designation: ${slip.role}`, W - 12, 45, { align: "right" });
  doc.text(
    `Days: ${slip.totalDays || 0} | Absent: ${slip.absent || 0}`,
    W - 12,
    50,
    { align: "right" }
  );

  doc.line(12, 54, W - 12, 54);

  // EARNINGS & DEDUCTIONS TITLES
  doc.setFont("helvetica", "bold");
  doc.text("EARNINGS", 12, 62);
  doc.text("DEDUCTIONS", W / 2 + 4, 62);

  doc.setFont("helvetica", "normal");
  const row = (y: number, leftTitle: string, leftVal: any, rightTitle?: string, rightVal?: any) => {
    doc.text(leftTitle, 12, y);
    doc.text(`₹${format(leftVal)}`, 64, y, { align: "right" });

    if (rightTitle) {
      doc.text(rightTitle, W / 2 + 4, y);
      doc.text(`₹${format(rightVal)}`, W - 12, y, { align: "right" });
    }
  };

  let y = 68;
  row(y, "Basic Salary:", slip.basic, "Provident Fund:", slip.pfAmount);
  row((y += 6), "HRA:", slip.hra, "Professional Tax:", slip.professionalTax);
  row((y += 6), "Fuel Allowance:", slip.fuelAllowance);

  if (slip.bonus > 0) {
    row((y += 6), "Performance Bonus:", slip.bonus);
  }

  const totalE =
    (slip.basic || 0) +
    (slip.hra || 0) +
    (slip.fuelAllowance || 0) +
    (slip.bonus || 0);

  const totalD =
    (slip.pfAmount || 0) +
    (slip.professionalTax || 0);

  // TOTALS SECTION
  doc.setLineWidth(0.3);
  doc.line(12, y + 8, W - 12, y + 8);

  doc.setFont("helvetica", "bold");
  doc.text("Total Earnings:", 12, y + 14);
  doc.text(`₹${format(totalE)}`, 64, y + 14, { align: "right" });

  doc.text("Total Deductions:", W / 2 + 4, y + 14);
  doc.text(`₹${format(totalD)}`, W - 12, y + 14, { align: "right" });

  // NET SALARY
  doc.setLineWidth(0.4);
  doc.line(12, y + 18, W - 12, y + 18);
  doc.line(12, y + 19, W - 12, y + 19);

  doc.setFontSize(11);
  doc.text("NET SALARY:", 12, y + 28);
  doc.text(`₹${format(slip.netSalary)}`, W - 12, y + 28, { align: "right" });

  // FOOTER (slightly above bottom)
  doc.setFontSize(7);
  doc.text(
    "This is a computer-generated document and does not require signature.",
    W / 2,
    H - 14,
    { align: "center" }
  );

  // SAVE
  doc.save(`Salary_${slip.employeeId}_${slip.yearMonth}.pdf`);
}
