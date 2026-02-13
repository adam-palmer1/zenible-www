import React from 'react';
import { X, Check, Calendar, Clock, User, CreditCard, Loader2, Shield, Phone, Mail, Settings } from 'lucide-react';
import { AdminUser, AdminPlan, FilterOption } from './types';
import { DURATION_OPTIONS, ROLE_OPTIONS } from './constants';
import PlanSelectorModal from './PlanSelectorModal';
import DurationSelectorModal from './DurationSelectorModal';
import RoleSelectorModal from './RoleSelectorModal';
import { useEscapeKey } from '../../../hooks/useEscapeKey';

interface UserActionsModalProps {
  user: AdminUser;
  plans: AdminPlan[];
  actionFirstName: string;
  setActionFirstName: (val: string) => void;
  actionLastName: string;
  setActionLastName: (val: string) => void;
  actionPhone: string;
  setActionPhone: (val: string) => void;
  actionRole: string;
  actionIsVerified: boolean;
  setActionIsVerified: (val: boolean) => void;
  actionPlanId: string;
  durationPreset: string;
  customStartDate: string;
  setCustomStartDate: (val: string) => void;
  customEndDate: string;
  setCustomEndDate: (val: string) => void;
  showPlanSelectorModal: boolean;
  setShowPlanSelectorModal: (val: boolean) => void;
  showDurationSelectorModal: boolean;
  setShowDurationSelectorModal: (val: boolean) => void;
  showRoleSelectorModal: boolean;
  setShowRoleSelectorModal: (val: boolean) => void;
  setActionPlanId: (val: string) => void;
  setDurationPreset: (val: string) => void;
  setActionRole: (val: string) => void;
  savingActions: boolean;
  onClose: () => void;
  onSave: () => void;
}

const UserActionsModal: React.FC<UserActionsModalProps> = ({
  user,
  plans,
  actionFirstName,
  setActionFirstName,
  actionLastName,
  setActionLastName,
  actionPhone,
  setActionPhone,
  actionRole,
  actionIsVerified,
  setActionIsVerified,
  actionPlanId,
  durationPreset,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  showPlanSelectorModal,
  setShowPlanSelectorModal,
  showDurationSelectorModal,
  setShowDurationSelectorModal,
  showRoleSelectorModal,
  setShowRoleSelectorModal,
  setActionPlanId,
  setDurationPreset,
  setActionRole,
  savingActions,
  onClose,
  onSave,
}) => {
  useEscapeKey(onClose);

  const selectedPlan = plans.find((p: AdminPlan) => p.id === actionPlanId);
  const selectedDurationOption: FilterOption | undefined = DURATION_OPTIONS.find(opt => opt.id === durationPreset);
  const selectedRoleOption: FilterOption | undefined = ROLE_OPTIONS.find(opt => opt.id === actionRole);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-auto">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Settings className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">User Actions</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="p-4 space-y-6">
            {/* Profile Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                  <input
                    type="text"
                    value={actionFirstName}
                    onChange={(e) => setActionFirstName(e.target.value)}
                    placeholder="First name"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                  <input
                    type="text"
                    value={actionLastName}
                    onChange={(e) => setActionLastName(e.target.value)}
                    placeholder="Last name"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <Phone className="h-4 w-4" />
                  Phone
                </label>
                <input
                  type="tel"
                  value={actionPhone}
                  onChange={(e) => setActionPhone(e.target.value)}
                  placeholder="Phone number"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
            </div>

            {/* Role & Verification Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Role & Verification
              </h3>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">User Role</label>
                <button
                  type="button"
                  onClick={() => setShowRoleSelectorModal(true)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-left rounded-lg hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                >
                  <span className="text-gray-900 dark:text-white">{selectedRoleOption?.label || 'Select role...'}</span>
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Email Verified</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {actionIsVerified ? 'User email is verified' : 'User email is not verified'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActionIsVerified(!actionIsVerified)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                    actionIsVerified ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      actionIsVerified ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Plan Assignment Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Subscription Plan
              </h3>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Plan</label>
                <button
                  type="button"
                  onClick={() => setShowPlanSelectorModal(true)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-left rounded-lg hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                >
                  <span className={selectedPlan ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>
                    {selectedPlan ? `${selectedPlan.name} - $${selectedPlan.monthly_price}/mo` : 'Select plan...'}
                  </span>
                </button>
              </div>

              {/* Only show duration if a plan is selected and it's different from current */}
              {actionPlanId && actionPlanId !== user.current_plan_id && (
                <>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <Clock className="h-4 w-4" />
                      Duration
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowDurationSelectorModal(true)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-left rounded-lg hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                    >
                      <span className="text-gray-900 dark:text-white">{selectedDurationOption?.label || 'Select duration...'}</span>
                    </button>
                  </div>

                  {/* Custom Date Fields */}
                  {durationPreset === 'custom' && (
                    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          <Calendar className="h-4 w-4" />
                          Start Date
                        </label>
                        <input
                          type="datetime-local"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">Leave empty to start immediately</p>
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          <Calendar className="h-4 w-4" />
                          End Date
                        </label>
                        <input
                          type="datetime-local"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">Leave empty for default 30 days</p>
                      </div>
                    </div>
                  )}

                  {/* Duration Info */}
                  {durationPreset !== 'custom' && durationPreset !== '30days' && (
                    <div className="flex items-start gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        {durationPreset === 'lifetime'
                          ? 'Subscription will be valid until December 31, 2099'
                          : `Subscription will end ${durationPreset === '3months' ? '3 months' : durationPreset === '6months' ? '6 months' : '1 year'} from now`
                        }
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              disabled={savingActions}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={savingActions}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingActions ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Plan Selector Modal */}
      <PlanSelectorModal
        isOpen={showPlanSelectorModal}
        onClose={() => setShowPlanSelectorModal(false)}
        plans={plans}
        selectedPlanId={actionPlanId}
        onSelect={setActionPlanId}
      />

      {/* Duration Selector Modal */}
      <DurationSelectorModal
        isOpen={showDurationSelectorModal}
        onClose={() => setShowDurationSelectorModal(false)}
        selectedDuration={durationPreset}
        onSelect={setDurationPreset}
      />

      {/* Role Selector Modal */}
      <RoleSelectorModal
        isOpen={showRoleSelectorModal}
        onClose={() => setShowRoleSelectorModal(false)}
        selectedRole={actionRole}
        onSelect={setActionRole}
      />
    </>
  );
};

export default UserActionsModal;
