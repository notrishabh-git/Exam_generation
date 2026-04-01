import React, { useState } from 'react';
import {
  Check, X, RefreshCw, Edit3, Save, Trash2,
  Download, Database, FileText, ChevronDown,
  CheckCircle2, Circle, GripVertical, Plus,
  Filter, Award
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useGeneratorStore } from '../../store';
import { papersAPI, bankAPI } from '../../utils/api';
import './QuestionReview.css';

const TYPE_LABELS = {
  mcq:       { label: 'MCQ',         color: 'blue'   },
  short:     { label: 'Short Ans',   color: 'green'  },
  long:      { label: 'Long Ans',    color: 'purple' },
  truefalse: { label: 'True/False',  color: 'amber'  },
  fillblank: { label: 'Fill Blank',  color: 'teal'   },
};

const BLOOMS = ['Remember','Understand','Apply','Analyze','Evaluate','Create'];
const BLOOMS_COLOR = {
  Remember:'green', Understand:'blue', Apply:'purple',
  Analyze:'amber', Evaluate:'red', Create:'teal'
};

function QuestionCard({ question, index }) {
  const { updateQuestion, removeQuestion, toggleApproved, setGenerating, generatingIds, config } = useGeneratorStore();
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ ...question });
  const isGenerating = generatingIds.includes(question.id);

  const handleSave = () => {
    updateQuestion(question.id, editData);
    setEditing(false);
    toast.success('Question updated');
  };

  const handleRegenerate = async () => {
    setGenerating(question.id, true);
    try {
      const { generateAPI } = await import('../../utils/api');
      const { data } = await generateAPI.regenerateQuestion({
        topic: question.topic,
        type: question.type,
        difficulty: question.difficulty,
        bloomsLevel: question.bloomsLevel,
      });
      updateQuestion(question.id, data.question);
      toast.success('Question regenerated');
    } catch {
      toast.error('Regeneration failed');
    } finally {
      setGenerating(question.id, false);
    }
  };

  const typeMeta = TYPE_LABELS[question.type] || { label: question.type, color: 'gray' };

  return (
    <div className={`qcard ${question.approved ? 'approved' : ''} ${isGenerating ? 'generating' : ''}`}>
      {/* Card header */}
      <div className="qcard-header">
        <div className="qcard-meta">
          <span className="qcard-num">Q{index + 1}</span>
          <span className={`badge badge-${typeMeta.color}`}>{typeMeta.label}</span>
          {question.bloomsLevel && (
            <span className={`badge badge-${BLOOMS_COLOR[question.bloomsLevel] || 'gray'}`}>
              <Award size={10}/>{question.bloomsLevel}
            </span>
          )}
          <span className="badge badge-gray">
            {question.difficulty}
          </span>
          <span className="qcard-marks">{question.marks} marks</span>
          {question.topic && <span className="qcard-topic">{question.topic}</span>}
        </div>
        <div className="qcard-actions">
          {isGenerating ? (
            <div className="regen-spinner" />
          ) : (
            <>
              <button className="qbtn" onClick={() => { setEditData({...question}); setEditing(!editing); }} title="Edit">
                <Edit3 size={13}/>
              </button>
              <button className="qbtn" onClick={handleRegenerate} title="Regenerate">
                <RefreshCw size={13}/>
              </button>
              <button className="qbtn danger" onClick={() => removeQuestion(question.id)} title="Delete">
                <Trash2 size={13}/>
              </button>
              <button
                className={`qbtn approve ${question.approved ? 'active' : ''}`}
                onClick={() => toggleApproved(question.id)}
                title={question.approved ? 'Unapprove' : 'Approve'}
              >
                {question.approved ? <CheckCircle2 size={14}/> : <Circle size={14}/>}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Question body */}
      {editing ? (
        <div className="qcard-edit">
          <div className="input-group">
            <label className="input-label">Question</label>
            <textarea className="textarea" rows={3}
              value={editData.question}
              onChange={e => setEditData(d => ({ ...d, question: e.target.value }))}
            />
          </div>
          {question.type === 'mcq' && editData.options && (
            <div className="input-group">
              <label className="input-label">Options (mark correct with ✓)</label>
              {editData.options.map((opt, i) => (
                <div key={i} className="option-edit-row">
                  <span className="option-letter">{String.fromCharCode(65+i)}</span>
                  <input className="input input-sm" value={opt}
                    onChange={e => {
                      const opts = [...editData.options];
                      opts[i] = e.target.value;
                      setEditData(d => ({ ...d, options: opts }));
                    }}
                  />
                  <button
                    className={`btn btn-sm ${editData.answer === opt ? 'btn-success' : 'btn-ghost'}`}
                    onClick={() => setEditData(d => ({ ...d, answer: opt }))}
                    title="Mark as correct"
                  >
                    <Check size={12}/>
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="input-group">
            <label className="input-label">Answer / Key</label>
            <textarea className="textarea" rows={2}
              value={editData.answer}
              onChange={e => setEditData(d => ({ ...d, answer: e.target.value }))}
            />
          </div>
          <div className="edit-row-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}><X size={13}/> Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleSave}><Save size={13}/> Save</button>
          </div>
        </div>
      ) : (
        <div className="qcard-body">
          <p className="qcard-question">{question.question}</p>
          {question.type === 'mcq' && question.options && (
            <div className="qcard-options">
              {question.options.map((opt, i) => (
                <div key={i} className={`qcard-option ${question.answer === opt ? 'correct' : ''}`}>
                  <span className="option-letter">{String.fromCharCode(65+i)}</span>
                  <span>{opt}</span>
                  {question.answer === opt && <Check size={12} className="option-check"/>}
                </div>
              ))}
            </div>
          )}
          {question.answer && question.type !== 'mcq' && (
            <div className="qcard-answer">
              <span className="answer-label">Answer:</span>
              <span className="answer-text">{question.answer}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function QuestionReview() {
  const { questions, config, draftId } = useGeneratorStore();
  const [filter, setFilter] = useState('all');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const approved = questions.filter(q => q.approved);
  const filtered = filter === 'all' ? questions
    : filter === 'approved' ? questions.filter(q => q.approved)
    : questions.filter(q => q.type === filter);

  const handleSavePaper = async () => {
    if (approved.length === 0) { toast.error('Approve at least one question'); return; }
    setSaving(true);
    try {
      const payload = {
        title: `${config.subject} — Examination`,
        subject: config.subject,
        subjectCode: config.subjectCode,
        institution: config.institution,
        duration: config.duration,
        totalMarks: approved.reduce((s, q) => s + q.marks, 0),
        questions: approved,
        config,
        status: 'finalized'
      };
      if (draftId) {
        await papersAPI.update(draftId, payload);
      } else {
        await papersAPI.create(payload);
      }

      // Automatically sync these approved questions to the Master Question Bank 
      // so the user doesn't have to manually click the separate "Save to Bank" button
      try {
        await bankAPI.addMany({ questions: approved, subject: config.subject });
      } catch (err) {
        console.error('Non-critical: Background auto-sync to bank failed', err);
      }
      toast.success('Paper saved successfully!');
    } catch {
      toast.error('Failed to save paper');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveToBank = async () => {
    try {
      await bankAPI.addMany({ questions: approved.length > 0 ? approved : questions, subject: config.subject });
      toast.success(`${approved.length || questions.length} questions saved to bank`);
    } catch {
      toast.error('Failed to save to bank');
    }
  };

  const handleExportPDF = async () => {
    toast.success('Export coming soon — backend integration needed');
  };

  return (
    <div className="question-review">
      {/* Summary bar */}
      <div className="review-summary">
        <div className="summary-stats">
          <div className="summary-stat">
            <span className="ss-val">{questions.length}</span>
            <span className="ss-label">Total</span>
          </div>
          <div className="summary-stat">
            <span className="ss-val text-green">{approved.length}</span>
            <span className="ss-label">Approved</span>
          </div>
          <div className="summary-stat">
            <span className="ss-val">{approved.reduce((s, q) => s + q.marks, 0)}</span>
            <span className="ss-label">Total Marks</span>
          </div>
          <div className="summary-stat">
            <span className="ss-val">{approved.length > 0 ? Math.round(approved.length / questions.length * 100) : 0}%</span>
            <span className="ss-label">Approved</span>
          </div>
        </div>

        {/* Approve all */}
        <div className="review-bulk">
          <button className="btn btn-secondary btn-sm"
            onClick={() => questions.forEach(q => !q.approved && useGeneratorStore.getState().toggleApproved(q.id))}>
            <CheckCircle2 size={13}/> Approve All
          </button>
        </div>

        {/* Export actions */}
        <div className="review-actions">
          <button className="btn btn-secondary btn-sm" onClick={handleSaveToBank}>
            <Database size={13}/> Save to Bank
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportPDF}>
            <Download size={13}/> Export PDF
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleSavePaper} disabled={saving}>
            {saving ? <><div className="btn-spinner"/>Saving…</> : <><Save size={13}/> Save Paper</>}
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="review-filter">
        {['all', 'approved', 'mcq', 'short', 'long', 'truefalse', 'fillblank'].map(f => {
          const count = f === 'all' ? questions.length
            : f === 'approved' ? approved.length
            : questions.filter(q => q.type === f).length;
          if (f !== 'all' && f !== 'approved' && count === 0) return null;
          return (
            <button key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f === 'approved' ? 'Approved' : TYPE_LABELS[f]?.label || f}
              <span className="filter-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Questions list */}
      <div className="questions-list">
        {filtered.length === 0 ? (
          <div className="empty-questions">
            <Circle size={40} />
            <p>No questions match this filter</p>
          </div>
        ) : (
          filtered.map((q, i) => (
            <QuestionCard key={q.id} question={q} index={questions.indexOf(q)} />
          ))
        )}
      </div>
    </div>
  );
}
