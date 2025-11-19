import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function generateSalaryPDF(slip: any) {
  const doc = new jsPDF();
  
  // Colors as tuples to satisfy TypeScript
  const primaryColor: [number, number, number] = [41, 128, 185]; // Blue
  const darkColor: [number, number, number] = [44, 62, 80];      // Dark
  const lightGray: [number, number, number] = [248, 249, 250];   // Light gray
  const white: [number, number, number] = [255, 255, 255];       // White

  // Company Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 20, 'F');
  
  doc.setTextColor(...white);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('JHEX CONSULTING LLP', 105, 12, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('SALARY SLIP', 105, 17, { align: 'center' });

  // Employee and Period Information
  doc.setTextColor(...darkColor);
  doc.setFontSize(9);
  
  // Left side - Employee info
  doc.text(`Employee: ${slip.employeeName}`, 14, 30);
  doc.text(`ID: ${slip.employeeId}`, 14, 35);
  doc.text(`Department: ${slip.department}`, 14, 40);
  
  // Right side - Period info
  doc.text(`Period: ${slip.yearMonth}`, 160, 30, { align: 'right' });
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 160, 35, { align: 'right' });
  doc.text(`Designation: ${slip.role}`, 160, 40, { align: 'right' });

  // Main Salary Table - Compact layout
  const salaryData = [
    ['EARNINGS', 'AMOUNT (₹)', 'DEDUCTIONS', 'AMOUNT (₹)'],
    [
      'Basic Salary', 
      (slip.basic || 0).toLocaleString(),
      'Provident Fund', 
      (slip.pfAmount || 0).toLocaleString()
    ],
    [
      'House Rent Allowance', 
      (slip.hra || 0).toLocaleString(),
      'Professional Tax', 
      (slip.professionalTax || 0).toLocaleString()
    ],
    [
      'Fuel Allowance', 
      (slip.fuelAllowance || 0).toLocaleString(),
      'Absent Deduction', 
      (slip.absentDeduction || 0).toLocaleString()
    ],
    [
      'Performance Bonus', 
      (slip.bonus || 0).toLocaleString(),
      '', 
      ''
    ]
  ];

  autoTable(doc, {
    startY: 48,
    body: salaryData,
    theme: 'grid',
    headStyles: {
      fillColor: darkColor,
      textColor: white,
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3,
      minCellHeight: 8
    },
    styles: {
      lineWidth: 0.1,
      lineColor: [200, 200, 200]
    },
    columnStyles: {
      0: { cellWidth: 45, fontStyle: 'bold' },
      1: { cellWidth: 30, halign: 'right' },
      2: { cellWidth: 45, fontStyle: 'bold' },
      3: { cellWidth: 30, halign: 'right' }
    },
    margin: { left: 14, right: 14 }
  });

  const tableY = (doc as any).lastAutoTable.finalY + 5;

  // Summary Section - Compact
  const totalEarnings = (slip.basic || 0) + (slip.hra || 0) + (slip.fuelAllowance || 0) + (slip.bonus || 0);
  const totalDeductions = (slip.pfAmount || 0) + (slip.professionalTax || 0) + (slip.absentDeduction || 0);

  const summaryData = [
    ['TOTAL EARNINGS', `₹${totalEarnings.toLocaleString()}`],
    ['TOTAL DEDUCTIONS', `₹${totalDeductions.toLocaleString()}`],
    ['NET SALARY', `₹${(slip.netSalary || 0).toLocaleString()}`]
  ];

  autoTable(doc, {
    startY: tableY,
    body: summaryData,
    theme: 'grid',
    bodyStyles: {
      fontSize: 9,
      cellPadding: 4,
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 70, fillColor: lightGray },
      1: { cellWidth: 50, halign: 'right', fillColor: lightGray }
    },
    styles: {
      lineWidth: 0.1,
      lineColor: [200, 200, 200]
    },
    margin: { left: 14, right: 14 }
  });

  const summaryY = (doc as any).lastAutoTable.finalY + 8;

  // Leave Information - Compact horizontal layout
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);
  doc.text('LEAVE INFORMATION', 14, summaryY);

  const leaveData = [
    ['Paid Leaves', slip.paidLeaveUsed || 0],
    ['LOP Days', slip.lopDays || 0],
    ['Casual Leaves', slip.casualLeavesConsumed || 0],
    ['Sick Leaves', slip.sickLeavesConsumed || 0],
    ['Leaves Balance', slip.leavesRemaining || 0]
  ];

  // Create leave table manually for better control
  const leaveTableY = summaryY + 4;
  const colWidth = 36;
  
  leaveData.forEach(([label, value], index) => {
    const xPos = 14 + (index * colWidth);
    
    // Label
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(label, xPos, leaveTableY);
    
    // Value
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(value.toString(), xPos, leaveTableY + 4);
  });

  // Add a simple line separator
  doc.setDrawColor(200, 200, 200);
  doc.line(14, leaveTableY - 2, 196, leaveTableY - 2);

  const leaveY = leaveTableY + 10;

  // Additional Details
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  
  if (slip.absentDeduction > 0) {
    doc.text(`Note: ${slip.lopDays || 0} LOP days deducted @ ₹${(slip.perDaySalary || 0).toLocaleString()}/day`, 14, leaveY);
  }
  
  // Footer
  doc.text('This is a computer-generated document. No signature required.', 105, leaveY + 8, { align: 'center' });
  doc.setFontSize(6);
  doc.text('Confidential - JHEX Consulting LLP', 105, leaveY + 12, { align: 'center' });

  // Save PDF
  doc.save(`Salary_${slip.employeeId}_${slip.yearMonth}.pdf`);
}