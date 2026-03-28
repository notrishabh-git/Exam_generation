import React, { useState, useEffect, useCallback } from 'react';
import { Search, Database, Trash2, Edit3, Plus, Download, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import AppLayout from '../components/layout/AppLayout';
import { bankAPI } from '../utils/api';
import './QuestionBank.css';

const TYPE_META = {
  mcq:       { label:'MCQ',        color:'blue'   },
  short:     { label:'Short',      color:'green'  },
  long:      { label:'Long',       color:'purple' },
  truefalse: { label:'True/False', color:'amber'  },
  fillblank: { label:'Fill Blank', color:'teal'   },
};
const DIFF_COLOR  = { easy:'green', medium:'amber', hard:'red' };
const BLOOM_COLOR = { Remember:'green', Understand:'blue', Apply:'purple', Analyze:'amber', Evaluate:'red', Create:'teal' };

function EditModal({ question, onSave, onClose }) {
  const [form, setForm] = useState({ ...question });

  const handleSave = async () => {
    try {
      const { data } = await bankAPI.update(question._id, form);
      onSave(data.question);
      toast.success('Question updated');
    } catch {
      toast.error('Update failed');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.1rem' }}>Edit Question</h3>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}><X size={15}/></button>
        </div>
        <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="input-group">
            <label className="input-label">Question</label>
            <textarea className="textarea" rows={3} value={form.question}
              onChange={e => setForm(f => ({ ...f, question: e.target.value }))}/>
          </div>
          {form.type === 'mcq' && (
            <div className="input-group">
              <label className="input-label">Options (comma separated)</label>
              <input className="input" value={form.options?.join(', ') || ''}
                onChange={e => setForm(f => ({ ...f, options: e.target.value.split(',').map(s => s.trim()) }))}/>
            </div>
          )}
          <div className="input-group">
            <label className="input-label">Answer</label>
            <textarea className="textarea" rows={2} value={form.answer}
              onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div className="input-group">
              <label className="input-label">Difficulty</label>
              <select className="select" value={form.difficulty}
                onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Marks</label>
              <input className="input" type="number" min={1} value={form.marks}
                onChange={e => setForm(f => ({ ...f, marks: parseInt(e.target.value) }))}/>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave}><Save size={13}/> Save</button>
        </div>
      </div>
    </div>
  );
}

export default function QuestionBank() {
  const [questions, setQuestions]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [editing, setEditing]       = useState(null);
  const [filters, setFilters]       = useState({ type:'all', difficulty:'all', subject:'' });
  const [search, setSearch]         = useState('');
  const [subjects, setSubjects]     = useState([]);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 30, ...filters };
      if (search.trim()) params.search = search.trim();
      const { data } = await bankAPI.getAll(params);
      setQuestions(data.questions || []);
      setTotal(data.total || 0);

      // Extract unique subjects for filter dropdown
      if (data.questions?.length) {
        const subs = [...new Set(data.questions.map(q => q.subject).filter(Boolean))];
        setSubjects(prev => [...new Set([...prev, ...subs])]);
      }
    } catch {
      toast.error('Failed to load question bank');
    } finally {
      setLoading(false);
    }
  }, [page, filters, search]);

  useEffect(() => {
    const timer = setTimeout(fetchQuestions, 300);
    return () => clearTimeout(timer);
  }, [fetchQuestions]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await bankAPI.delete(id);
      setQuestions(qs => qs.filter(q => q._id !== id));
      setTotal(t => t - 1);
      toast.success('Question deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleUpdate = (updated) => {
    setQuestions(qs => qs.map(q => q._id === updated._id ? updated : q));
    setEditing(null);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(questions, null, 2)], { type:'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'question-bank.json'; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${questions.length} questions`);
  };

  return (
    <AppLayout>
      <div className="qbank-page animate-fade-in">

        {/* Stats */}
        <div className="qbank-stats">
          {[
            { label:'Total Questions',  value: total,                                                        color:'blue'   },
            { label:'Subjects',         value: subjects.length,                                              color:'purple' },
            { label:'MCQs',             value: questions.filter(q => q.type === 'mcq').length,               color:'green'  },
            { label:'Descriptive',      value: questions.filter(q => ['short','long'].includes(q.type)).length, color:'amber'},
          ].map(s => (
            <div key={s.label} className="qbank-stat-pill">
              <span className={`qs-stat-val text-${s.color}`}>{loading ? '…' : s.value}</span>
              <span className="qs-stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="qbank-toolbar">
          <div className="papers-search" style={{ maxWidth:360 }}>
            <Search size={14} className="papers-search-icon"/>
            <input className="papers-search-input" placeholder="Search questions…"
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}/>
          </div>
          <select className="select" style={{ width:130 }}
            value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
            <option value="all">All Types</option>
            {Object.entries(TYPE_META).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select className="select" style={{ width:140 }}
            value={filters.difficulty} onChange={e => setFilters(f => ({ ...f, difficulty: e.target.value }))}>
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          {subjects.length > 0 && (
            <select className="select" style={{ width:160 }}
              value={filters.subject} onChange={e => setFilters(f => ({ ...f, subject: e.target.value }))}>
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
            <button className="btn btn-secondary btn-sm" onClick={handleExport} disabled={questions.length === 0}>
              <Download size={13}/> Export
            </button>
          </div>
        </div>

        <div className="papers-count">
          {loading ? 'Loading…' : `Showing ${questions.length} of ${total} questions`}
        </div>

        {/* List */}
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height:80, borderRadius:12 }}/>)}
          </div>
        ) : questions.length === 0 ? (
          <div className="papers-empty">
            <Database size={48}/>
            <h3>Question bank is empty</h3>
            <p>Generate exam papers and save approved questions to your bank</p>
          </div>
        ) : (
          <div className="qbank-list">
            {questions.map((q, i) => {
              const typeMeta = TYPE_META[q.type] || { label: q.type, color:'gray' };
              return (
                <div key={q._id} className="qbank-item">
                  <div className="qbank-item-left">
                    <span className="qbank-num">{(page - 1) * 30 + i + 1}</span>
                  </div>
                  <div className="qbank-item-body">
                    <div className="qbank-item-meta">
                      <span className={`badge badge-${typeMeta.color}`}>{typeMeta.label}</span>
                      <span className={`badge badge-${DIFF_COLOR[q.difficulty] || 'gray'}`}>{q.difficulty}</span>
                      {q.bloomsLevel && <span className={`badge badge-${BLOOM_COLOR[q.bloomsLevel] || 'gray'}`}>{q.bloomsLevel}</span>}
                      {q.subject && <span className="badge badge-gray">{q.subject}</span>}
                      <span className="badge badge-gray">{q.marks} marks</span>
                    </div>
                    <p className="qbank-question">{q.question}</p>
                    {q.type === 'mcq' && q.options?.length > 0 && (
                      <div className="qbank-options">
                        {q.options.map((opt, j) => (
                          <span key={j} className={`qbank-opt ${q.answer === opt ? 'correct' : ''}`}>
                            {String.fromCharCode(65+j)}. {opt}
                          </span>
                        ))}
                      </div>
                    )}
                    {q.answer && q.type !== 'mcq' && (
                      <div className="qbank-answer">
                        <span className="answer-label">Answer:</span>
                        <span className="answer-text">{q.answer}</span>
                      </div>
                    )}
                  </div>
                  <div className="qbank-item-actions">
                    <button className="qbtn" title="Edit" onClick={() => setEditing(q)}><Edit3 size={13}/></button>
                    <button className="qbtn danger" title="Delete" onClick={() => handleDelete(q._id)}><Trash2 size={13}/></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {total > 30 && !loading && (
          <div className="pagination">
            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <span className="page-info">Page {page} of {Math.ceil(total / 30)}</span>
            <button className="btn btn-secondary btn-sm" disabled={page >= Math.ceil(total / 30)} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        )}

        {/* Edit modal */}
        {editing && <EditModal question={editing} onSave={handleUpdate} onClose={() => setEditing(null)}/>}
      </div>
    </AppLayout>
  );
}
