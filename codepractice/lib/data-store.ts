import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Question {
  id: string;
  serial: number;
  title: string;
  slug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  acceptance: string;
  frequency: number;
  link: string;
  companies: string[];
  timeframes: Record<string, string>;
  topics: string[];
}

export interface TodoItem {
  id: string;
  title: string;
  type: 'question' | 'topic';
  slug: string;
  completed: boolean;
  addedAt: string;
  completedAt: string | null;
}

export interface TodoList {
  id: string;
  name: string;
  items: TodoItem[];
}

// Planner: a task tied to a specific date (YYYY-MM-DD)
export interface PlannerTask {
  id: string;
  title: string;
  date: string;      // "YYYY-MM-DD"
  completed: boolean;
  createdAt: string;
}

export interface PomodoroState {
  timeLeft: number;
  isRunning: boolean;
  mode: 'focus' | 'shortBreak' | 'longBreak';
  isDocked: boolean;
  customFocusMin?: number;
  customShortMin?: number;
  customLongMin?: number;
}

interface DataState {
  questions: Question[];
  companies: { slug: string; displayName: string; count: number }[];
  topics: { name: string; slug: string; count: number }[];
  initialized: boolean;
  loading: boolean;

  completedQuestions: string[];
  completionDates: Record<string, string>; // Maps slug to ISO date string
  todoLists: TodoList[];

  // Planner state
  plannerTasks: PlannerTask[];
  // Free-text note tiles keyed by a string like:
  //   "day-notes-YYYY-MM-DD"
  //   "week-priority-YYYY-WNN"
  //   "month-focus-YYYY-MM"  | "month-projects-YYYY-MM" | "month-goals-YYYY-MM" | "month-notes-YYYY-MM"
  //   "quarter-notes-YYYY-QN-MM"  (MM = month within quarter)
  //   "year-notes-YYYY-MM"
  plannerNotes: Record<string, string>;

  // Pomodoro state
  pomodoro: PomodoroState;

  // Actions
  initData: () => Promise<void>;
  toggleQuestionCompletion: (slug: string) => void;
  addToList: (listId: string, item: Omit<TodoItem, 'id' | 'completed' | 'addedAt' | 'completedAt'>) => void;
  removeFromList: (listId: string, itemId: string) => void;
  toggleItem: (listId: string, itemId: string) => void;
  createList: (name: string) => void;
  deleteList: (listId: string) => void;

  // Planner actions
  addPlannerTask: (date: string, title: string) => void;
  togglePlannerTask: (id: string) => void;
  deletePlannerTask: (id: string) => void;
  setPlannerNote: (key: string, value: string) => void;

  setPomodoro: (update: Partial<PomodoroState>) => void;
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      questions: [],
      companies: [],
      topics: [],
      initialized: false,
      loading: false,
      completedQuestions: [],
      completionDates: {},
      todoLists: [
        { id: 'daily', name: 'Daily Goals', items: [] },
        { id: 'weekly', name: 'Weekly Goals', items: [] },
      ],

      plannerTasks: [],
      plannerNotes: {},

      pomodoro: {
        timeLeft: 25 * 60,
        isRunning: false,
        mode: 'focus',
        isDocked: true,
        customFocusMin: undefined,
        customShortMin: undefined,
        customLongMin: undefined,
      },

      initData: async () => {
        if (get().initialized) return;
        set({ loading: true });
        try {
          const res = await fetch('/data/questions.json');
          if (!res.ok) throw new Error("Failed to fetch data");
          const data = await res.json();
          set({
            questions: data.questions,
            companies: data.companies,
            topics: data.topics,
            initialized: true
          });
        } catch (error) {
          console.error("Failed to load questions:", error);
        } finally {
          set({ loading: false });
        }
      },

      toggleQuestionCompletion: (slug) => {
        set((state) => {
          const isCompleting = !state.completedQuestions.includes(slug);
          const newDates = { ...state.completionDates };
          if (isCompleting) {
            newDates[slug] = new Date().toISOString();
          } else {
            delete newDates[slug];
          }

          return {
            completedQuestions: isCompleting
              ? [...state.completedQuestions, slug]
              : state.completedQuestions.filter(s => s !== slug),
            completionDates: newDates,
          };
        });
      },

      addToList: (listId, item) => {
        set((state) => ({
          todoLists: state.todoLists.map((list) =>
            list.id === listId
              ? {
                  ...list,
                  items: [
                    ...list.items,
                    {
                      ...item,
                      id: Math.random().toString(36).substr(2, 9),
                      completed: false,
                      addedAt: new Date().toISOString(),
                      completedAt: null,
                    },
                  ],
                }
              : list
          ),
        }));
      },

      removeFromList: (listId, itemId) => {
        set((state) => ({
          todoLists: state.todoLists.map((list) =>
            list.id === listId
              ? { ...list, items: list.items.filter((i) => i.id !== itemId) }
              : list
          ),
        }));
      },

      toggleItem: (listId, itemId) => {
        set((state) => ({
          todoLists: state.todoLists.map((list) =>
            list.id === listId
              ? {
                  ...list,
                  items: list.items.map((i) => {
                    if (i.id === itemId) {
                      const willBeCompleted = !i.completed;
                      return {
                        ...i,
                        completed: willBeCompleted,
                        completedAt: willBeCompleted ? new Date().toISOString() : null
                      };
                    }
                    return i;
                  }),
                }
              : list
          ),
        }));
      },

      createList: (name) => {
        set((state) => ({
          todoLists: [
            ...state.todoLists,
            { id: name.toLowerCase().replace(/\s+/g, '-'), name, items: [] },
          ],
        }));
      },

      deleteList: (listId) => {
        set((state) => ({
          todoLists: state.todoLists.filter((list) => list.id !== listId),
        }));
      },

      // ── Planner actions ───────────────────────────────────────────────
      addPlannerTask: (date, title) => {
        set((state) => ({
          plannerTasks: [
            ...state.plannerTasks,
            {
              id: Math.random().toString(36).substr(2, 9),
              title,
              date,
              completed: false,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      },

      togglePlannerTask: (id) => {
        set((state) => ({
          plannerTasks: state.plannerTasks.map((t) =>
            t.id === id ? { ...t, completed: !t.completed } : t
          ),
        }));
      },

      deletePlannerTask: (id) => {
        set((state) => ({
          plannerTasks: state.plannerTasks.filter((t) => t.id !== id),
        }));
      },

      setPlannerNote: (key, value) => {
        set((state) => ({
          plannerNotes: { ...state.plannerNotes, [key]: value },
        }));
      },

      setPomodoro: (update) => {
        set((state) => ({
          pomodoro: { ...state.pomodoro, ...update },
        }));
      },
    }),
    {
      name: 'code-practice-storage',
      partialize: (state) => ({
        todoLists: state.todoLists,
        completedQuestions: state.completedQuestions,
        plannerTasks: state.plannerTasks,
        plannerNotes: state.plannerNotes,
        pomodoro: state.pomodoro,
      }),
    }
  )
);
