const mongoose = require('mongoose');

const bankQuestionSchema = new mongoose.Schema({
  type:        { type: String, enum: ['mcq','short','long','truefalse','fillblank'], required: true },
  question:    { type: String, required: true },
  options:     [String],
  answer:      { type: String, default: '' },
  topic:       { type: String, default: '' },
  subject:     { type: String, default: '' },
  marks:       { type: Number, default: 1 },
  difficulty:  { type: String, enum: ['easy','medium','hard'], default: 'medium' },
  bloomsLevel: { type: String, default: '' },
  tags:        [String],
  usageCount:  { type: Number, default: 0 },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sourcePaper: { type: mongoose.Schema.Types.ObjectId, ref: 'Paper' },
}, { timestamps: true });

bankQuestionSchema.index({ createdBy: 1 });
bankQuestionSchema.index({ subject: 1, type: 1, difficulty: 1 });
bankQuestionSchema.index({ question: 'text' });

module.exports = mongoose.model('BankQuestion', bankQuestionSchema);
