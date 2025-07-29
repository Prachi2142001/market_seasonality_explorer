"use client";
import React, { useEffect, useState } from "react";
import { Download, FileText, FileDown } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

interface MarketData {
  date?: Date;
  volatility?: number | string;
  liquidity?: number | string;
  performance?: number | string;
  [key: string]: any;
}

interface ExportControlsProps {
  data: MarketData[];
  elementId?: string;
  fileName?: string;
  className?: string;
}

const ExportControls: React.FC<ExportControlsProps> = ({
  data = [],
  elementId = "export-area",
  fileName = "market-data",
  className = "",
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const exportToCSV = () => {
    if (!data.length) return;

    const headers = ["Date", "Volatility", "Liquidity", "Performance"];
    const rows = data.map((item) => [
      item.date instanceof Date ? item.date.toISOString().split("T")[0] : "",
      String(item.volatility ?? ""),
      String(item.liquidity ?? ""),
      String(item.performance ?? ""),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToCanvas = async (): Promise<HTMLCanvasElement | null> => {
    const el = document.getElementById(elementId);
    if (!el) {
      console.error(`Element with ID '${elementId}' not found`);
      return null;
    }

    const clone = el.cloneNode(true) as HTMLElement;
    clone.style.position = "absolute";
    clone.style.left = "-9999px";
    clone.style.top = "0";
    clone.style.backgroundColor = "#ffffff"; // Force white background
    clone.style.color = "#000000"; // Force black text (if needed)
    document.body.appendChild(clone);

    try {
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          const style = document.createElement("style");
          style.textContent = `
            * {
              font-family: 'Inter', sans-serif !important;
              background-color: #ffffff !important;
              color: #000000 !important;
            }
          `;
          clonedDoc.head.appendChild(style);
        },
      });
      return canvas;
    } catch (error) {
      console.error("html2canvas error:", error);
      return null;
    } finally {
      document.body.removeChild(clone);
    }
  };

  const exportToPDF = async () => {
    const canvas = await exportToCanvas();
    if (!canvas) return;

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth() * 0.9;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    const x = (pdf.internal.pageSize.getWidth() - pdfWidth) / 2;
    const y = 10;

    pdf.addImage(imgData, "PNG", x, y, pdfWidth, pdfHeight);
    pdf.save(`${fileName}_${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`);
  };

  const exportToImage = async () => {
    const canvas = await exportToCanvas();
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}_${new Date().toISOString().replace(/[:.]/g, "-")}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  if (!isClient) return null;

  return (
    <div className={`flex flex-wrap gap-2 mt-6 ${className}`}>
      <button
        onClick={exportToCSV}
        disabled={!data.length}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        <FileText className="w-4 h-4" />
        CSV
      </button>
      <button
        onClick={exportToPDF}
        disabled={!elementId}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
      >
        <FileDown className="w-4 h-4" />
        PDF
      </button>
      <button
        onClick={exportToImage}
        disabled={!elementId}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
      >
        <Download className="w-4 h-4" />
        Image
      </button>
    </div>
  );
};

export default ExportControls;
