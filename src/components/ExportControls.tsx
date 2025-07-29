"use client";
import React, { useEffect, useState } from "react";
import { Download, FileText, FileDown } from "lucide-react";

interface MarketData {
  date?: Date;
  volatility?: number | string;
  liquidity?: number | string;
  performance?: number | string;
  open?: number | string;
  close?: number | string;
  volume?: number | string;
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

    const allKeys = new Set<string>();
    data.forEach(item => {
      Object.keys(item).forEach(key => allKeys.add(key));
    });

    const headers = Array.from(allKeys).filter(key =>
      !['id', '__typename'].includes(key)
    ).sort();

    const displayHeaders = headers.map(header => {
      return header.charAt(0).toUpperCase() + header.slice(1);
    });

    const rows = data.map((item) => {
      return headers.map(header => {
        let value = item[header];

        if (value instanceof Date) {
          value = value.toISOString().split("T")[0];
        }

        const stringValue = String(value ?? "");

        if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }

        return stringValue;
      });
    });

    const csvContent = [
      displayHeaders.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const csv = "\uFEFF" + csvContent;

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToImage = async () => {
    // Get the calendar grid
    const calendarGrid = document.querySelector('.grid.grid-cols-7');
    if (!calendarGrid) {
      console.error('Calendar grid not found');
      return;
    }
  
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to export image');
        return;
      }
  
      // Create a clean container for the export
      const exportContainer = document.createElement('div');
      exportContainer.className = 'export-container';
      exportContainer.style.width = '100%';
      exportContainer.style.maxWidth = '1200px';
      exportContainer.style.margin = '0 auto';
      exportContainer.style.padding = '20px';
      exportContainer.style.backgroundColor = 'white';
      
      // Clone the grid and its children
      const gridClone = calendarGrid.cloneNode(true) as HTMLElement;
      exportContainer.appendChild(gridClone);
  
      // Remove hover effects and tooltips
      const hoverElements = gridClone.querySelectorAll('[class*="hover:"], [class*="group"]');
      hoverElements.forEach(el => {
        const element = el as HTMLElement;
        // Remove hover classes
        element.className = element.className
          .split(' ')
          .filter(cls => !cls.includes('hover:') && !cls.includes('group'))
          .join(' ');
      });
  
      // Style the cells to match the calendar
      const cells = gridClone.querySelectorAll('[class*="calendar-cell"]');
      cells.forEach(cell => {
        const cellElement = cell as HTMLElement;
        // Reset and style the cell
        cellElement.style.display = 'flex';
        cellElement.style.flexDirection = 'column';
        cellElement.style.minHeight = '100px';
        cellElement.style.padding = '0.5rem';
        cellElement.style.backgroundColor = 'white';
        cellElement.style.border = '1px solid #e5e7eb';
        cellElement.style.borderRadius = '0.375rem';
        cellElement.style.position = 'relative';
        cellElement.style.opacity = '1';
        cellElement.style.visibility = 'visible';
        cellElement.style.margin = '2px';
        
        // Style the date number
        const dateElement = cellElement.querySelector('[class*="text-gray-900"]');
        if (dateElement) {
          (dateElement as HTMLElement).style.fontWeight = '500';
          (dateElement as HTMLElement).style.marginBottom = '0.5rem';
        }
      });
  
      const styles = `
        <style>
          body { 
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            background-color: white;
          }
          .export-container {
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: white;
          }
          .grid {
            display: grid !important;
            grid-template-columns: repeat(7, minmax(0, 1fr)) !important;
            gap: 8px !important;
            width: 100% !important;
            background-color: transparent !important;
            padding: 0 !important;
          }
          [class*="calendar-cell"] {
            min-height: 100px !important;
            padding: 0.5rem !important;
            background-color: white !important;
            position: relative !important;
            display: flex !important;
            flex-direction: column !important;
            border: 1px solid #e5e7eb !important;
            border-radius: 0.375rem !important;
            margin: 2px !important;
          }
          [class*="text-gray-900"] {
            font-weight: 500 !important;
            margin-bottom: 0.5rem !important;
          }
        </style>
      `;
  
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Market Calendar Export</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          ${styles}
        </head>
        <body class="font-sans bg-white text-black p-5 m-0 w-screen min-h-screen antialiased">
          <div class="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
            <div class="bg-gradient-to-br from-indigo-500 via-purple-600 to-purple-700 text-white text-center py-8 px-5">
              <h1 class="text-3xl font-bold mb-3 drop-shadow-lg">Market Calendar</h1>
              <p class="text-base my-1 opacity-90">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            </div>
            <div class="p-4">
              ${exportContainer.outerHTML}
            </div>
          </div>
        </body>
        </html>
      `;
  
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
  
      printWindow.focus();
    } catch (error) {
      console.error('Error exporting to image:', error);
      alert('Error exporting calendar. Please try again.');
    }
  };

  const exportToPDF = async () => {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element with ID '${elementId}' not found`);
      return;
    }

    try {

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to export PDF');
        return;
      }

      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Market Data Export</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body class="font-sans m-5 text-black bg-white leading-relaxed">
          <div class="text-center border-b-2 border-gray-800 pb-5 mb-8">
            <h1 class="m-0 text-gray-800 text-2xl font-bold">Market Data Export</h1>
            <p class="my-1 text-gray-600">Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            <p class="my-1 text-gray-600">Total Records: ${data.length}</p>
          </div>
      `;

      if (data.length > 0) {

        const allKeys = new Set<string>();
        data.forEach(item => {
          Object.keys(item).forEach(key => {
            if (!['id', '__typename'].includes(key)) {
              allKeys.add(key);
            }
          });
        });

        const headers = Array.from(allKeys).sort();
        htmlContent += `
          <div class="bg-blue-50 border border-blue-200 p-4 my-5 rounded-md">
            <strong>Data Summary:</strong> This export contains ${data.length} records with the following fields: ${headers.join(', ')}.
          </div>
          
          <table class="w-full border-collapse mt-5">
            <thead>
              <tr class="bg-gray-100">
                ${headers.map(header =>
          `<th class="border border-gray-300 px-3 py-2 text-left font-bold text-gray-800">${header.charAt(0).toUpperCase() + header.slice(1)}</th>`
        ).join('')}
              </tr>
            </thead>
            <tbody>
        `;

        data.forEach((item, index) => {
          const rowClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
          htmlContent += `<tr class="${rowClass}">`;
          headers.forEach(header => {
            let value = item[header];

            if (value instanceof Date) {
              value = value.toLocaleDateString();
            } else if (typeof value === 'number') {
              value = value.toLocaleString();
            } else if (value === null || value === undefined) {
              value = '-';
            }

            htmlContent += `<td class="border border-gray-300 px-3 py-2">${String(value)}</td>`;
          });
          htmlContent += '</tr>';
        });

        htmlContent += `
            </tbody>
          </table>
        `;
      } else {
        htmlContent += `
          <div class="text-center text-gray-600 italic my-10">
            <p>No market data available for the selected period.</p>
          </div>
        `;
      }

      htmlContent += `
          <div class="mt-10 text-center text-gray-500 text-xs">
            <p>This document was generated automatically from the Market Seasonality Explorer.</p>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      setTimeout(() => {
        printWindow.focus();
        printWindow.print();

        setTimeout(() => {
          printWindow.close();
        }, 1000);
      }, 500);

    } catch (error) {
      console.error('Export to PDF failed:', error);
      alert('PDF export failed. Please try again.');
    }
  };

  if (!isClient) return null;

  return (
    <div className={`flex flex-wrap gap-2 mt-6 ${className}`}>
      <button
        onClick={exportToCSV}
        disabled={!data.length}
        className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title={!data.length ? "No data to export" : "Export as CSV"}
      >
        <FileText className="w-4 h-4" />
        CSV
      </button>

      <button
        onClick={exportToPDF}
        disabled={!elementId}
        className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title={!elementId ? "No element to export" : "Export as PDF"}
      >
        <FileDown className="w-4 h-4" />
        PDF
      </button>

      <button
        onClick={exportToImage}
        disabled={!elementId}
        className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title={!elementId ? "No element to export" : "Export as image"}
      >
        <Download className="w-4 h-4" />
        Image
      </button>
    </div>
  );
};

export default ExportControls;