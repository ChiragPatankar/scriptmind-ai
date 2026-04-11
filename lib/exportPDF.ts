/**
 * exportReportPDF
 * ───────────────
 * Captures a DOM element with html2canvas, converts it to a jsPDF document,
 * and triggers a browser download.
 *
 * Works client-side only. Dynamically imports both libraries to avoid SSR issues.
 */

export async function exportReportPDF(
  element: HTMLElement,
  filename: string = "investor-report.pdf"
): Promise<void> {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  // Scale ×2 for high-DPI capture
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.95);

  // A4 in mm
  const A4_W = 210;
  const A4_H = 297;

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const imgWidthPx  = canvas.width;
  const imgHeightPx = canvas.height;

  // Map canvas pixels → mm maintaining aspect ratio, max width = A4_W
  const ratio      = A4_W / imgWidthPx;
  const imgHeightMm = imgHeightPx * ratio;

  // If the report is taller than A4, split across pages
  let yRemaining = imgHeightMm;
  let yOffset    = 0;

  while (yRemaining > 0) {
    const sliceHeight = Math.min(A4_H, yRemaining);

    // Add the page slice
    pdf.addImage(
      imgData,
      "JPEG",
      0,                                // x in mm
      -yOffset,                         // y in mm (negative scrolls the image up)
      A4_W,
      imgHeightMm,
      undefined,
      "FAST"
    );

    yRemaining -= sliceHeight;
    yOffset    += A4_H;

    if (yRemaining > 0) pdf.addPage();
  }

  pdf.save(filename);
}
