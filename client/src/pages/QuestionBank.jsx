import React, { useState, useEffect, useCallback } from 'react';
import { Search, Database, Trash2, Edit3, Download, Save, X } from 'lucide-react';
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
      toast.success('Question updated successfully!');
    } catch {
      toast.error('Failed to update question.');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-dim)' }}>
        <div className="modal-header">
          <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.2rem', margin: 0 }}>Edit Question</h3>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}><X size={15}/></button>
        </div>
        <div className="modal-body" style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="input-group">
            <label className="input-label" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Question Prompt</label>
            <textarea className="textarea" rows={3} value={form.question}
              onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
              style={{ background: 'rgba(10, 15, 30, 0.4)', border: '1px solid var(--border-dim)', color: 'white', borderRadius: '8px', padding: '10px' }}
            />
          </div>
          {form.type === 'mcq' && (
            <div className="input-group">
              <label className="input-label" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Options (comma separated)</label>
              <input className="input" value={form.options?.join(', ') || ''}
                onChange={e => setForm(f => ({ ...f, options: e.target.value.split(',').map(s => s.trim()) }))}
                style={{ background: 'rgba(10, 15, 30, 0.4)', border: '1px solid var(--border-dim)', color: 'white', borderRadius: '8px', padding: '10px' }}
              />
            </div>
          )}
          <div className="input-group">
            <label className="input-label" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Definitive Answer</label>
            <textarea className="textarea" rows={2} value={form.answer}
              onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
              style={{ background: 'rgba(10, 15, 30, 0.4)', border: '1px solid var(--border-dim)', color: 'white', borderRadius: '8px', padding: '10px' }}
            />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div className="input-group">
              <label className="input-label" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Difficulty</label>
              <select className="select" value={form.difficulty}
                onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
                style={{ background: 'rgba(10, 15, 30, 0.4)', border: '1px solid var(--border-dim)', color: 'white', borderRadius: '8px', padding: '10px' }}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Marks</label>
              <input className="input" type="number" min={1} value={form.marks}
                onChange={e => setForm(f => ({ ...f, marks: parseInt(e.target.value) }))}
                style={{ background: 'rgba(10, 15, 30, 0.4)', border: '1px solid var(--border-dim)', color: 'white', borderRadius: '8px', padding: '10px' }}
              />
            </div>
          </div>
        </div>
        <div className="modal-footer" style={{ borderTop: 'none', paddingTop: '20px' }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ color: 'var(--text-secondary)' }}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} style={{ background: 'linear-gradient(135deg, var(--blue), var(--purple))', color: 'white', border: 'none' }}><Save size={13} style={{ marginRight: '6px' }}/> Save Changes</button>
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

      // Extract unique subjects for filter dropdown based on actual deployed questions
      if (data.questions?.length) {
        const subs = [...new Set(data.questions.map(q => q.subject).filter(Boolean))];
        setSubjects(prev => [...new Set([...prev, ...subs])]);
      }
    } catch {
      toast.error('Failed to load question bank from database');
    } finally {
      setLoading(false);
    }
  }, [page, filters, search]);

  useEffect(() => {
    const timer = setTimeout(fetchQuestions, 300);
    return () => clearTimeout(timer);
  }, [fetchQuestions]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question from your database?')) return;
    try {
      await bankAPI.delete(id);
      setQuestions(qs => qs.filter(q => q._id !== id));
      setTotal(t => t - 1);
      toast.success('Question permanently deleted.');
    } catch {
      toast.error('Failed to delete question.');
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
    a.href = url; a.download = 'examgen-question-bank.json'; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Successfully exported ${questions.length} questions as JSON.`);
  };

  return (
    <AppLayout>
      <div className="qbank-page animate-fade-in" style={{ padding: '0 16px' }}>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Master Question Bank</h1>
        </div>

        {/* Stats */}
        <div className="qbank-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label:'Total Core Questions',  value: total, color:'blue'   },
            { label:'Subject Areas',         value: subjects.length, color:'purple' },
            { label:'Objective (MCQ/TF)',    value: questions.filter(q => ['mcq','truefalse','fillblank'].includes(q.type)).length, color:'green'  },
            { label:'Descriptive (Long)',    value: questions.filter(q => ['short','long'].includes(q.type)).length, color:'amber'},
          ].map(s => (
            <div key={s.label} className="qbank-stat-pill" style={{ background: 'rgba(10, 15, 30, 0.4)', border: '1px solid var(--border-dim)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
              <span className={`qs-stat-val`} style={{ fontSize: '1.8rem', fontWeight: 700, color: `var(--${s.color})`, marginBottom: '4px' }}>{loading ? '…' : s.value}</span>
              <span className="qs-stat-label" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="qbank-toolbar" style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
          <div className="papers-search" style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', background: 'rgba(10, 15, 30, 0.6)', border: '1px solid var(--border-dim)', borderRadius: '8px', padding: '0 12px' }}>
            <Search size={16} style={{ color: 'var(--text-tertiary)', marginRight: '8px' }}/>
            <input placeholder="Search questions or keywords..."
              style={{ background: 'transparent', border: 'none', color: 'white', padding: '12px 0', width: '100%', outline: 'none' }}
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}/>
          </div>
          
          <select style={{ background: 'rgba(10, 15, 30, 0.6)', border: '1px solid var(--border-dim)', color: 'white', padding: '12px', borderRadius: '8px', outline: 'none', cursor: 'pointer' }}
            value={filters.type} onChange={e => { setFilters(f => ({ ...f, type: e.target.value })); setPage(1); }}>
            <option value="all">All Format Types</option>
            {Object.entries(TYPE_META).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>

          <select style={{ background: 'rgba(10, 15, 30, 0.6)', border: '1px solid var(--border-dim)', color: 'white', padding: '12px', borderRadius: '8px', outline: 'none', cursor: 'pointer' }}
            value={filters.difficulty} onChange={e => { setFilters(f => ({ ...f, difficulty: e.target.value })); setPage(1); }}>
            <option value="all">All Difficulties</option>
            <option value="easy">Easy Level</option>
            <option value="medium">Medium Level</option>
            <option value="hard">Hard Level</option>
          </select>

          {subjects.length > 0 && (
            <select style={{ background: 'rgba(10, 15, 30, 0.6)', border: '1px solid var(--border-dim)', color: 'white', padding: '12px', borderRadius: '8px', outline: 'none', cursor: 'pointer' }}
              value={filters.subject} onChange={e => { setFilters(f => ({ ...f, subject: e.target.value })); setPage(1); }}>
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}

          <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
            <button onClick={handleExport} disabled={questions.length === 0} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-dim)', padding: '10px 16px', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s', fontWeight: 500 }}>
              <Download size={14}/> Export JSON
            </button>
          </div>
        </div>

        <div className="papers-count" style={{ marginBottom: '16px', color: 'var(--text-tertiary)', fontSize: '13px' }}>
           {loading ? 'Loading database...' : `Showing ${questions.length} of ${total} matched questions`}
        </div>

        {/* List */}
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height:120, borderRadius:12, background: 'rgba(10,15,30,0.4)', border: '1px solid var(--border-dim)' }}/>)}
          </div>
        ) : questions.length === 0 ? (
          <div className="papers-empty" style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
            <Database size={48} style={{ opacity: 0.3, marginBottom: '16px' }}/>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Your Local Bank is Empty</h3>
            <p style={{ opacity: 0.7 }}>Generate exam papers and save approved questions to your bank to populate this.</p>
          </div>
        ) : (
          <div className="qbank-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {questions.map((q, i) => {
              const typeMeta = TYPE_META[q.type] || { label: q.type, color:'gray' };
              return (
                <div key={q._id} className="qbank-item" style={{ background: 'rgba(10, 15, 30, 0.4)', border: '1px solid var(--border-dim)', borderRadius: '12px', padding: '20px', display: 'flex', gap: '20px', transition: 'all 0.2s' }}>
                  <div className="qbank-item-body" style={{ flex: 1 }}>
                    <div className="qbank-item-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                      <span style={{ padding: '4px 10px', background: `rgba(var(--color-${typeMeta.color}-rgb, 79, 142, 247), 0.1)`, color: `var(--${typeMeta.color}, #4f8ef7)`, borderRadius: '99px', fontSize: '12px', fontWeight: 600 }}>{typeMeta.label}</span>
                      <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', color: `var(--${DIFF_COLOR[q.difficulty] || 'gray'}, #ccc)`, borderRadius: '99px', fontSize: '12px', fontWeight: 600, textTransform: 'capitalize' }}>{q.difficulty}</span>
                      {q.bloomsLevel && <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', color: `var(--${BLOOM_COLOR[q.bloomsLevel] || 'gray'}, #ccc)`, borderRadius: '99px', fontSize: '12px', fontWeight: 600 }}>{q.bloomsLevel} Level</span>}
                      {q.subject && <span style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', borderRadius: '99px', fontSize: '12px', fontWeight: 600 }}>{q.subject}</span>}
                      <span style={{ padding: '4px 10px', background: 'linear-gradient(135deg, rgba(79,142,247,0.1), rgba(157,78,255,0.1))', color: 'var(--blue-light)', borderRadius: '99px', fontSize: '12px', fontWeight: 600 }}>{q.marks} Marks</span>
                    </div>
                    
                    <p className="qbank-question" style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '16px', lineHeight: 1.5 }}>
                      <strong style={{ opacity: 0.5, marginRight: '8px' }}>Q.</strong>
                      {q.question}
                    </p>
                    
                    {q.type === 'mcq' && q.options?.length > 0 && (
                      <div className="qbank-options" style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '8px', marginBottom: '16px', marginLeft: '24px' }}>
                        {q.options.map((opt, j) => (
                          <div key={j} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-dim)', borderRadius: '6px', fontSize: '14px', color: q.answer === opt ? 'var(--green)' : 'var(--text-secondary)', fontWeight: q.answer === opt ? 600 : 400 }}>
                            {String.fromCharCode(65+j)}. {opt} {q.answer === opt && '✓'}
                          </div>
                        ))}
                      </div>
                    )}

                    {q.answer && q.type !== 'mcq' && (
                      <div className="qbank-answer" style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.05)', borderLeft: '3px solid var(--green)', borderRadius: '0 8px 8px 0' }}>
                        <span style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--green)', marginBottom: '4px' }}>Correct Answer Breakdown:</span>
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{q.answer}</span>
                      </div>
                    )}
                  </div>

                  <div className="qbank-item-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button onClick={() => setEditing(q)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px', borderRadius: '6px' }} title="Edit Customization">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => handleDelete(q._id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px', borderRadius: '6px' }} title="Permanently Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Options */}
        {total > 30 && !loading && (
          <div className="pagination" style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '16px', alignItems: 'center' }}>
            <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-dim)', padding: '8px 16px', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer' }} disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Page {page} of {Math.ceil(total / 30)}</span>
            <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-dim)', padding: '8px 16px', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer' }} disabled={page >= Math.ceil(total / 30)} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        )}

        {/* Edit modal */}
        {editing && <EditModal question={editing} onSave={handleUpdate} onClose={() => setEditing(null)}/>}

      </div>
    </AppLayout>
  );
}
