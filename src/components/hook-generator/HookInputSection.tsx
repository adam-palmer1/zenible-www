import { usePreferences } from '../../contexts/PreferencesContext';

interface HookInputSectionProps {
  description: string;
  setDescription: (value: string) => void;
  audience: string;
  setAudience: (value: string) => void;
  goal: string;
  setGoal: (value: string) => void;
  disabled?: boolean;
}

export default function HookInputSection({
  description,
  setDescription,
  audience,
  setAudience,
  goal,
  setGoal,
  disabled = false,
}: HookInputSectionProps) {
  const { darkMode } = usePreferences();

  const inputClass = `w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-violet-500 ${
    darkMode
      ? 'bg-gray-800 text-gray-100 border-gray-700 placeholder-gray-500'
      : 'bg-white text-zinc-500 border-[#ddd6ff] placeholder-zinc-400'
  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="mb-2">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-zinc-950'}`}>
          Describe Your Post Idea
        </h3>
      </div>

      <div className="space-y-4 flex-1 flex flex-col min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-zinc-950'}`}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={disabled}
            placeholder="Describe what you want to say or the angle you want to take. E.g. 'I want to talk about why most LinkedIn advice is useless for B2B founders'"
            className={`w-full flex-1 min-h-[180px] p-4 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 ${
              darkMode
                ? 'bg-gray-800 text-gray-100 border-gray-700 placeholder-gray-500'
                : 'bg-white text-zinc-500 border-[#ddd6ff] placeholder-zinc-400'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-zinc-950'}`}>
            Audience <span className={`font-normal ${darkMode ? 'text-gray-400' : 'text-zinc-500'}`}>(optional)</span>
          </label>
          <input
            type="text"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            disabled={disabled}
            placeholder="e.g., B2B founders, freelancers, marketing leaders"
            className={inputClass}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-zinc-950'}`}>
            Goal <span className={`font-normal ${darkMode ? 'text-gray-400' : 'text-zinc-500'}`}>(optional)</span>
          </label>
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            disabled={disabled}
            placeholder="e.g., generate leads, drive comments, build authority"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}
