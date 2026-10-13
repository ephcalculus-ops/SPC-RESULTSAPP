import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Student } from '../types';

export class PDFExportService {
  /**
   * Export the current report card DOM element to an A4 PDF strictly guaranteed to be ONE PAGE
   */
  static async exportReportCard(
    student: Student,
    elementId: string = 'printable-report-sheet',
    term: string = 'Third Term'
  ): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Report sheet element with ID #${elementId} not found`);
    }

    // Capture element with html2canvas at high DPI
    const canvas = await html2canvas(element, {
      scale: 2.2, // 2.2x scale for crisp text and official lines
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1050,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm

    // Safe margins (3mm) to maximize usable printable area while ensuring zero spillover
    const margin = 3;
    const maxAvailableWidth = pageWidth - margin * 2; // 204mm
    const maxAvailableHeight = pageHeight - margin * 2; // 291mm

    // Maintain aspect ratio while guaranteeing it fits inside 1 single A4 page
    const imgRatio = canvas.width / canvas.height;
    let finalWidth = maxAvailableWidth;
    let finalHeight = maxAvailableWidth / imgRatio;

    // If scaled height exceeds page limit, scale down proportionally so everything fits on page 1
    if (finalHeight > maxAvailableHeight) {
      finalHeight = maxAvailableHeight;
      finalWidth = maxAvailableHeight * imgRatio;
    }

    // Center content horizontally and vertically on the single page
    const xOffset = Math.max(margin, (pageWidth - finalWidth) / 2);
    const yOffset = Math.max(margin, (pageHeight - finalHeight) / 2);

    pdf.addImage(imgData, 'JPEG', xOffset, yOffset, finalWidth, finalHeight, undefined, 'FAST');

    // Strict constraint: Ensure the PDF has exactly ONE page and never more
    while (pdf.getNumberOfPages() > 1) {
      pdf.deletePage(pdf.getNumberOfPages());
    }

    const cleanName = student.name.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanClass = student.className.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanTerm = term.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Report_${cleanClass}_${cleanName}_${cleanTerm}.pdf`;

    pdf.save(filename);
  }

  /**
   * Export Class Broadsheet matrix to landscape A4 PDF strictly guaranteed to be ONE PAGE
   */
  static async exportBroadsheet(
    className: string,
    elementId: string = 'printable-broadsheet',
    session: string = '2025-2026',
    term: string = 'Third Term'
  ): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Broadsheet element with ID #${elementId} not found`);
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth(); // 297mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 210mm

    const margin = 4;
    const maxAvailableWidth = pageWidth - margin * 2; // 289mm
    const maxAvailableHeight = pageHeight - margin * 2; // 202mm

    const imgRatio = canvas.width / canvas.height;
    let finalWidth = maxAvailableWidth;
    let finalHeight = maxAvailableWidth / imgRatio;

    if (finalHeight > maxAvailableHeight) {
      finalHeight = maxAvailableHeight;
      finalWidth = maxAvailableHeight * imgRatio;
    }

    const xOffset = Math.max(margin, (pageWidth - finalWidth) / 2);
    const yOffset = Math.max(margin, (pageHeight - finalHeight) / 2);

    pdf.addImage(imgData, 'JPEG', xOffset, yOffset, finalWidth, finalHeight, undefined, 'FAST');

    // Strict constraint: Ensure broadsheet PDF is never more than 1 page
    while (pdf.getNumberOfPages() > 1) {
      pdf.deletePage(pdf.getNumberOfPages());
    }

    const cleanClass = className.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanTerm = term.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Broadsheet_${cleanClass}_${cleanTerm}_${session}.pdf`;

    pdf.save(filename);
  }

  /**
   * Export Portal Gate Student Result preview strictly guaranteed to be ONE PAGE
   */
  static async exportPortalResultCard(
    student: Student,
    elementId: string = 'portal-printable-result',
    term: string = 'Third Term'
  ): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Portal result element with ID #${elementId} not found`);
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 4;
    const maxAvailableWidth = pageWidth - margin * 2;
    const maxAvailableHeight = pageHeight - margin * 2;

    const imgRatio = canvas.width / canvas.height;
    let finalWidth = maxAvailableWidth;
    let finalHeight = maxAvailableWidth / imgRatio;

    if (finalHeight > maxAvailableHeight) {
      finalHeight = maxAvailableHeight;
      finalWidth = maxAvailableHeight * imgRatio;
    }

    const xOffset = Math.max(margin, (pageWidth - finalWidth) / 2);
    const yOffset = Math.max(margin, (pageHeight - finalHeight) / 2);

    pdf.addImage(imgData, 'JPEG', xOffset, yOffset, finalWidth, finalHeight, undefined, 'FAST');

    while (pdf.getNumberOfPages() > 1) {
      pdf.deletePage(pdf.getNumberOfPages());
    }

    const cleanName = student.name.replace(/[^a-zA-Z0-9]/g, '_');
    const cleanClass = student.className.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `PortalResult_${cleanClass}_${cleanName}_${term}.pdf`;

    pdf.save(filename);
  }
}
