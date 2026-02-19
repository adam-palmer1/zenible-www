import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDownIcon, XMarkIcon, MagnifyingGlassIcon, CheckIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useModalPortal } from '../../../contexts/ModalPortalContext';

interface ComboboxOption {
  id: string;
  label: string;
  [key: string]: unknown;
}

interface ComboboxProps {
  options?: ComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  renderOption?: (option: ComboboxOption) => React.ReactNode;
  emptyMessage?: string;
  loading?: boolean;
  onCreate?: (name: string) => Promise<{ id: string } | null | undefined>;
  createLabel?: string;
  creating?: boolean;
}

/**
 * Combobox component with autocomplete functionality
 *
 * Usage:
 * <Combobox
 *   options={[{ id: '1', label: 'Option 1' }, { id: '2', label: 'Option 2' }]}
 *   value={selectedId}
 *   onChange={(id) => setSelectedId(id)}
 *   placeholder="Select an option..."
 *   searchPlaceholder="Search..."
 *   allowClear
 *   onCreate={(name) => handleCreate(name)}
 *   createLabel="Create new category"
 * />
 */
const Combobox: React.FC<ComboboxProps> = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  allowClear = true,
  disabled = false,
  error = false,
  className = '',
  renderOption,
  emptyMessage = 'No options found',
  loading = false,
  onCreate,
  createLabel = 'Create new',
  creating = false,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const createInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const insideModal = useModalPortal() !== null;

  // Find selected option
  const selectedOption = options.find(opt => opt.id === value);

  // Filter options based on search term
  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate dropdown position (only used when NOT inside a modal)
  const updateDropdownPosition = useCallback(() => {
    if (!triggerRef.current || insideModal) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = 300; // approximate max height
    const openAbove = spaceBelow < dropdownHeight && rect.top > spaceBelow;

    setDropdownStyle({
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      ...(openAbove
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
      zIndex: 9999,
    });
  }, [insideModal]);

  // Update position when open and on scroll/resize (portal mode only)
  useEffect(() => {
    if (!isOpen || insideModal) return;
    updateDropdownPosition();

    const handleScrollOrResize = () => updateDropdownPosition();
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, insideModal, updateDropdownPosition]);

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current && !showCreateForm) {
      inputRef.current.focus({ preventScroll: true });
    }
  }, [isOpen, showCreateForm]);

  // Focus create input when showing create form
  useEffect(() => {
    if (showCreateForm && createInputRef.current) {
      createInputRef.current.focus();
    }
  }, [showCreateForm]);

  // Reset create form when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setShowCreateForm(false);
      setNewItemName('');
    }
  }, [isOpen]);

  // When inside a modal, temporarily set overflow:visible on the scrollable ancestor
  // so the absolutely positioned dropdown isn't clipped by the modal body.
  useEffect(() => {
    if (!isOpen || !insideModal || !containerRef.current) return;

    let scrollParent: HTMLElement | null = containerRef.current.parentElement;
    while (scrollParent) {
      const { overflowY } = window.getComputedStyle(scrollParent);
      if (overflowY === 'auto' || overflowY === 'scroll') break;
      scrollParent = scrollParent.parentElement;
    }
    if (!scrollParent) return;

    const original = scrollParent.style.overflow;
    scrollParent.style.overflow = 'visible';
    return () => { scrollParent.style.overflow = original; };
  }, [isOpen, insideModal]);

  const handleSelect = useCallback((optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
    setSearchTerm('');
  }, [onChange]);

  const handleClear = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (showCreateForm) {
        setShowCreateForm(false);
        setNewItemName('');
      } else {
        setIsOpen(false);
        setSearchTerm('');
      }
    } else if (e.key === 'Enter' && filteredOptions.length === 1 && !showCreateForm) {
      handleSelect(filteredOptions[0].id);
    }
  }, [filteredOptions, handleSelect, showCreateForm]);

  const handleCreate = useCallback(async () => {
    if (!newItemName.trim() || !onCreate) return;

    try {
      const newItem = await onCreate(newItemName.trim());
      if (newItem?.id) {
        onChange(newItem.id);
      }
      setShowCreateForm(false);
      setNewItemName('');
      setIsOpen(false);
    } catch (err) {
      // Error handling is done by parent
      console.error('Failed to create item:', err);
    }
  }, [newItemName, onCreate, onChange]);

  const handleCreateKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreate();
    } else if (e.key === 'Escape') {
      setShowCreateForm(false);
      setNewItemName('');
    }
  }, [handleCreate]);

  const dropdownInner = (
    <div
      ref={dropdownRef}
      style={insideModal ? undefined : dropdownStyle}
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden ${
        insideModal ? 'absolute left-0 right-0 top-full mt-1 z-[100]' : ''
      }`}
    >
      {/* Create Form */}
      {showCreateForm ? (
        <div className="p-3">
          <label className="block text-sm font-medium design-text-primary mb-2">
            {createLabel}
          </label>
          <div className="flex gap-2">
            <input
              ref={createInputRef}
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={handleCreateKeyDown}
              placeholder="Enter name..."
              autoComplete="off"
              className="flex-1 px-3 py-2 text-sm design-input rounded-md"
              disabled={creating}
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={!newItemName.trim() || creating}
              className="px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? '...' : 'Add'}
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowCreateForm(false);
              setNewItemName('');
            }}
            className="mt-2 text-sm design-text-secondary hover:design-text-primary"
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 design-text-secondary" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                autoComplete="off"
                className="w-full pl-9 pr-3 py-2 text-sm design-input rounded-md"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1">
            {loading ? (
              <div className="px-3 py-4 text-center design-text-secondary text-sm">
                Loading...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center design-text-secondary text-sm">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option.id)}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-md
                    transition-colors
                    ${option.id === value
                      ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                      : 'design-text-primary hover:bg-gray-50 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  {renderOption ? (
                    renderOption(option)
                  ) : (
                    <>
                      <span className="flex-1">{option.label}</span>
                      {option.id === value && (
                        <CheckIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      )}
                    </>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Create New Button */}
          {onCreate && (
            <div className="p-1 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-md text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                <span>{createLabel}</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between gap-2
          px-3 py-2 text-left
          bg-white dark:bg-gray-800
          border border-gray-300 dark:border-gray-600
          rounded-md
          transition-colors
          focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400 dark:hover:border-gray-500'}
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${isOpen ? 'ring-2 ring-purple-500 border-transparent' : ''}
        `}
      >
        <span className={selectedOption ? 'design-text-primary' : 'design-text-secondary'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {allowClear && value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === 'Enter' && handleClear(e)}
              className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer"
            >
              <XMarkIcon className="h-4 w-4 design-text-secondary" />
            </span>
          )}
          <ChevronDownIcon
            className={`h-4 w-4 design-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Inside a modal: render inline to avoid focus trap / event issues.
          Outside a modal: portal to document.body to escape overflow containers. */}
      {isOpen && (insideModal
        ? dropdownInner
        : createPortal(dropdownInner, document.body)
      )}
    </div>
  );
};

export default Combobox;
