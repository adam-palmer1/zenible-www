import React from 'react';

interface PlanPickerStepProps {
  darkMode: boolean;
  loadingPlans: boolean;
  availablePlans: any[];
  subscribing: boolean;
  selectedPlanId: string | null;
  planError: string | null;
  onSelectPlan: (planId: string) => void;
}

export default function PlanPickerStep({
  darkMode,
  loadingPlans,
  availablePlans,
  subscribing,
  selectedPlanId,
  planError,
  onSelectPlan,
}: PlanPickerStepProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="text-center mb-6">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          Choose Your Plan
        </h3>
        <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
          Select a plan that fits your needs. You can change this later in settings.
        </p>
      </div>

      {/* Plan Error Message */}
      {planError && (
        <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
          {planError}
        </div>
      )}

      {loadingPlans ? (
        <div className="flex items-center justify-center py-12">
          <div className="inline-flex items-center">
            <svg className="animate-spin h-8 w-8 text-zenible-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className={`ml-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              Loading plans...
            </span>
          </div>
        </div>
      ) : availablePlans.length === 0 ? (
        <p className={`text-center py-8 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
          No plans available at the moment. You can select a plan later in settings.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availablePlans.map((plan) => {
            const isSelecting = subscribing && selectedPlanId === plan.id;
            const isFree = parseFloat(plan.monthly_price) === 0;

            return (
              <div
                key={plan.id}
                className={`relative p-5 rounded-xl border-2 transition-all ${
                  darkMode
                    ? 'border-zenible-dark-border hover:border-zenible-primary/50 bg-zenible-dark-bg'
                    : 'border-gray-200 hover:border-zenible-primary/50 bg-gray-50'
                }`}
              >
                {isFree && (
                  <span className="absolute -top-3 left-4 px-2 py-0.5 text-xs font-medium bg-green-500 text-white rounded-full">
                    Free
                  </span>
                )}

                <h3 className={`text-lg font-semibold mb-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>

                <div className="mb-3">
                  <span className={`text-2xl font-bold ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                    {isFree ? 'Free' : `$${(parseFloat(plan.monthly_price) || 0).toFixed(2)}`}
                  </span>
                  {!isFree && (
                    <span className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                      /month
                    </span>
                  )}
                </div>

                {plan.description && (
                  <p className={`text-sm mb-4 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                    {plan.description}
                  </p>
                )}

                <button
                  onClick={() => onSelectPlan(plan.id)}
                  disabled={subscribing}
                  className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                    'bg-zenible-primary text-white hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {isSelecting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Select Plan'
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
