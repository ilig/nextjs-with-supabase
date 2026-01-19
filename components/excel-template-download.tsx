"use client";

import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function ExcelTemplateDownload() {
  const downloadTemplate = () => {
    // Create sample data for the Excel template
    const templateData = [
      {
        "שם הילד/ה": "דוגמה: יוסי כהן",
        "שם הורה 1": "דוגמה: דוד כהן",
        "טלפון הורה 1": "050-1234567",
        "שם הורה 2": "דוגמה: שרה כהן",
        "טלפון הורה 2": "050-7654321",
        "כתובת": "רחוב הדקל 5, תל אביב",
      },
      {
        "שם הילד/ה": "",
        "שם הורה 1": "",
        "טלפון הורה 1": "",
        "שם הורה 2": "",
        "טלפון הורה 2": "",
        "כתובת": "",
      },
    ];

    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Convert data to worksheet
    const ws = XLSX.utils.json_to_sheet(templateData);

    // Set column widths
    ws["!cols"] = [
      { wch: 20 }, // שם הילד/ה
      { wch: 20 }, // שם הורה 1
      { wch: 15 }, // טלפון הורה 1
      { wch: 20 }, // שם הורה 2
      { wch: 15 }, // טלפון הורה 2
      { wch: 30 }, // כתובת
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "ילדים והורים");

    // Create instructions sheet
    const instructionsData = [
      { "": "הוראות שימוש:" },
      { "": "" },
      { "": "1. מלא את הפרטים בגיליון 'ילדים והורים'" },
      { "": "2. שדות חובה: שם הילד/ה, שם הורה 1, טלפון הורה 1" },
      { "": "3. שדות אופציונליים: שם הורה 2, טלפון הורה 2, כתובת" },
      { "": "4. אל תשנה את שמות העמודות" },
      { "": "5. שמור את הקובץ והעלה אותו למערכת" },
      { "": "" },
      { "": "דוגמה למילוי:" },
      { "": "שם הילד/ה: יוסי כהן" },
      { "": "שם הורה 1: דוד כהן" },
      { "": "טלפון הורה 1: 050-1234567" },
    ];

    const wsInstructions = XLSX.utils.json_to_sheet(instructionsData, {
      skipHeader: true,
    });
    wsInstructions["!cols"] = [{ wch: 50 }];
    XLSX.utils.book_append_sheet(wb, wsInstructions, "הוראות");

    // Generate file and trigger download
    XLSX.writeFile(wb, "תבנית_ילדים_והורים.xlsx");
  };

  return (
    <Button onClick={downloadTemplate} variant="link" className="mt-2">
      <Download className="ml-2 h-4 w-4" />
      הורדת תבנית אקסל
    </Button>
  );
}
