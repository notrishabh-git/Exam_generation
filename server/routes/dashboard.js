const express      = require('express');
const Paper        = require('../models/Paper');
const BankQuestion = require('../models/BankQuestion');
const auth         = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', auth, async (req, res) => {
  try {
    const uid = req.user._id;

    const [
      totalPapers,
      finalizedPapers,
      totalQuestions,
      downloadAgg,
      thisMonthPapers,
      avgQuestionsAgg,
      weeklyPapers,
      subjectDist,
      questionTypeDist,
      bloomsDist,
    ] = await Promise.all([
      // Total papers
      Paper.countDocuments({ createdBy: uid }),

      // Finalized papers
      Paper.countDocuments({ createdBy: uid, status: 'finalized' }),

      // Total questions in bank
      BankQuestion.countDocuments({ createdBy: uid }),

      // Total downloads
      Paper.aggregate([
        { $match: { createdBy: uid } },
        { $group: { _id: null, total: { $sum: '$downloads' } } },
      ]),

      // This month's questions generated (from bank)
      BankQuestion.countDocuments({
        createdBy: uid,
        createdAt: { $gte: new Date(new Date().setDate(1)) },
      }),

      // Average questions per paper
      Paper.aggregate([
        { $match: { createdBy: uid } },
        { $project: { questionCount: { $size: '$questions' } } },
        { $group: { _id: null, avg: { $avg: '$questionCount' } } },
      ]),

      // Weekly paper counts (last 7 days by day of week)
      Paper.aggregate([
        { $match: { createdBy: uid, createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { $dayOfWeek: '$createdAt' }, count: { $sum: 1 } } },
      ]),

      // Subject distribution
      Paper.aggregate([
        { $match: { createdBy: uid } },
        { $group: { _id: '$subject', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),

      // Question type distribution from bank
      BankQuestion.aggregate([
        { $match: { createdBy: uid } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // Bloom's distribution from bank
      BankQuestion.aggregate([
        { $match: { createdBy: uid, bloomsLevel: { $ne: '' } } },
        { $group: { _id: '$bloomsLevel', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    // Count unique subjects
    const totalSubjects = subjectDist.length;

    // Pending review = draft papers
    const pendingReview = await Paper.countDocuments({ createdBy: uid, status: 'draft' });

    res.json({
      success: true,
      stats: {
        totalPapers,
        finalizedPapers,
        totalQuestions,
        totalDownloads:       downloadAgg[0]?.total || 0,
        thisMonthQuestions:   thisMonthPapers,
        avgQuestionsPerPaper: avgQuestionsAgg[0]?.avg || 0,
        totalSubjects,
        pendingReview,
        weeklyPapers,
        subjectDist,
        questionTypeDist,
        bloomsDist,
        approvalRate: totalPapers > 0 ? Math.round((finalizedPapers / totalPapers) * 100) : 0,
      },
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/dashboard/activity
router.get('/activity', auth, async (req, res) => {
  try {
    const recentPapers = await Paper.find({ createdBy: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(8)
      .select('title subject status updatedAt createdAt');

    const activity = recentPapers.map(p => ({
      type:    p.status === 'finalized' ? 'finalized' : 'created',
      message: p.status === 'finalized'
        ? `Finalized "${p.title}"`
        : `Created "${p.title}"`,
      subject: p.subject,
      time:    p.updatedAt,
    }));

    res.json({ success: true, activity });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
