import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Search, Plus, Download, Eye, Trash2,
  Copy, MoreHorizontal, Calendar, Hash, Clock, Loader2, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import AppLayout from '../components/layout/AppLayout';
import { papersAPI } from '../utils/api';
import './Papers.css';

const STATUS_META = {
  finalized:  { label:'Finalized',  cls:'badge-green' },
  draft:      { label:'Draft',      cls:'badge-amber' },
  generating: { label:'Generating', cls:'badge-blue'  },
};

function PaperCard({ paper, onDelete, onDuplicate, onExport, onView }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const meta = STATUS_META[paper.status] || STATUS_META.draft;

  return (
    <div className="paper-card">
      <div className="paper-card-top">
        <div className="paper-card-icon"><FileText size={20}/></div>
        <div className="paper-card-meta">
          <span className={`badge ${meta.cls} badge-dot`}>{meta.label}</span>
          <span className="badge badge-gray">{paper.subjectCode || paper.subject}</span>
        </div>
        <div className="paper-card-menu">
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setMenuOpen(o => !o)}>
            <MoreHorizontal size={15}/>
          </button>
          {menuOpen && (
            <div className="dropdown-menu" onMouseLeave={() => setMenuOpen(false)}>
              <button className="dropdown-item" onClick={() => { onExport(paper._id, 'json'); setMenuOpen(false); }}>
                <Download size={13}/> Export JSON
              </button>
              <button className="dropdown-item" onClick={() => { onDuplicate(paper._id); setMenuOpen(false); }}>
                <Copy size={13}/> Duplicate
              </button>
              <div className="dropdown-divider"/>
              <button className="dropdown-item danger" onClick={() => { onDelete(paper._id); setMenuOpen(false); }}>
                <Trash2 size={13}/> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <h3 className="paper-card-title">{paper.title}</h3>
      <p className="paper-card-subject">{paper.subject}</p>

      <div className="paper-card-stats">
        <div className="paper-stat"><Hash size={12}/>{paper.questions?.length ?? 0} questions</div>
        <div className="paper-stat"><span className="paper-stat-sep">·</span>{paper.totalMarks} marks</div>
        <div className="paper-stat"><Clock size={12}/>{paper.duration}h</div>
      </div>

      <div className="paper-card-footer">
        <span className="paper-date">
          <Calendar size={11}/>
          {new Date(paper.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
        </span>
        <div className="paper-card-actions">
          <button className="btn btn-ghost btn-sm" onClick={() => onExport(paper._id, 'json')} title="Download">
            <Download size={13}/>
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => onView(paper._id)}>
            <Eye size={13}/> View
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Papers() {
  const [papers, setPapers]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [view, setView]               = useState('grid');
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [viewPaperId, setViewPaperId] = useState(null);
  const [viewedPaper, setViewedPaper] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  const handleView = async (id) => {
    setViewPaperId(id);
    setViewLoading(true);
    try {
      const { data } = await papersAPI.getOne(id);
      setViewedPaper(data.paper);
    } catch {
      toast.error('Failed to load paper details');
      setViewPaperId(null);
    } finally {
      setViewLoading(false);
    }
  };

  const fetchPapers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search.trim())          params.search = search.trim();
      const { data } = await papersAPI.getAll(params);
      setPapers(data.papers || []);
      setTotal(data.total  || 0);
    } catch (err) {
      toast.error('Failed to load papers');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    const timer = setTimeout(fetchPapers, 300);
    return () => clearTimeout(timer);
  }, [fetchPapers]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this paper? This cannot be undone.')) return;
    try {
      await papersAPI.delete(id);
      setPapers(ps => ps.filter(p => p._id !== id));
      setTotal(t => t - 1);
      toast.success('Paper deleted');
    } catch {
      toast.error('Failed to delete paper');
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const { data } = await papersAPI.duplicate(id);
      setPapers(ps => [data.paper, ...ps]);
      setTotal(t => t + 1);
      toast.success('Paper duplicated');
    } catch {
      toast.error('Failed to duplicate paper');
    }
  };

  const handleExport = async (id, format) => {
    try {
      const { data } = await papersAPI.export(id, format);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `paper-${id}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Paper exported');
    } catch {
      toast.error('Export failed');
    }
  };

  return (
    <AppLayout>
      <div className="papers-page animate-fade-in">

        {/* Toolbar */}
        <div className="papers-toolbar">
          <div className="papers-search">
            <Search size={14} className="papers-search-icon"/>
            <input
              className="papers-search-input"
              placeholder="Search papers by title or subject…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="papers-filters">
            {['all','finalized','draft'].map(s => (
              <button key={s}
                className={`filter-chip ${statusFilter === s ? 'active' : ''}`}
                onClick={() => { setStatusFilter(s); setPage(1); }}>
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <div className="papers-toolbar-right">
            <div className="view-toggle">
              <button className={view === 'grid' ? 'active' : ''} onClick={() => setView('grid')}>⊞</button>
              <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>☰</button>
            </div>
            <Link to="/generate" className="btn btn-primary btn-sm">
              <Plus size={14}/> New Paper
            </Link>
          </div>
        </div>

        <div className="papers-count">
          {loading ? 'Loading…' : `Showing ${papers.length} of ${total} papers`}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="papers-grid">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="skeleton" style={{ height:200, borderRadius:16 }}/>
            ))}
          </div>
        ) : papers.length === 0 ? (
          <div className="papers-empty">
            <FileText size={48}/>
            <h3>{search ? 'No papers found' : 'No papers yet'}</h3>
            <p>{search ? 'Try a different search term' : 'Generate your first exam paper to get started'}</p>
            <Link to="/generate" className="btn btn-primary">
              <Plus size={15}/> Generate Paper
            </Link>
          </div>
        ) : (
          <div className={`papers-grid ${view === 'list' ? 'list-view' : ''}`}>
            {papers.map(paper => (
              <PaperCard
                key={paper._id}
                paper={paper}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onExport={handleExport}
                onView={handleView}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && !loading && (
          <div className="pagination">
            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              Previous
            </button>
            <span className="page-info">Page {page} of {Math.ceil(total / 20)}</span>
            <button className="btn btn-secondary btn-sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}>
              Next
            </button>
          </div>
        )}

        {viewPaperId && (
          <div className="modal-backdrop" onClick={() => { setViewPaperId(null); setViewedPaper(null); }}>
            <div className="modal" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2 style={{ fontSize: '18px', marginBottom: '4px' }}>{viewedPaper?.title || 'Loading Paper...'}</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{viewedPaper?.subject}</p>
                </div>
                <button className="btn btn-ghost btn-icon" onClick={() => { setViewPaperId(null); setViewedPaper(null); }}>
                  <X size={18}/>
                </button>
              </div>
              <div className="modal-body">
                {viewLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader2 size={30} className="animate-spin" /></div>
                ) : viewedPaper?.questions ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {viewedPaper.questions.map((q, i) => (
                      <div key={q._id || i} style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 600, fontSize: '14px' }}>Q{i+1}. <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: '12px', marginLeft: '8px' }}>{q.type.toUpperCase()} · {q.marks} Marks</span></span>
                        </div>
                        <p style={{ fontSize: '14px', lineHeight: 1.5, marginBottom: '12px', whiteSpace: 'pre-wrap' }}>{q.question}</p>
                        {q.type === 'mcq' && q.options && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                            {q.options.map((opt, j) => (
                              <div key={j} style={{ padding: '8px 12px', background: 'var(--bg-surface)', border: `1px solid ${q.answer === opt ? 'var(--green)' : 'var(--border-strong)'}`, borderRadius: 'var(--radius-sm)', fontSize: '13px', color: q.answer === opt ? 'var(--green)' : 'var(--text-primary)' }}>
                                {String.fromCharCode(65+j)}. {opt}
                              </div>
                            ))}
                          </div>
                        )}
                        {q.type !== 'mcq' && q.answer && (
                          <div style={{ padding: '12px', background: 'rgba(16,185,129,0.05)', borderLeft: '3px solid var(--green)', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', fontSize: '13px', whiteSpace: 'pre-wrap' }}>
                            <strong style={{ color: 'var(--green)', display: 'block', marginBottom: '4px' }}>Answer Key:</strong>
                            {q.answer}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No questions found.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
