import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Upload, FileText, File, X, Plus, ChevronRight,
  ChevronLeft, Zap, Settings2, Eye, BookOpen,
  Hash, Clock, Target, ToggleLeft, AlertCircle,
  Check, Loader2
} from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { useGeneratorStore } from '../store';
import { generateAPI } from '../utils/api';
import QuestionReview from '../components/questions/QuestionReview';
import './Generate.css';

const STEPS = [
  { id: 1, label: 'Upload Sources',  icon: Upload },
  { id: 2, label: 'Configure',       icon: Settings2 },
  { id: 3, label: 'Review & Export', icon: Eye },
];

const QUESTION_TYPES = [
  { key: 'mcq',       label: 'Multiple Choice',     desc: '4 options, 1 correct',     color: 'blue'   },
  { key: 'short',     label: 'Short Answer',         desc: '2–5 marks descriptive',    color: 'green'  },
  { key: 'long',      label: 'Long Answer',          desc: 'Essay / detailed',         color: 'purple' },
  { key: 'truefalse', label: 'True / False',         desc: 'With justification',       color: 'amber'  },
  { key: 'fillblank', label: 'Fill in the Blank',    desc: 'Contextual gaps',          color: 'teal'   },
];

const DIFFICULTY_OPTIONS = [
  { value: 'easy',   label: 'Easy',   color: 'green'  },
  { value: 'medium', label: 'Medium', color: 'amber'  },
  { value: 'hard',   label: 'Hard',   color: 'red'    },
  { value: 'mixed',  label: 'Mixed',  color: 'blue'   },
];

