import html2pdf from "html2pdf.js";

export function downloadSalaryPDF(slip: any) {
  const element = document.getElementById("salary-slip-template");

  if (!element) {
    alert("Salary template not found!");
    return;
  }

  const opt = {
    margin: 0,
    filename: `Salary_${slip.employeeId}_${slip.yearMonth}.pdf`,
    image: { type: "jpeg", quality: 1 },
    html2canvas: { scale: 4, useCORS: true },
    jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
  };

  html2pdf().set(opt).from(element).save();
}
