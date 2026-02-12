import React, { useState } from 'react';
import { EventItem, EventHost, PlanItem, EventFormData } from './types';

interface EventFormModalProps {
  darkMode: boolean;
  editingEvent: EventItem | null;
  eventForm: EventFormData;
  setEventForm: (form: EventFormData) => void;
  hosts: EventHost[];
  plans: PlanItem[];
  availableTags: string[];
  onSave: () => void;
  onClose: () => void;
}

export default function EventFormModal({
  darkMode,
  editingEvent,
  eventForm,
  setEventForm,
  hosts,
  plans,
  availableTags,
  onSave,
  onClose,
}: EventFormModalProps) {
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  const addTag = (tag: string) => {
    if (tag && !eventForm.tags.includes(tag)) {
      setEventForm({ ...eventForm, tags: [...eventForm.tags, tag] });
    }
    setTagInput('');
    setShowTagSuggestions(false);
  };

  const removeTag = (tagToRemove: string) => {
    setEventForm({
      ...eventForm,
      tags: eventForm.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleTagInputChange = (value: string) => {
    setTagInput(value);
    setShowTagSuggestions(value.length > 0);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput.trim());
    }
  };

  const filteredTagSuggestions = availableTags.filter(tag =>
    tag.toLowerCase().includes(tagInput.toLowerCase()) &&
    !eventForm.tags.includes(tag)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
        <div className={`px-6 py-4 border-b sticky top-0 ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
            {editingEvent ? 'Edit Event' : eventForm.title.includes('(Copy)') ? 'Clone Event' : 'Create Event'}
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Title *
              </label>
              <input
                type="text"
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                placeholder="Event title"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Rating (e.g., 4.9)
              </label>
              <input
                type="text"
                value={eventForm.rating}
                onChange={(e) => {
                  setEventForm({ ...eventForm, rating: e.target.value });
                }}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                placeholder="4.9"
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              Description *
            </label>
            <textarea
              value={eventForm.description}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              rows={3}
              className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
              placeholder="Event description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Start Date & Time *
              </label>
              <input
                type="datetime-local"
                value={eventForm.start_datetime}
                onChange={(e) => setEventForm({ ...eventForm, start_datetime: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Duration (minutes) *
              </label>
              <input
                type="number"
                min="1"
                value={eventForm.duration_minutes}
                onChange={(e) => setEventForm({ ...eventForm, duration_minutes: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                Guest Limit
              </label>
              <input
                type="number"
                min="1"
                value={eventForm.guest_limit}
                onChange={(e) => setEventForm({ ...eventForm, guest_limit: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                placeholder="No limit"
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              Tags
            </label>
            <div className="relative">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => handleTagInputChange(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                placeholder="Type to add tags..."
              />
              {showTagSuggestions && filteredTagSuggestions.length > 0 && (
                <div className={`absolute z-10 w-full mt-1 rounded-lg border max-h-48 overflow-y-auto ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
                  {filteredTagSuggestions.map((tag, idx) => (
                    <button
                      key={idx}
                      onClick={() => addTag(tag)}
                      className={`w-full text-left px-3 py-2 hover:bg-opacity-90 ${darkMode ? 'hover:bg-zenible-dark-bg text-zenible-dark-text' : 'hover:bg-gray-100 text-gray-900'}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {eventForm.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              Hosts *
            </label>
            <select
              multiple
              value={eventForm.host_ids}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setEventForm({ ...eventForm, host_ids: selected });
              }}
              className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
              size={5}
            >
              {hosts.map(host => (
                <option key={host.id} value={host.id}>
                  {host.name}
                </option>
              ))}
            </select>
            <p className={`text-xs mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
              Hold Ctrl/Cmd to select multiple hosts
            </p>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              Required Plans
            </label>
            <select
              multiple
              value={eventForm.required_plan_ids}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setEventForm({ ...eventForm, required_plan_ids: selected });
              }}
              className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
              size={5}
            >
              {plans.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
            <p className={`text-xs mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
              Hold Ctrl/Cmd to select multiple plans. Leave empty for no plan requirement.
            </p>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              Event URL (Live Session Link)
            </label>
            <input
              type="url"
              value={eventForm.event_url}
              onChange={(e) => setEventForm({ ...eventForm, event_url: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
              placeholder="https://zoom.us/... or https://meet.google.com/..."
            />
            <p className={`text-xs mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
              Link to live event (Zoom, Google Meet, etc.). Only visible to registered users.
            </p>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              Replay URL
            </label>
            <input
              type="url"
              value={eventForm.replay_url}
              onChange={(e) => setEventForm({ ...eventForm, replay_url: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
              placeholder="https://..."
            />
            <p className={`text-xs mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
              Link to recorded session for past events.
            </p>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              Past Summary
            </label>
            <textarea
              value={eventForm.past_summary}
              onChange={(e) => setEventForm({ ...eventForm, past_summary: e.target.value })}
              rows={3}
              className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
              placeholder="Summary for past events..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={eventForm.is_active}
              onChange={(e) => setEventForm({ ...eventForm, is_active: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="is_active" className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              Active
            </label>
          </div>
        </div>
        <div className={`px-6 py-4 border-t flex gap-2 sticky bottom-0 ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
          <button
            onClick={onSave}
            disabled={!eventForm.title || !eventForm.description || !eventForm.start_datetime || eventForm.host_ids.length === 0}
            className={`px-4 py-2 rounded-lg ${
              eventForm.title && eventForm.description && eventForm.start_datetime && eventForm.host_ids.length > 0
                ? 'bg-zenible-primary text-white hover:bg-opacity-90'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {editingEvent ? 'Update' : 'Create'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
