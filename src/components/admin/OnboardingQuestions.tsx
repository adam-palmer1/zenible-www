import React, { useState, useEffect } from 'react';
import adminAPI from '../../services/adminAPI';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Bars3Icon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface QuestionType {
  value: string;
  label: string;
  icon: string;
}

interface ValidationTypes {
  [key: string]: string[];
}

interface SortableQuestionItemProps {
  question: any;
  onEdit: (question: any) => void;
  onDelete: (question: any) => void;
}

interface DeleteWarning {
  answerCount: number;
  message: string;
}

interface FormData {
  question_text: string;
  question_code: string;
  question_type: string;
  is_required: boolean;
  is_active: boolean;
  placeholder: string;
  default_value: string;
  options: string[];
  validation_rules: any;
  metadata: any;
  help_text: string;
  depends_on: any;
  display_order: number;
  page_number: number;
}

const QUESTION_TYPES: QuestionType[] = [
  { value: 'short_text', label: 'Short Text', icon: '📝' },
  { value: 'long_text', label: 'Long Text', icon: '📄' },
  { value: 'select', label: 'Dropdown', icon: '📋' },
  { value: 'multi_select', label: 'Multi-Select', icon: '☑️' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'boolean', label: 'Yes/No', icon: '✓' },
  { value: 'rich_text', label: 'Rich Text', icon: '📃' },
  { value: 'url', label: 'URL', icon: '🔗' },
];

const VALIDATION_TYPES: ValidationTypes = {
  short_text: ['min_length', 'max_length', 'regex'],
  long_text: ['min_length', 'max_length'],
  number: ['min_value', 'max_value'],
  rich_text: ['min_length', 'max_length'],
  url: ['allowed_domains'],
};

/**
 * Sortable Question Item Component
 */
