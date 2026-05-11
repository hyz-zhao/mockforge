import { create } from 'zustand'

export const useInterviewStore = create((set, get) => ({
  sessionId: null,
  position: null,
  interviewMode: 'qa',
  totalQuestions: 0,
  questions: [],
  currentIndex: 0,
  evaluations: [],
  currentQuestion: null,
  isFinished: false,
  reportData: null,

  setInterview: (data) =>
    set({
      sessionId: data.sessionId,
      position: data.position,
      interviewMode: data.interviewMode || 'qa',
      totalQuestions: data.totalQuestions,
      questions: data.questions,
      currentIndex: 0,
      evaluations: [],
      currentQuestion: data.questions?.[0] || null,
      isFinished: false,
      reportData: null,
    }),

  setCurrentQuestion: (question) => set({ currentQuestion: question }),

  nextQuestion: () => {
    const { currentIndex, questions } = get()
    const nextIndex = currentIndex + 1
    if (nextIndex < questions.length) {
      set({
        currentIndex: nextIndex,
        currentQuestion: questions[nextIndex],
      })
    }
  },

  addEvaluation: (evaluation) =>
    set((state) => ({
      evaluations: [...state.evaluations, evaluation],
    })),

  finishInterview: () => set({ isFinished: true }),

  setReportData: (data) => set({ reportData: data }),

  reset: () =>
    set({
      sessionId: null,
      position: null,
      interviewMode: 'qa',
      totalQuestions: 0,
      questions: [],
      currentIndex: 0,
      evaluations: [],
      currentQuestion: null,
      isFinished: false,
      reportData: null,
    }),
}))