// ─── Step 1: Source Upload ───────────────────────────────────────────────────
function StepSources() {
  const { sources, addSource, removeSource } = useGeneratorStore();
  const [topicInput, setTopicInput] = useState('');

  const onDrop = useCallback(async (accepted) => {
    for (const file of accepted) {
      const id = `file-${Date.now()}-${Math.random()}`;
      addSource({ id, type: 'file', name: file.name, file, topics: [] });
    }
    toast.success(`${accepted.length} file(s) added`);
  }, [addSource]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 20 * 1024 * 1024,
  });

  const addTopic = () => {
    if (!topicInput.trim()) return;
    const id = `topic-${Date.now()}`;
    addSource({ id, type: 'topic', name: topicInput.trim(), content: topicInput.trim(), topics: [topicInput.trim()] });
    setTopicInput('');
  };

  const getFileIcon = (name) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <span className="file-ext ext-pdf">PDF</span>;
    if (['ppt', 'pptx'].includes(ext)) return <span className="file-ext ext-ppt">PPT</span>;
    if (['doc', 'docx'].includes(ext)) return <span className="file-ext ext-doc">DOC</span>;
    return <span className="file-ext ext-txt">TXT</span>;
  };

  return (
    <div className="step-content">
      <div className="step-section">
        <div className="step-section-title">
          <Upload size={15} />
          Upload Files
          <span className="badge badge-gray">PDF, PPTX, DOCX</span>
        </div>
        <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
          <input {...getInputProps()} />
          <div className="dropzone-inner">
            <div className="dropzone-icon">
              <Upload size={28} />
            </div>
            <p className="dropzone-text">
              {isDragActive ? 'Drop files here...' : 'Drag & drop files here, or click to browse'}
            </p>
            <p className="dropzone-hint">PDF, PPTX, PPT, DOCX — max 20MB each</p>
            <button className="btn btn-secondary btn-sm" type="button">Choose Files</button>
          </div>
        </div>
      </div>

      <div className="step-section">
        <div className="step-section-title">
          <BookOpen size={15} />
          Add Topics Manually
        </div>
        <div className="topic-input-row">
          <input
            className="input"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTopic()}
            placeholder="e.g. Binary Search Trees — Insertion and Deletion"
          />
          <button className="btn btn-primary" onClick={addTopic} disabled={!topicInput.trim()}>
            <Plus size={14} /> Add Topic
          </button>
        </div>
        <p className="hint-text">Press Enter or click Add Topic. Be specific for better questions.</p>
      </div>

      {sources.length > 0 && (
        <div className="step-section">
          <div className="step-section-title">
            <FileText size={15} />
            Sources Added
            <span className="badge badge-blue">{sources.length}</span>
          </div>
          <div className="source-list">
            {sources.map((src) => (
              <div key={src.id} className="source-item">
                {src.type === 'file' ? getFileIcon(src.name) : <span className="file-ext ext-topic">TOPIC</span>}
                <div className="source-info">
                  <span className="source-name">{src.name}</span>
                  <span className="source-meta">{src.type === 'file' ? 'Will be parsed for topics' : 'Manual topic'}</span>
                </div>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => removeSource(src.id)}>
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Configuration ────────────────────────────────────────────────────
function StepConfigure() {
  const { config, setConfig, setQTypeConfig } = useGeneratorStore();

  const totalQuestions = Object.values(config.questionTypes)
    .filter(t => t.enabled)
    .reduce((s, t) => s + t.count, 0);

  const totalMarksCalc = Object.values(config.questionTypes)
    .filter(t => t.enabled)
    .reduce((s, t) => s + t.count * t.marksEach, 0);

  return (
    <div className="step-content">
      {/* Paper metadata */}
      <div className="step-section">
        <div className="step-section-title"><FileText size={15}/>Paper Details</div>
        <div className="config-grid">
          <div className="input-group">
            <label className="input-label">Subject Name *</label>
            <input className="input" placeholder="e.g. Data Structures and Algorithms"
              value={config.subject}
              onChange={e => setConfig({ subject: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Subject Code</label>
            <input className="input" placeholder="e.g. CS301"
              value={config.subjectCode}
              onChange={e => setConfig({ subjectCode: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Institution / College</label>
            <input className="input" placeholder="e.g. AISSMS IOIT"
              value={config.institution}
              onChange={e => setConfig({ institution: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Duration (hours)</label>
            <input className="input" type="number" min="0.5" max="6" step="0.5"
              value={config.duration}
              onChange={e => setConfig({ duration: parseFloat(e.target.value) })}
            />
          </div>
        </div>
      </div>

      {/* Question types */}
      <div className="step-section">
        <div className="step-section-title">
          <Hash size={15}/>Question Types
          <span className="badge badge-gray">{totalQuestions} total · {totalMarksCalc} marks</span>
        </div>
        <div className="qtype-grid">
          {QUESTION_TYPES.map(({ key, label, desc, color }) => {
            const cfg = config.questionTypes[key];
            return (
              <div key={key} className={`qtype-card ${cfg.enabled ? `active-${color}` : ''}`}>
                <div className="qtype-header">
                  <div className="qtype-info">
                    <span className={`badge badge-${color}`}>{label}</span>
                    <span className="qtype-desc">{desc}</span>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" checked={cfg.enabled}
                      onChange={e => setQTypeConfig(key, { enabled: e.target.checked })} />
                    <span className="toggle-track" />
                    <span className="toggle-thumb" />
                  </label>
                </div>
                {cfg.enabled && (
                  <div className="qtype-controls">
                    <div className="qtype-control">
                      <span className="qtype-control-label">Count</span>
                      <div className="number-input">
                        <button onClick={() => setQTypeConfig(key, { count: Math.max(1, cfg.count - 1) })}>−</button>
                        <span>{cfg.count}</span>
                        <button onClick={() => setQTypeConfig(key, { count: cfg.count + 1 })}>+</button>
                      </div>
                    </div>
                    <div className="qtype-control">
                      <span className="qtype-control-label">Marks each</span>
                      <div className="number-input">
                        <button onClick={() => setQTypeConfig(key, { marksEach: Math.max(1, cfg.marksEach - 1) })}>−</button>
                        <span>{cfg.marksEach}</span>
                        <button onClick={() => setQTypeConfig(key, { marksEach: cfg.marksEach + 1 })}>+</button>
                      </div>
                    </div>
                    <div className="qtype-subtotal">
                      = {cfg.count * cfg.marksEach} marks
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Difficulty + options */}
      <div className="step-section">
        <div className="step-section-title"><Target size={15}/>Difficulty & Options</div>
        <div className="config-row">
          <div className="input-group" style={{ flex: 1 }}>
            <label className="input-label">Difficulty Level</label>
            <div className="difficulty-options">
              {DIFFICULTY_OPTIONS.map(opt => (
                <button key={opt.value}
                  className={`diff-btn diff-${opt.color} ${config.difficulty === opt.value ? 'active' : ''}`}
                  onClick={() => setConfig({ difficulty: opt.value })}>
                  {config.difficulty === opt.value && <Check size={12}/>}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="options-grid">
          {[
            { key: 'bloomsEnabled',    label: "Bloom's Taxonomy Tags",   desc: 'Tag each question with cognitive level' },
            { key: 'answerKeyEnabled', label: 'Generate Answer Key',      desc: 'Include answers with the paper' },
            { key: 'generateVariants', label: 'Multiple Variants',        desc: 'Generate Set A, Set B, etc.' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="option-row">
              <div>
                <div className="option-label">{label}</div>
                <div className="option-desc">{desc}</div>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={config[key]}
                  onChange={e => setConfig({ [key]: e.target.checked })} />
                <span className="toggle-track" />
                <span className="toggle-thumb" />
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Generate Page ───────────────────────────────────────────────────────
export default function Generate() {
  const [step, setStep] = useState(1);
  const { sources, config, status, progress, statusMessage, setStatus, setQuestions, reset } = useGeneratorStore();
  const navigate = useNavigate();

  const canProceed = () => {
    if (step === 1) return sources.length > 0;
    if (step === 2) return config.subject.trim().length > 0;
    return true;
  };

  const handleGenerate = async () => {
    setStatus('extracting', 'Extracting topics from sources…', 10);
    try {
      const formData = new FormData();
      sources.forEach(src => {
        if (src.type === 'file') formData.append('files', src.file);
        else formData.append('topics[]', src.name);
      });

      let topics = [];
      try {
        const { data } = await generateAPI.extractTopics(formData);
        topics = data.topics;
        setStatus('generating', 'Generating questions with AI…', 35);
      } catch {
        // Fallback: use source names as topics
        topics = sources.map(s => s.name);
        setStatus('generating', 'Generating questions with AI…', 35);
      }

      const { data } = await generateAPI.generateQuestions({ topics, config });
      setQuestions(data.questions);

      try {
        const { papersAPI } = await import('../utils/api');
        const res = await papersAPI.create({
          title: `${config.subject} — Examination (Draft)`,
          subject: config.subject,
          subjectCode: config.subjectCode,
          institution: config.institution,
          duration: config.duration,
          totalMarks: data.questions.reduce((s, q) => s + q.marks, 0),
          questions: data.questions,
          config,
          status: 'draft'
        });
        useGeneratorStore.getState().setDraftId(res.data.paper._id);
      } catch (e) {
        console.error('Auto-save failed', e);
      }

      setStatus('done', 'Questions ready!', 100);
      setStep(3);
    } catch (err) {
      setStatus('error', err.message || 'Generation failed', 0);
      toast.error('Generation failed. Please try again.');
    }
  };

  const handleNext = () => {
    if (step === 2) {
      handleGenerate();
    } else if (step < 3) {
      setStep(s => s + 1);
    }
  };

  return (
    <AppLayout>
      <div className="generate-page animate-fade-in">
        {/* Stepper */}
        <div className="stepper">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className={`step-pill ${step === s.id ? 'active' : step > s.id ? 'done' : ''}`}
                onClick={() => step > s.id && setStep(s.id)}>
                <span className="step-num">
                  {step > s.id ? <Check size={13}/> : s.id}
                </span>
                <span className="step-label">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`step-connector ${step > s.id ? 'done' : ''}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Progress bar during generation */}
        {status === 'generating' || status === 'extracting' ? (
          <div className="generation-overlay">
            <div className="gen-card">
              <div className="gen-spinner"><Loader2 size={36} className="animate-spin" /></div>
              <h3>{statusMessage}</h3>
              <div className="progress-bar" style={{ marginTop: 12 }}>
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
              <p className="gen-hint">This usually takes 20–40 seconds…</p>
            </div>
          </div>
        ) : (
          <>
            {/* Step content */}
            <div className="step-wrapper">
              {step === 1 && <StepSources />}
              {step === 2 && <StepConfigure />}
              {step === 3 && <QuestionReview />}
            </div>

            {/* Navigation */}
            {step < 3 && (
              <div className="step-nav">
                <button className="btn btn-secondary" onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/dashboard')} disabled={status === 'generating'}>
                  <ChevronLeft size={15}/> {step === 1 ? 'Cancel' : 'Back'}
                </button>
                <div className="step-nav-info">
                  {step === 1 && sources.length > 0 && (
                    <span className="badge badge-blue">{sources.length} source{sources.length > 1 ? 's' : ''} ready</span>
                  )}
                </div>
                <button className="btn btn-primary btn-lg" onClick={handleNext} disabled={!canProceed() || status === 'generating'}>
                  {step === 2 ? (
                    <><Zap size={16}/> Generate Paper</>
                  ) : (
                    <>Next <ChevronRight size={15}/></>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
