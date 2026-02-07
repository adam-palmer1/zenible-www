import React, { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import { X } from 'lucide-react';
import VariableHelper from './VariableHelper';
import {
  useEmailTemplateQuery,
  useTemplateVariablesQuery,
  useEffectiveTemplateQuery,
  useCreateEmailTemplate,
  useUpdateEmailTemplate,
  usePreviewEmailTemplate
} from '../../hooks/queries/useEmailTemplatesQuery';
import { useNotification } from '../../contexts/NotificationContext';

interface EmailTemplate {
  id?: string;
  name?: string;
  description?: string;
  subject?: string;
  body?: string;
  template_type?: string;
  is_system_default?: boolean;
}

interface EmailTemplateEditorProps {
  template?: EmailTemplate | null;
  templateType?: string;
  onSave?: () => void;
  onCancel: () => void;
  readOnly?: boolean;
}

const EmailTemplateEditor: React.FC<EmailTemplateEditorProps> = ({
  template = null,
  templateType,
  onSave,
  onCancel,
  readOnly = false
}) => {
  const { showSuccess, showError } = useNotification();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    body: ''
  });

  // UI state
  const [focusedField, setFocusedField] = useState('body');
  const [showPreview, setShowPreview] = useState(false);
  const [sampleData, setSampleData] = useState<Record<string, string>>({});

  // Refs for cursor position
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const bodyEditorRef = useRef<HTMLTextAreaElement>(null);

  // Determine which template type to use
  const effectiveTemplateType = template?.template_type || templateType;

  // Fetch template variables for this type
  const { data: variablesData, isLoading: loadingVariables } = useTemplateVariablesQuery(
    effectiveTemplateType,
    { enabled: !!effectiveTemplateType }
  );

  // Fetch effective (default) template if creating new
  const { data: effectiveTemplate } = useEffectiveTemplateQuery(
    effectiveTemplateType,
    { enabled: !template && !!effectiveTemplateType }
  );

  // Mutations
  const createMutation = useCreateEmailTemplate({
    onSuccess: () => {
      showSuccess('Email template created successfully');
      onSave?.();
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to create template');
    }
  });

  const updateMutation = useUpdateEmailTemplate({
    onSuccess: () => {
      showSuccess('Email template updated successfully');
      onSave?.();
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to update template');
    }
  });

  const previewMutation = usePreviewEmailTemplate({
    onSuccess: (data: any) => {
      setShowPreview(true);
    },
    onError: (error: any) => {
      showError('Failed to generate preview');
    }
  });

  // Initialize form data from template or effective template
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        description: template.description || '',
        subject: template.subject || '',
        body: template.body || ''
      });
    } else if (effectiveTemplate && !formData.subject && !formData.body) {
      // Load default template content for new templates
      setFormData(prev => ({
        ...prev,
        subject: (effectiveTemplate as any).subject || '',
        body: (effectiveTemplate as any).body || '',
        name: `Custom ${(effectiveTemplate as any).name || 'Template'}`,
        description: `Customized version of ${(effectiveTemplate as any).name || 'template'}`
      }));
    }
  }, [template, effectiveTemplate]);

  // Initialize sample data from variables
  useEffect(() => {
    if ((variablesData as any)?.variables) {
      const samples: Record<string, string> = {};
      (variablesData as any).variables.forEach((variable: any) => {
        const key = typeof variable === 'string'
          ? variable.replace(/[{}]/g, '')
          : (variable.variable || variable.name || '').replace(/[{}]/g, '');
        samples[key] = variable.example || '';
      });
      setSampleData(samples);
    }
  }, [variablesData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const insertVariable = (variableName: string) => {
    // Format variable with curly brackets
    const variable = variableName.includes('{{') ? variableName : `{{${variableName}}}`;

    if (focusedField === 'subject') {
      const input = subjectInputRef.current;
      if (!input) return;

      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const text = input.value;

      const newText = text.substring(0, start) + variable + text.substring(end);

      setFormData(prev => ({ ...prev, subject: newText }));

      // Restore cursor position
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    } else {
      const textarea = bodyEditorRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const text = textarea.value;

      const newText = text.substring(0, start) + variable + text.substring(end);

      setFormData(prev => ({ ...prev, body: newText }));

      // Restore cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const handlePreview = async () => {
    if (!effectiveTemplateType) {
      showError('Template type is required for preview');
      return;
    }

    if (template?.id) {
      // Preview existing template via API
      previewMutation.mutate({ id: template.id, variables: sampleData } as any);
    } else {
      // Local preview for new template
      let previewSubject = formData.subject;
      let previewBody = formData.body;

      // Replace variables with sample data
      Object.entries(sampleData).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        previewSubject = previewSubject.replace(regex, value || key);
        previewBody = previewBody.replace(regex, value || key);
      });

      previewMutation.mutate({
        id: null,
        variables: { subject: previewSubject, body: previewBody }
      } as any);
      setShowPreview(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.subject || !formData.body) {
      showError('Please fill in all required fields');
      return;
    }

    const templateData = {
      name: formData.name,
      description: formData.description,
      template_type: effectiveTemplateType,
      subject: formData.subject,
      body: formData.body,
      is_active: true
    };

    if (template?.id && !template.is_system_default) {
      // Update existing template
      updateMutation.mutate({ id: template.id, data: templateData } as any);
    } else {
      // Create new template
      createMutation.mutate(templateData as any);
    }
  };

  const isSystemTemplate = template?.is_system_default || readOnly;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isSystemTemplate ? 'View' : template ? 'Edit' : 'Create'} Email Template
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {isSystemTemplate
              ? 'This is a system default template. Save to create your own editable copy.'
              : template
              ? 'Customize your email template with variables and formatting'
              : 'Create a new email template based on the system default'}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Template Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Template Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={isSystemTemplate}
            placeholder="e.g., Invoice Email Template"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        {/* Template Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <input
            type="text"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            disabled={isSystemTemplate}
            placeholder="Brief description of this template"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Subject */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email Subject *
          </label>
          <input
            ref={subjectInputRef}
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            onFocus={() => setFocusedField('subject')}
            onBlur={() => setFocusedField('body')}
            disabled={isSystemTemplate}
            placeholder="e.g., Invoice {{invoice_number}} from {{company_name}}"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        {/* Body Editor with Variables Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <label htmlFor="body" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Body * (HTML)
            </label>
            <textarea
              ref={bodyEditorRef}
              id="body"
              name="body"
              value={formData.body}
              onChange={handleChange}
              onFocus={() => setFocusedField('body')}
              disabled={isSystemTemplate}
              rows={20}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-transparent font-mono text-sm disabled:bg-gray-100 dark:disabled:bg-gray-800 dark:bg-gray-700 dark:text-white"
              placeholder="<html>&#10;  <body>&#10;    <h1>Invoice from {{company_name}}</h1>&#10;    <p>Dear {{client_name}},</p>&#10;    ...&#10;  </body>&#10;</html>"
              required
            />
          </div>

          {/* Variables Panel */}
          <div>
            <VariableHelper
              variables={(variablesData as any)?.variables || []}
              onInsert={insertVariable}
              loading={loadingVariables}
              disabled={isSystemTemplate}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handlePreview}
            disabled={previewMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            {previewMutation.isPending ? 'Generating...' : 'Preview Template'}
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            {!isSystemTemplate && (
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 text-sm font-medium text-white bg-zenible-primary rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Preview Modal */}
      {showPreview && previewMutation.data && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Template Preview
              </h3>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  {(previewMutation.data as any).subject || 'No subject'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Body
                </label>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize((previewMutation.data as any).body || 'No content') }} />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplateEditor;
