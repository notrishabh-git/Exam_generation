const pdfParse = require('pdf-parse');
const mammoth  = require('mammoth');
const path     = require('path');

/**
 * Extract text content from an uploaded file buffer.
 */
async function extractTextFromFile(buffer, originalname) {
  const ext = path.extname(originalname).toLowerCase();

  switch (ext) {
    case '.pdf':
      return extractPDF(buffer);
    case '.docx':
    case '.doc':
      return extractDOCX(buffer);
    case '.pptx':
    case '.ppt':
      return extractPPTX(buffer);
    case '.txt':
      return buffer.toString('utf-8');
    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}

async function extractPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (err) {
    throw new Error(`PDF parsing failed: ${err.message}`);
  }
}

async function extractDOCX(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch (err) {
    throw new Error(`DOCX parsing failed: ${err.message}`);
  }
}

async function extractPPTX(buffer) {
  // PPTX is a ZIP of XML files — basic extraction using mammoth fallback
  // For full PPTX support, use the 'pptx2json' or 'officegen' package
  // This is a placeholder that returns the raw buffer as text (will extract some content)
  try {
    // Try mammoth first (works for some PPTX)
    const result = await mammoth.extractRawText({ buffer });
    if (result.value && result.value.length > 50) return result.value;
  } catch {}

  // Fallback: return buffer as utf8 (will contain some readable text from XML)
  const raw = buffer.toString('utf-8');
  // Extract text between XML tags
  const textMatches = raw.match(/>([^<]{3,})</g) || [];
  return textMatches
    .map(m => m.replace(/^>|<$/g, '').trim())
    .filter(t => t.length > 5 && !/^[a-zA-Z0-9+/]{40,}/.test(t)) // skip base64
    .join('\n');
}

/**
 * Clean and normalize extracted text.
 */
function cleanText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ ]{3,}/g, '  ')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

module.exports = { extractTextFromFile, cleanText };
