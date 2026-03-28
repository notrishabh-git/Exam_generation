const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  type:        { type: String, enum: ['mcq','short','long','truefalse','fillblank'], required: true },
  question:    { type: String, required: true },
  options:     [String],
  answer:      { type: String, default: '' },
  topic:       { type: String, default: '' },
  marks:       { type: Number, default: 1 },
  difficulty:  { type: String, enum: ['easy','medium','hard'], default: 'medium' },
  bloomsLevel: { type: String, enum: ['Remember','Understand','Apply','Analyze','Evaluate','Create',''], default: '' },
  approved:    { type: Boolean, default: false },
}, { _id: true });

const paperSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  subject:     { type: String, required: true },
  subjectCode: { type: String, default: '' },
  institution: { type: String, default: '' },
  duration:    { type: Number, default: 3 },
  totalMarks:  { type: Number, default: 100 },
  status:      { type: String, enum: ['draft','generating','finalized'], default: 'draft' },
  questions:   [questionSchema],
  config:      { type: mongoose.Schema.Types.Mixed, default: {} },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  downloads:   { type: Number, default: 0 },
  tags:        [String],
  isTemplate:  { type: Boolean, default: false },
}, { timestamps: true });

paperSchema.index({ createdBy: 1, createdAt: -1 });
paperSchema.index({ subject: 'text', title: 'text' });

module.exports = mongoose.model('Paper', paperSchema);
