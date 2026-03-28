const express      = require('express');
const BankQuestion = require('../models/BankQuestion');
const auth         = require('../middleware/auth');

const router = express.Router();

// GET /api/bank
router.get('/', auth, async (req, res) => {
  try {
    const { type, difficulty, subject, search, page = 1, limit = 30 } = req.query;
    const query = { createdBy: req.user._id };

    if (type && type !== 'all')       query.type = type;
    if (difficulty && difficulty !== 'all') query.difficulty = difficulty;
    if (subject)                      query.subject = subject;
    if (search)                       query.$text = { $search: search };

    const questions = await BankQuestion.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await BankQuestion.countDocuments(query);
    res.json({ success: true, questions, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/bank/bulk — save multiple questions
router.post('/bulk', auth, async (req, res) => {
  try {
    const { questions, subject } = req.body;
    if (!questions?.length) {
      return res.status(400).json({ message: 'No questions provided' });
    }

    const toInsert = questions.map(q => ({
      type:        q.type,
      question:    q.question,
      options:     q.options || [],
      answer:      q.answer  || '',
      topic:       q.topic   || '',
      subject:     subject   || q.subject || '',
      marks:       q.marks   || 1,
      difficulty:  q.difficulty  || 'medium',
      bloomsLevel: q.bloomsLevel || '',
      createdBy:   req.user._id,
      sourcePaper: q.sourcePaper || undefined,
    }));

    const saved = await BankQuestion.insertMany(toInsert, { ordered: false });
    res.status(201).json({ success: true, count: saved.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/bank/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const q = await BankQuestion.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body, { new: true }
    );
    if (!q) return res.status(404).json({ message: 'Question not found' });
    res.json({ success: true, question: q });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/bank/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const q = await BankQuestion.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!q) return res.status(404).json({ message: 'Question not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/bank/search
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    const questions = await BankQuestion.find({
      createdBy: req.user._id,
      $text: { $search: q },
    }).limit(20);
    res.json({ success: true, questions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
