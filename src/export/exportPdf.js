import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { dateStamp } from './exportJson.js';

function imageFormat(dataUrl) {
  if (!dataUrl) return null;
  if (dataUrl.startsWith('data:image/png')) return 'PNG';
  if (dataUrl.startsWith('data:image/webp')) return 'WEBP';
  return 'JPEG';
}

// Compact table: one row per comic, no images — for print/checking off at a
// comic fair so you don't buy a duplicate.
export function exportPdfChecklist(comics, t) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt' });
  doc.setFontSize(16);
  doc.text(t('pdf.checklistTitle'), 40, 40);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(t('pdf.generatedOn', { date: new Date().toLocaleDateString() }), 40, 56);

  const rows = comics.map((c) => [
    c.series || '',
    c.issueNumber || '',
    c.title || '',
    c.condition ? t(`conditions.${c.condition}`) : '',
    c.isRead ? '✓' : '',
  ]);

  autoTable(doc, {
    startY: 72,
    head: [[t('fields.series'), t('fields.issueNumber'), t('fields.title'), t('fields.condition'), t('fields.isRead')]],
    body: rows,
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [183, 39, 59] },
    alternateRowStyles: { fillColor: [245, 242, 235] },
  });

  doc.save(`comicvault-checklist-${dateStamp()}.pdf`);
}

// Visual catalog: a grid of cover thumbnails with key details underneath —
// meant for browsing or printing as a keepsake, not for quick scanning.
export function exportPdfCatalog(comics, t) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const cols = 3;
  const gap = 16;
  const cellW = (pageWidth - margin * 2 - gap * (cols - 1)) / cols;
  const coverH = cellW * 1.5;
  const cellH = coverH + 46;

  let col = 0;
  let row = 0;
  let firstPage = true;

  function addHeader() {
    doc.setFontSize(16);
    doc.setTextColor(20);
    doc.text(t('pdf.catalogTitle'), margin, 40);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(t('pdf.generatedOn', { date: new Date().toLocaleDateString() }), margin, 56);
  }

  addHeader();
  let cursorY = 80;

  for (const comic of comics) {
    if (row * (cellH + gap) + cursorY + cellH > pageHeight - margin) {
      doc.addPage();
      col = 0;
      row = 0;
      cursorY = 40;
      firstPage = false;
    }
    const x = margin + col * (cellW + gap);
    const y = cursorY + row * (cellH + gap);

    doc.setDrawColor(220);
    doc.rect(x, y, cellW, coverH);
    const fmt = imageFormat(comic.coverImage);
    if (fmt) {
      try {
        doc.addImage(comic.coverImage, fmt, x, y, cellW, coverH, undefined, 'FAST');
      } catch {
        // corrupt/unsupported image data — leave the placeholder rectangle
      }
    }

    doc.setFontSize(9);
    doc.setTextColor(90);
    doc.text(comic.series || '', x, y + coverH + 14, { maxWidth: cellW });
    doc.setFontSize(10);
    doc.setTextColor(20);
    const title = comic.issueNumber ? `${comic.title} #${comic.issueNumber}` : comic.title;
    doc.text(title, x, y + coverH + 28, { maxWidth: cellW });

    col += 1;
    if (col >= cols) {
      col = 0;
      row += 1;
    }
  }

  doc.save(`comicvault-catalog-${dateStamp()}.pdf`);
}
