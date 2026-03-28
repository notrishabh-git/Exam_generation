import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Auth store
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    { name: 'examgen-auth' }
  )
);

// UI store
export const useUIStore = create((set) => ({
  sidebarCollapsed: false,
  activePage: 'dashboard',
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setActivePage: (page) => set({ activePage: page }),
}));

// Generator store - tracks current paper generation
export const useGeneratorStore = create((set, get) => ({
  // Uploaded files / topics
  sources: [],           // [{ id, type: 'file'|'topic', name, content, topics:[] }]
  
  // Config
  config: {
    subject: '',
    subjectCode: '',
    institution: '',
    duration: 3,
    totalMarks: 100,
    questionTypes: {
      mcq:       { enabled: true,  count: 10, marksEach: 2 },
      short:     { enabled: true,  count: 5,  marksEach: 4 },
      long:      { enabled: true,  count: 3,  marksEach: 10 },
      truefalse: { enabled: false, count: 5,  marksEach: 1 },
      fillblank: { enabled: false, count: 5,  marksEach: 1 },
    },
    difficulty:      'mixed',   // easy | medium | hard | mixed
    bloomsEnabled:   true,
    answerKeyEnabled: true,
    generateVariants: false,
    variantCount: 2,
  },

  // Generated questions
  questions: [],         // [{ id, topic, type, question, options, answer, marks, difficulty, bloomsLevel, approved }]
  generatingIds: [],     // question IDs currently regenerating
  
  // Generation status
  status: 'idle',       // idle | extracting | generating | done | error
  progress: 0,
  statusMessage: '',

  // Paper metadata
  paperTitle: '',
  draftId: null,
  
  // Actions
  setDraftId: (draftId) => set({ draftId }),
  addSource: (source) => set((s) => ({ sources: [...s.sources, source] })),
  removeSource: (id) => set((s) => ({ sources: s.sources.filter(x => x.id !== id) })),
  
  setConfig: (patch) => set((s) => ({ config: { ...s.config, ...patch } })),
  setQTypeConfig: (type, patch) => set((s) => ({
    config: {
      ...s.config,
      questionTypes: {
        ...s.config.questionTypes,
        [type]: { ...s.config.questionTypes[type], ...patch },
      },
    },
  })),

  setQuestions: (questions) => set({ questions }),
  updateQuestion: (id, patch) => set((s) => ({
    questions: s.questions.map(q => q.id === id ? { ...q, ...patch } : q),
  })),
  removeQuestion: (id) => set((s) => ({ questions: s.questions.filter(q => q.id !== id) })),
  toggleApproved: (id) => set((s) => ({
    questions: s.questions.map(q => q.id === id ? { ...q, approved: !q.approved } : q),
  })),
  reorderQuestions: (questions) => set({ questions }),

  setGenerating: (id, isGenerating) => set((s) => ({
    generatingIds: isGenerating
      ? [...s.generatingIds, id]
      : s.generatingIds.filter(x => x !== id),
  })),

  setStatus: (status, message = '', progress = 0) =>
    set({ status, statusMessage: message, progress }),

  reset: () => set({
    sources: [],
    questions: [],
    status: 'idle',
    progress: 0,
    statusMessage: '',
    generatingIds: [],
    paperTitle: '',
    draftId: null,
  }),
}));

// Question Bank store
export const useQuestionBankStore = create((set) => ({
  filters: { type: 'all', difficulty: 'all', subject: '', search: '' },
  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
}));
