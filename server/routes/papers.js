const express = require('express');
const Paper   = require('../models/Paper');
const auth    = require('../middleware/auth');

const router = express.Router();

// GET /api/papers  — list user's papers with filters
router.get('/', auth, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = { createdBy: req.user._id };
    if (status && status !== 'all') query.status = status;
    if (search) query.$text = { $search: search };

    const papers = await Paper.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-questions');

    const total = await Paper.countDocuments(query);
    res.json({ success: true, papers, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/papers/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const paper = await Paper.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!paper) return res.status(404).json({ message: 'Paper not found' });
    res.json({ success: true, paper });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/papers
router.post('/', auth, async (req, res) => {
  try {
    const paperData = { ...req.body, createdBy: req.user._id };
    const paper = await Paper.create(paperData);
    res.status(201).json({ success: true, paper });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/papers/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const paper = await Paper.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!paper) return res.status(404).json({ message: 'Paper not found' });
    res.json({ success: true, paper });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/papers/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const paper = await Paper.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!paper) return res.status(404).json({ message: 'Paper not found' });
    res.json({ success: true, message: 'Paper deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/papers/:id/duplicate
router.post('/:id/duplicate', auth, async (req, res) => {
  try {
    const original = await Paper.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!original) return res.status(404).json({ message: 'Paper not found' });
    const { _id, createdAt, updatedAt, downloads, ...data } = original.toObject();
    const copy = await Paper.create({
      ...data,
      title: `${original.title} (Copy)`,
      status: 'draft',
      downloads: 0,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, paper: copy });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/papers/:id/export/:format
router.get('/:id/export/:format', auth, async (req, res) => {
  try {
    const paper = await Paper.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!paper) return res.status(404).json({ message: 'Paper not found' });
    const { format } = req.params;

    // Increment download count
    await Paper.findByIdAndUpdate(paper._id, { $inc: { downloads: 1 } });

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${paper.title}.json"`);
      return res.json(paper);
    }

    // PDF / DOCX export — return instructions (implement with pdf-lib or docx libraries)
    res.status(501).json({ message: `${format.toUpperCase()} export requires additional setup. See /server/services/exportService.js` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
