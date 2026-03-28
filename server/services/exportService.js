/**
 * Export Service
 * Generates formatted PDF and DOCX exam papers.
 *
 * For PDF: install pdfkit  → npm install pdfkit
 * For DOCX: install docx   → npm install docx
 *
 * Both are optional — JSON export works without them.
 */

/**
 * Build a plain-text representation of the paper (works always, no deps).
 */
function buildPlainText(paper) {
  const hr = '─'.repeat(60);
  const lines = [];

  lines.push(paper.institution || 'Examination');
  lines.push(`Subject: ${paper.subject}${paper.subjectCode ? ` (${paper.subjectCode})` : ''}`);
  lines.push(`Total Marks: ${paper.totalMarks}   Duration: ${paper.duration} hour(s)`);
  lines.push(hr);
  lines.push('');

  const sections = {};
  paper.questions.forEach(q => {
    if (!sections[q.type]) sections[q.type] = [];
    sections[q.type].push(q);
  });

  const sectionLabels = {
    mcq:       'Section A — Multiple Choice Questions',
    short:     'Section B — Short Answer Questions',
    long:      'Section C — Long Answer Questions',
    truefalse: 'Section D — True / False Questions',
    fillblank: 'Section E — Fill in the Blanks',
  };

  let globalNum = 1;
  for (const [type, questions] of Object.entries(sections)) {
    lines.push(sectionLabels[type] || type.toUpperCase());
    lines.push(hr);
    questions.forEach(q => {
      lines.push(`Q${globalNum}. [${q.marks} marks] ${q.question}`);
      if (q.type === 'mcq' && q.options) {
        q.options.forEach((opt, i) => {
          lines.push(`   ${String.fromCharCode(65 + i)}) ${opt}`);
        });
      }
      lines.push('');
      globalNum++;
    });
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Build answer key plain text.
 */
function buildAnswerKey(paper) {
  const lines = [];
  lines.push(`ANSWER KEY — ${paper.title || paper.subject}`);
  lines.push('─'.repeat(60));
  lines.push('');
  paper.questions.forEach((q, i) => {
    lines.push(`Q${i + 1}. ${q.answer || 'See marking scheme'}`);
    lines.push('');
  });
  return lines.join('\n');
}

module.exports = { buildPlainText, buildAnswerKey };

/*
 * ─────────────────────────────────────────────────────────────────
 * HOW TO ADD PDF EXPORT (pdfkit)
 * ─────────────────────────────────────────────────────────────────
 * npm install pdfkit
 *
 * const PDFDocument = require('pdfkit');
 *
 * function generatePDF(paper) {
 *   return new Promise((resolve, reject) => {
 *     const doc = new PDFDocument({ margin: 50 });
 *     const chunks = [];
 *     doc.on('data', chunk => chunks.push(chunk));
 *     doc.on('end', () => resolve(Buffer.concat(chunks)));
 *     doc.on('error', reject);
 *
 *     // Header
 *     doc.fontSize(16).font('Helvetica-Bold').text(paper.institution || 'Examination', { align: 'center' });
 *     doc.fontSize(14).text(`${paper.subject} Examination`, { align: 'center' });
 *     doc.fontSize(11).font('Helvetica').text(
 *       `Total Marks: ${paper.totalMarks}    Duration: ${paper.duration} hr(s)`,
 *       { align: 'center' }
 *     );
 *     doc.moveDown();
 *     doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
 *     doc.moveDown();
 *
 *     // Questions
 *     paper.questions.forEach((q, i) => {
 *       doc.fontSize(11).font('Helvetica-Bold').text(`Q${i+1}. `, { continued: true });
 *       doc.font('Helvetica').text(`[${q.marks} marks]  ${q.question}`);
 *       if (q.type === 'mcq' && q.options) {
 *         q.options.forEach((opt, j) => {
 *           doc.text(`   ${String.fromCharCode(65+j)}) ${opt}`);
 *         });
 *       }
 *       doc.moveDown(0.5);
 *     });
 *
 *     doc.end();
 *   });
 * }
 *
 * // In the route:
 * const pdf = await generatePDF(paper);
 * res.set({ 'Content-Type':'application/pdf', 'Content-Disposition':`attachment; filename="${paper.title}.pdf"` });
 * res.send(pdf);
 *
 * ─────────────────────────────────────────────────────────────────
 * HOW TO ADD DOCX EXPORT (docx)
 * ─────────────────────────────────────────────────────────────────
 * npm install docx
 *
 * const { Document, Paragraph, TextRun, Packer } = require('docx');
 *
 * async function generateDOCX(paper) {
 *   const doc = new Document({
 *     sections: [{
 *       children: [
 *         new Paragraph({ children: [new TextRun({ text: paper.institution, bold:true, size:28 })] }),
 *         new Paragraph({ children: [new TextRun({ text: paper.subject, size:24 })] }),
 *         ...paper.questions.flatMap((q, i) => [
 *           new Paragraph({ children: [new TextRun({ text: `Q${i+1}. [${q.marks} marks] ${q.question}`, bold:true })] }),
 *           ...(q.options || []).map((opt, j) =>
 *             new Paragraph({ text: `  ${String.fromCharCode(65+j)}) ${opt}` })
 *           ),
 *         ]),
 *       ],
 *     }],
 *   });
 *   return Packer.toBuffer(doc);
 * }
 */
