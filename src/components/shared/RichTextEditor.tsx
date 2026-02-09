import React, { useMemo } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ align: [] }],
  ['link'],
  ['clean'],
];

/**
 * Reusable WYSIWYG editor wrapper around react-quill-new (Quill snow theme).
 * Includes dark-mode CSS overrides via inline <style>.
 */
const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder,
}) => {
  const modules = useMemo(
    () => ({
      toolbar: TOOLBAR_OPTIONS,
    }),
    []
  );

  return (
    <div className="rich-text-editor">
      {/* Dark-mode overrides for Quill snow theme */}
      <style>{`
        .dark .rich-text-editor .ql-toolbar.ql-snow {
          border-color: rgb(75, 85, 99);
          background: rgb(55, 65, 81);
        }
        .dark .rich-text-editor .ql-container.ql-snow {
          border-color: rgb(75, 85, 99);
          background: rgb(55, 65, 81);
          color: #fff;
        }
        .dark .rich-text-editor .ql-editor.ql-blank::before {
          color: rgb(156, 163, 175);
        }
        .dark .rich-text-editor .ql-snow .ql-stroke {
          stroke: rgb(209, 213, 219);
        }
        .dark .rich-text-editor .ql-snow .ql-fill,
        .dark .rich-text-editor .ql-snow .ql-stroke.ql-fill {
          fill: rgb(209, 213, 219);
        }
        .dark .rich-text-editor .ql-snow .ql-picker-label {
          color: rgb(209, 213, 219);
        }
        .dark .rich-text-editor .ql-snow .ql-picker-options {
          background: rgb(55, 65, 81);
          border-color: rgb(75, 85, 99);
        }
        .dark .rich-text-editor .ql-snow .ql-picker-item {
          color: rgb(209, 213, 219);
        }
        .rich-text-editor .ql-container.ql-snow {
          min-height: 200px;
          font-size: 14px;
        }
        .rich-text-editor .ql-editor {
          min-height: 200px;
        }
        .rich-text-editor .ql-editor p {
          margin-bottom: 0.75em;
        }
        .rich-text-editor .ql-editor p:last-child {
          margin-bottom: 0;
        }
        .rich-text-editor .ql-editor h1,
        .rich-text-editor .ql-editor h2,
        .rich-text-editor .ql-editor h3 {
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
        .rich-text-editor .ql-editor ul,
        .rich-text-editor .ql-editor ol {
          margin-bottom: 0.75em;
        }
        .rich-text-editor .ql-toolbar.ql-snow {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
        }
        .rich-text-editor .ql-container.ql-snow {
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
        }
      `}</style>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        readOnly={disabled}
        placeholder={placeholder}
      />
    </div>
  );
};

export default RichTextEditor;
