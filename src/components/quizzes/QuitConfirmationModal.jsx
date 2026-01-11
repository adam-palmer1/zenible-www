import React from 'react';

export default function QuitConfirmationModal({ onConfirm, onCancel }) {
  // Prevent clicks inside modal from closing it
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-white border border-neutral-200 rounded-[12px] max-w-[500px] w-full mx-4"
        onClick={handleModalClick}
      >
        {/* Header */}
        <div className="p-[24px] pb-[16px] border-b border-neutral-200">
          <h2 className="font-['Inter'] font-semibold text-[20px] text-zinc-950">
            Quit Quiz?
          </h2>
        </div>

        {/* Content */}
        <div className="p-[24px]">
          <p className="font-['Inter'] font-normal text-[16px] text-zinc-600 leading-[24px]">
            Are you sure you want to quit this quiz? Your progress will not be saved and you'll need to start over.
          </p>
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-[16px] p-[24px] pt-[16px]">
          <button
            onClick={onCancel}
            className="flex-1 border border-neutral-200 bg-white text-zinc-950 py-[12px] px-[24px] rounded-[12px] font-['Inter'] font-medium text-[16px] hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 text-white py-[12px] px-[24px] rounded-[12px] font-['Inter'] font-medium text-[16px] hover:bg-red-700 transition-colors"
          >
            Quit Quiz
          </button>
        </div>
      </div>
    </div>
  );
}