const SortableQuestionItem = ({ question, onEdit, onDelete }: SortableQuestionItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const typeInfo = QUESTION_TYPES.find((t) => t.value === question.question_type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`px-6 py-4 hover:bg-gray-50 ${isDragging ? 'shadow-lg ring-2 ring-purple-500 bg-white' : ''}`}
    >
      <div className="flex items-center gap-4">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab text-gray-400 hover:text-gray-600"
        >
          <Bars3Icon className="h-5 w-5" />
        </div>

        {/* Question Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">{typeInfo?.icon || '?'}</span>
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {question.question_text}
            </h4>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">
              Code: {question.question_code}
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">
              Page {question.page_number || 1}, Order {question.display_order || 0}
            </span>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2">
          {question.is_required && (
            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
              Required
            </span>
          )}
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              question.is_active
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {question.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(question)}
            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="Edit"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(question)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function OnboardingQuestions() {
  const [activeTab, setActiveTab] = useState<string>('questions');
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [setSelectedQuestion] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [questionToDelete, setQuestionToDelete] = useState<any>(null);
  const [deleteWarning, setDeleteWarning] = useState<DeleteWarning | null>(null); // Stores warning about existing answers
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [statistics, setStatistics] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [answersPage, setAnswersPage] = useState<number>(1);
  const [totalAnswers, setTotalAnswers] = useState<number>(0);

  // Form states for creating/editing questions
  const [formData, setFormData] = useState<FormData>({
    question_text: '',
    question_code: '',
    question_type: 'short_text',
    is_required: true,
    is_active: true,
    placeholder: '',
    default_value: '',
    options: [],
    validation_rules: {},
    metadata: {},
    help_text: '',
    depends_on: null,
    display_order: 0,
    page_number: 1,
  });

  const [newOption, setNewOption] = useState<string>('');
  const [editingQuestion, setEditingQuestion] = useState<any>(null);

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    if (activeTab === 'statistics') {
      loadStatistics();
    }
  }, [activeTab]);

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await (adminAPI as any).getAllCustomizationQuestions({ include_inactive: true });
      setQuestions(data.questions || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to load questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const stats = await (adminAPI as any).getCustomizationQuestionsStats();
      setStatistics(stats);

      // Load recent answers - Since getAllAnswers doesn't exist, we'll need to handle this differently
      // For now, just set empty answers
      setAnswers([]);
      setTotalAnswers(0);
    } catch (err: any) {
      console.error('Failed to load statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async () => {
    if (!formData.question_text.trim()) {
      setError('Question text is required');
      return;
    }
    if (!formData.question_code.trim()) {
      setError('Question code is required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const questionData = {
        question_text: formData.question_text,
        question_code: formData.question_code,
        question_type: formData.question_type,
        is_required: formData.is_required,
        is_active: formData.is_active,
        display_order: formData.display_order,
        page_number: formData.page_number,
        default_value: formData.default_value,
        validation_rules: formData.validation_rules,
        metadata: {
          ...formData.metadata,
          ...(formData.placeholder && { placeholder: formData.placeholder }),
          ...(formData.help_text && { help_text: formData.help_text }),
        },
        options: formData.question_type === 'select' || formData.question_type === 'multi_select'
          ? formData.options
          : undefined,
      };

      if (editingQuestion) {
        await (adminAPI as any).updateCustomizationQuestion(editingQuestion.id, questionData);
      } else {
        await (adminAPI as any).createCustomizationQuestion(questionData);
      }

      await loadQuestions();
      resetForm();
      setActiveTab('questions');
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to save question:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (forceDelete: boolean = false) => {
    if (!questionToDelete) return;

    setDeleteLoading(true);
    try {
      await (adminAPI as any).deleteCustomizationQuestion(questionToDelete.id, forceDelete);
      await loadQuestions();
      setShowDeleteModal(false);
      setQuestionToDelete(null);
      setDeleteWarning(null);
    } catch (err: any) {
      // Check if the error is about existing answers
      const errorMessage = err.message || '';
      const existingAnswersMatch = errorMessage.match(/(\d+) existing answers?/i);

      if (existingAnswersMatch && !forceDelete) {
        // Show warning about existing answers
        const answerCount = parseInt(existingAnswersMatch[1], 10);
        setDeleteWarning({
          answerCount,
          message: `This question has ${answerCount} existing user answer${answerCount === 1 ? '' : 's'}. Deleting it will also remove ${answerCount === 1 ? 'this answer' : 'these answers'}.`
        });
      } else {
        setError(err.message);
        console.error('Failed to delete question:', err);
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);

    const items = arrayMove(questions, oldIndex, newIndex);

    // Update display_order for all affected items
    const updatedItems = items.map((item, index) => ({
      ...item,
      display_order: index,
    }));

    setQuestions(updatedItems);

    // Update each question's display_order in the backend
    try {
      // Update each question with new display_order
      const updatePromises = updatedItems.map(q =>
        (adminAPI as any).updateCustomizationQuestion(q.id, {
          ...q,
          display_order: q.display_order,
          // Move placeholder and help_text to metadata if they exist
          metadata: {
            ...q.metadata,
            ...(q.placeholder && { placeholder: q.placeholder }),
            ...(q.help_text && { help_text: q.help_text }),
          },
          // Remove top-level placeholder and help_text
          placeholder: undefined,
          help_text: undefined,
        })
      );

      await Promise.all(updatePromises);
    } catch (err: any) {
      console.error('Failed to reorder questions:', err);
      // Reload questions to get correct order
      loadQuestions();
    }
  };

  const resetForm = () => {
    setFormData({
      question_text: '',
      question_code: '',
      question_type: 'short_text',
      is_required: true,
      is_active: true,
      placeholder: '',
      default_value: '',
      options: [],
      validation_rules: {},
      metadata: {},
      help_text: '',
      depends_on: null,
      display_order: questions.length,
      page_number: 1,
    });
    setEditingQuestion(null);
    setNewOption('');
  };

  const handleEditQuestion = (question: any) => {
    setFormData({
      question_text: question.question_text || '',
      question_code: question.question_code || '',
      question_type: question.question_type || 'short_text',
      is_required: question.is_required ?? true,
      is_active: question.is_active ?? true,
      placeholder: question.metadata?.placeholder || question.placeholder || '',
      default_value: question.default_value || '',
      options: question.options || [],
      validation_rules: question.validation_rules || {},
      metadata: question.metadata || {},
      help_text: question.metadata?.help_text || question.help_text || '',
      depends_on: question.depends_on,
      display_order: question.display_order || 0,
      page_number: question.page_number || 1,
    });
    setEditingQuestion(question);
    setActiveTab('create');
  };

  const handleAddOption = () => {
    if (newOption.trim()) {
      setFormData({
        ...formData,
        options: [...formData.options, newOption.trim()],
      });
      setNewOption('');
    }
  };

  const handleRemoveOption = (index: number) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_: any, i: number) => i !== index),
    });
  };

  const handleValidationChange = (key: string, value: any) => {
    setFormData({
      ...formData,
      validation_rules: {
        ...formData.validation_rules,
        [key]: value,
      },
    });
  };

  const renderQuestionsTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Questions</p>
              <p className="text-2xl font-bold text-gray-900">{questions.length}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Questions</p>
              <p className="text-2xl font-bold text-gray-900">
                {questions.filter(q => q.is_active).length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Required Questions</p>
              <p className="text-2xl font-bold text-gray-900">
                {questions.filter(q => q.is_required).length}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Optional Questions</p>
              <p className="text-2xl font-bold text-gray-900">
                {questions.filter(q => !q.is_required).length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Questions List with Drag and Drop */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Questions</h3>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center">
              <svg className="animate-spin h-8 w-8 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="ml-2">Loading questions...</span>
            </div>
          </div>
        ) : questions.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No questions</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new question.</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={questions.map((q) => q.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="divide-y divide-gray-200">
                {questions.map((question) => (
                  <SortableQuestionItem
                    key={question.id}
                    question={question}
                    onEdit={handleEditQuestion}
                    onDelete={(q) => {
                      setQuestionToDelete(q);
                      setShowDeleteModal(true);
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );

  const renderCreateTab = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {editingQuestion ? 'Edit Question' : 'Create New Question'}
          </h3>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Basic Information</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question Text *
                </label>
                <input
                  type="text"
                  value={formData.question_text}
                  onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., What is your primary business goal?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question Code *
                </label>
                <input
                  type="text"
                  value={formData.question_code}
                  onChange={(e) => setFormData({ ...formData, question_code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., primary_business_goal"
                />
                <p className="text-xs text-gray-500 mt-1">Unique identifier for this question (lowercase, underscores only)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question Type
                </label>
                <select
                  value={formData.question_type}
                  onChange={(e) => setFormData({ ...formData, question_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {QUESTION_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Placeholder Text
                </label>
                <input
                  type="text"
                  value={formData.placeholder}
                  onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Enter your answer here..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Help Text
                </label>
                <input
                  type="text"
                  value={formData.help_text}
                  onChange={(e) => setFormData({ ...formData, help_text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Additional help or guidance for users"
                />
              </div>

              {/* Display Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Page Number
                  </label>
                  <input
                    type="number"
                    value={formData.page_number}
                    onChange={(e) => setFormData({ ...formData, page_number: parseInt(e.target.value) || 1 })}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Which page this question appears on (1, 2, 3, ...)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">Position within the page (0 = first, 1 = second, ...)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Options for select and multi_select */}
          {(formData.question_type === 'select' || formData.question_type === 'multi_select') && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Options</h4>
              <div className="space-y-2">
                {formData.options.map((option: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={option}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                    <button
                      onClick={() => handleRemoveOption(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Add new option"
                  />
                  <button
                    onClick={handleAddOption}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Validation Rules */}
          {VALIDATION_TYPES[formData.question_type] && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-4">Validation Rules</h4>
              <div className="space-y-4">
                {VALIDATION_TYPES[formData.question_type].includes('min_length') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Minimum Length
                      </label>
                      <input
                        type="number"
                        value={formData.validation_rules.min_length || ''}
                        onChange={(e) => handleValidationChange('min_length', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maximum Length
                      </label>
                      <input
                        type="number"
                        value={formData.validation_rules.max_length || ''}
                        onChange={(e) => handleValidationChange('max_length', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                  </div>
                )}

                {VALIDATION_TYPES[formData.question_type].includes('min_value') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Minimum Value
                      </label>
                      <input
                        type="number"
                        value={formData.validation_rules.min_value || ''}
                        onChange={(e) => handleValidationChange('min_value', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Maximum Value
                      </label>
                      <input
                        type="number"
                        value={formData.validation_rules.max_value || ''}
                        onChange={(e) => handleValidationChange('max_value', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                {VALIDATION_TYPES[formData.question_type].includes('step') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Step Value
                    </label>
                    <input
                      type="number"
                      value={formData.validation_rules.step || ''}
                      onChange={(e) => handleValidationChange('step', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="0"
                      step="0.1"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-4">Settings</h4>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_required"
                  checked={formData.is_required}
                  onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="is_required" className="ml-2 block text-sm text-gray-700">
                  Required question
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                  Active (visible to users)
                </label>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateQuestion}
              disabled={loading || !formData.question_text.trim() || !formData.question_code.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (editingQuestion ? 'Update Question' : 'Create Question')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStatisticsTab = () => (
    <div className="space-y-6">
      {/* Overall Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Responses</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total_responses || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Users Responded</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.users_responded || 0}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.average_completion_rate ?
                    `${Math.round(statistics.average_completion_rate * 100)}%` : 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Last Response</p>
                <p className="text-sm font-bold text-gray-900">
                  {statistics.last_response_at ?
                    new Date(statistics.last_response_at).toLocaleDateString() : 'Never'}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Answers Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Recent Answers</h3>
            {/* Export button removed as endpoint doesn't exist */}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Question
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Answer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Answered At
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {answers.map((answer: any) => (
                <tr key={answer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {answer.user_name || 'User ' + answer.user_id}
                    </div>
                    <div className="text-sm text-gray-500">{answer.user_email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{answer.question_title}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {typeof answer.answer === 'object'
                        ? JSON.stringify(answer.answer)
                        : answer.answer}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(answer.answered_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalAnswers > 10 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {(answersPage - 1) * 10 + 1} to {Math.min(answersPage * 10, totalAnswers)} of {totalAnswers} answers
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setAnswersPage(Math.max(1, answersPage - 1))}
                disabled={answersPage === 1}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setAnswersPage(answersPage + 1)}
                disabled={answersPage * 10 >= totalAnswers}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Onboarding Questions</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage customization questions for user onboarding
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('questions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'questions'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Questions List
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'create'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {editingQuestion ? 'Edit Question' : 'Create Question'}
            </button>
            <button
              onClick={() => setActiveTab('statistics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'statistics'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Statistics & Answers
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'questions' && renderQuestionsTab()}
        {activeTab === 'create' && renderCreateTab()}
        {activeTab === 'statistics' && renderStatisticsTab()}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {deleteWarning ? 'Confirm Force Delete' : 'Delete Question'}
              </h3>

              {deleteWarning ? (
                <>
                  <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-amber-800">Warning: Existing Answers</p>
                        <p className="text-sm text-amber-700 mt-1">{deleteWarning.message}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-6">
                    Are you sure you want to delete "{questionToDelete?.question_text}" and all associated answers? This action cannot be undone.
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500 mb-6">
                  Are you sure you want to delete "{questionToDelete?.question_text}"? This action cannot be undone.
                </p>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setQuestionToDelete(null);
                    setDeleteWarning(null);
                  }}
                  disabled={deleteLoading}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteQuestion(!!deleteWarning)}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {deleteLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : deleteWarning ? (
                    'Force Delete'
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
