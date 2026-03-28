const express = require('express');
const multer  = require('multer');
const auth    = require('../middleware/auth');
const { generateQuestions, regenerateQuestion, extractTopicsFromText } = require('../services/aiService');
const { extractTextFromFile, cleanText } = require('../services/fileService');

const router = express.Router();

// Multer — memory storage (no disk write)
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf','.docx','.doc','.pptx','.ppt','.txt'];
    const ext = '.' + file.originalname.split('.').pop().toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error(`File type not allowed: ${ext}`));
  },
});

// POST /api/generate/extract-topics
// Accepts multipart/form-data with files[] and topics[]
router.post('/extract-topics', auth, upload.array('files', 10), async (req, res) => {
  try {
    const topics = new Set();

    // Manual topics from form data
    const manualTopics = req.body['topics[]'] || req.body.topics || [];
    const manual = Array.isArray(manualTopics) ? manualTopics : [manualTopics];
    manual.filter(Boolean).forEach(t => topics.add(t.trim()));

    // Extract from uploaded files
    if (req.files?.length) {
      for (const file of req.files) {
        try {
          const rawText  = await extractTextFromFile(file.buffer, file.originalname);
          const cleaned  = cleanText(rawText);

          if (cleaned.length > 100) {
            const aiTopics = await extractTopicsFromText(cleaned);
            aiTopics.forEach(t => topics.add(t));
          }
        } catch (err) {
          console.warn(`Failed to parse ${file.originalname}:`, err.message);
          // Use filename as fallback topic
          topics.add(file.originalname.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
        }
      }
    }

    const topicArray = [...topics].filter(Boolean).slice(0, 40); // max 40 topics

    if (topicArray.length === 0) {
      return res.status(400).json({ message: 'No topics could be extracted. Please add topics manually.' });
    }

    res.json({ success: true, topics: topicArray, count: topicArray.length });
  } catch (err) {
    console.error('Extract topics error:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/generate/questions
router.post('/questions', auth, async (req, res) => {
  try {
    const { topics, config } = req.body;

    if (!topics?.length) {
      return res.status(400).json({ message: 'At least one topic is required' });
    }

    // Validate at least one question type is enabled
    const activeTypes = Object.values(config?.questionTypes || {}).filter(t => t.enabled);
    if (activeTypes.length === 0) {
      return res.status(400).json({ message: 'Enable at least one question type' });
    }

    const questions = await generateQuestions(topics, config);

    res.json({ success: true, questions, count: questions.length });
  } catch (err) {
    console.error('Generate questions error:', err);
    res.status(500).json({ message: `Generation failed: ${err.message}` });
  }
});

// POST /api/generate/regenerate
router.post('/regenerate', auth, async (req, res) => {
  try {
    const { topic, type, difficulty, bloomsLevel } = req.body;
    if (!topic || !type) {
      return res.status(400).json({ message: 'topic and type are required' });
    }

    const question = await regenerateQuestion({ topic, type, difficulty, bloomsLevel });
    res.json({ success: true, question });
  } catch (err) {
    console.error('Regenerate error:', err);
    res.status(500).json({ message: `Regeneration failed: ${err.message}` });
  }
});

module.exports = router;
