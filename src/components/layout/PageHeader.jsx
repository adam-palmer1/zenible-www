import React from 'react';

const PageHeader = ({
  title,
  description,
  showAddButton = false,
  addButtonText = "Add New",
  onAddClick = null,
  showBackButton = false,
  onBack = null,
  actionButton = null,
  children
}) => {
  return (
    <div className="mt-16 md:mt-5 w-full max-md:max-w-full">
      <div className="flex flex-wrap gap-10 justify-between items-center px-5 py-5 w-full bg-[#fefefe] dark:bg-gray-900 rounded-xl max-md:px-5 max-md:max-w-full">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              title="Go back"
            >
              <svg className="w-5 h-5 text-design-text-muted dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div>
            <div className="text-2xl font-medium tracking-tight text-design-text-primary dark:text-white">
              {title}
            </div>
            {description && (
              <div className="text-sm text-design-text-muted dark:text-gray-400 mt-1">
                {description}
              </div>
            )}
          </div>
        </div>
        <div className={`flex gap-3 items-center self-stretch my-auto ${showAddButton || actionButton ? 'min-w-60' : ''}`}>
          {actionButton && (
            <button
              onClick={actionButton.onClick}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${actionButton.className || 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'}`}
            >
              {actionButton.label}
            </button>
          )}
          {showAddButton && (
            <button
              onClick={onAddClick}
              className="flex gap-2 justify-center items-center self-stretch px-4 py-3 my-auto text-sm font-medium tracking-tight leading-none bg-design-input-bg dark:bg-gray-800 border border-solid border-design-border-input dark:border-gray-600 min-h-11 rounded-[44px] text-design-text-muted dark:text-gray-400 w-[122px] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <svg
                className="w-3 h-3 text-design-text-muted dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <div className="self-stretch my-auto">{addButtonText}</div>
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
};

export default PageHeader;
