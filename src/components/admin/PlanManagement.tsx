import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import adminAPI from '../../services/adminAPI';
import { LoadingSpinner } from '../shared';

interface PlanResponse {
  id: string;
  name: string;
  description?: string | null;
  monthly_price: string;
  annual_price: string | null;
  old_monthly_price?: string | null;
  old_annual_price?: string | null;
  is_recommended: boolean;
  is_active: boolean;
  features?: string[];
  stripe_product_id?: string | null;
  created_at: string;
  updated_at?: string | null;
}

interface PlanFormData {
  name: string;
  description: string;
  monthly_price: string;
  annual_price: string;
  old_monthly_price?: string;
  old_annual_price?: string;
  is_recommended?: boolean;
  api_call_limit?: string;
  features: string[];
  is_free?: boolean;
  is_active: boolean;
}

interface ValidationError {
  loc?: string[];
  msg: string;
}

export default function PlanManagement() {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const [plans, setPlans] = useState<PlanResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanResponse | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [actionDropdown, setActionDropdown] = useState<string | null>(null);
  const [forceUpgrades, setForceUpgrades] = useState<boolean>(false);
  const [formData, setFormData] = useState<PlanFormData>({
    name: '',
    description: '',
    monthly_price: '',
    annual_price: '',
    api_call_limit: '',
    features: [],
    is_free: false,
    is_active: true,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  // Click outside handler for action dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionDropdown && !(event.target as HTMLElement).closest('.action-dropdown-container')) {
        setActionDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [actionDropdown]);

  const fetchPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getPlans({ include_inactive: 'true' }) as { plans?: PlanResponse[] };
      setPlans(response.plans || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    setModalError(null);
    try {
      // Convert empty strings to null for decimal fields
      const data = {
        ...formData,
        monthly_price: formData.monthly_price || null,
        annual_price: formData.annual_price || null,
        old_monthly_price: formData.old_monthly_price || null,
        old_annual_price: formData.old_annual_price || null,
        is_recommended: formData.is_recommended || false,
      };
      await adminAPI.createPlan(data);
      setShowCreateModal(false);
      fetchPlans();
      resetForm();
    } catch (err: any) {
      // Parse validation errors if available
      if (err.response?.detail) {
        const detail = err.response.detail;
        if (Array.isArray(detail)) {
          // Format validation errors
          const errors = detail.map((error: ValidationError) => {
            const field = error.loc?.join('.') || 'Field';
            return `${field}: ${error.msg}`;
          }).join('\n');
          setModalError(errors);
        } else if (typeof detail === 'string') {
          setModalError(detail);
        } else {
          setModalError(err.message);
        }
      } else {
        setModalError(err.message || 'An error occurred while creating the plan');
      }
    }
  };

  const handleUpdatePlan = async () => {
    if (!selectedPlan) return;
    setModalError(null);
    try {
      // Convert empty strings to null for decimal fields
      const data = {
        ...formData,
        monthly_price: formData.monthly_price || null,
        annual_price: formData.annual_price || null,
        old_monthly_price: formData.old_monthly_price || null,
        old_annual_price: formData.old_annual_price || null,
        is_recommended: formData.is_recommended || false,
      };
      await adminAPI.updatePlan(selectedPlan.id, data);
      setShowEditModal(false);
      fetchPlans();
      resetForm();
    } catch (err: any) {
      // Parse validation errors if available
      if (err.response?.detail) {
        const detail = err.response.detail;
        if (Array.isArray(detail)) {
          // Format validation errors
          const errors = detail.map((error: ValidationError) => {
            const field = error.loc?.join('.') || 'Field';
            return `${field}: ${error.msg}`;
          }).join('\n');
          setModalError(errors);
        } else if (typeof detail === 'string') {
          setModalError(detail);
        } else {
          setModalError(err.message);
        }
      } else {
        setModalError(err.message || 'An error occurred while updating the plan');
      }
    }
  };

  const handleActivatePlan = async (planId: string) => {
    try {
      await adminAPI.activatePlan(planId);
      fetchPlans();
    } catch (err: any) {
      alert(`Error activating plan: ${err.message}`);
    }
  };

  const handleDeactivatePlan = async (planId: string) => {
    try {
      await adminAPI.deactivatePlan(planId);
      fetchPlans();
    } catch (err: any) {
      alert(`Error deactivating plan: ${err.message}`);
    }
  };

  const openSyncModal = (plan: PlanResponse) => {
    setSelectedPlan(plan);
    setForceUpgrades(false);
    setShowSyncModal(true);
  };

  const handleSyncToStripe = async () => {
    if (!selectedPlan) return;

    try {
      const options = {
        sync_prices: true,
        create_if_missing: true,
        archive_old_prices: forceUpgrades
      };

      await adminAPI.syncPlanWithStripe(selectedPlan.id, options);
      setShowSyncModal(false);
      setSelectedPlan(null);
      setForceUpgrades(false);
      alert('Plan successfully synced to Stripe!');
      fetchPlans();
    } catch (err: any) {
      alert(`Error syncing plan to Stripe: ${err.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      monthly_price: '',
      annual_price: '',
      old_monthly_price: '',
      old_annual_price: '',
      is_recommended: false,
      features: [],
      is_free: false,
      is_active: true,
    });
    setSelectedPlan(null);
    setModalError(null);
  };

  const openEditModal = (plan: PlanResponse) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      monthly_price: plan.monthly_price,
      annual_price: plan.annual_price ?? '',
      old_monthly_price: plan.old_monthly_price || '',
      old_annual_price: plan.old_annual_price || '',
      is_recommended: plan.is_recommended || false,
      features: plan.features || [],
      is_active: plan.is_active,
    });
    setShowEditModal(true);
  };

  const formatCurrency = (amount: string | number | null) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(amount));
  };

  return (
    <div className={`flex-1 overflow-auto ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'}`}>
      <div className={`border-b px-4 sm:px-6 py-4 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className={`text-xl sm:text-2xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
              Plan Management
            </h1>
            <p className={`text-sm mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
              Manage subscription plans and pricing
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90"
          >
            Create New Plan
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {loading ? (
          <LoadingSpinner height="py-12" />
        ) : error ? (
          <div className="text-red-500 text-center py-12">Error: {error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan: PlanResponse) => (
              <div
                key={plan.id}
                className={`rounded-xl border p-6 ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'} ${!plan.is_active ? 'opacity-70' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className={`text-lg font-semibold truncate ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`} title={plan.name}>
                      {plan.name}
                    </h3>
                    <div className="flex gap-2 mt-1">
                      {parseFloat(plan.monthly_price) === 0 && (
                        <span className="inline-block px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                          Free Plan
                        </span>
                      )}
                      {plan.is_recommended && (
                        <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          Recommended
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full shrink-0 whitespace-nowrap ${
                    plan.is_active
                      ? 'bg-purple-100 text-purple-800'
                      : darkMode
                        ? 'bg-red-900/30 text-red-400'
                        : 'bg-red-100 text-red-700'
                  }`}>
                    {plan.is_active ? 'Active' : 'Deactivated'}
                  </span>
                </div>

                <p className={`mt-2 text-sm line-clamp-2 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`} title={plan.description || 'No description'}>
                  {plan.description || 'No description'}
                </p>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Monthly Price:</span>
                    <div className="flex items-center gap-2">
                      {plan.old_monthly_price && (
                        <span className={`text-sm line-through ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-400'}`}>
                          {formatCurrency(plan.old_monthly_price)}
                        </span>
                      )}
                      <span className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                        {formatCurrency(plan.monthly_price)}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Annual Price:</span>
                    <div className="flex items-center gap-2">
                      {plan.old_annual_price && (
                        <span className={`text-sm line-through ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-400'}`}>
                          {formatCurrency(plan.old_annual_price)}
                        </span>
                      )}
                      <span className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                        {formatCurrency(plan.annual_price)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <div className="relative action-dropdown-container">
                    <button
                      onClick={() => setActionDropdown(actionDropdown === plan.id ? null : plan.id)}
                      className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        darkMode ? 'text-zenible-dark-text' : 'text-gray-500'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                    {actionDropdown === plan.id && (
                      <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg z-10 ${
                        darkMode ? 'bg-zenible-dark-card' : 'bg-white'
                      } ring-1 ring-black ring-opacity-5`}>
                        <div className="py-1">
                          <button
                            onClick={() => {
                              openEditModal(plan);
                              setActionDropdown(null);
                            }}
                            className={`block px-4 py-2 text-sm w-full text-left ${
                              darkMode
                                ? 'text-zenible-dark-text hover:bg-zenible-dark-bg'
                                : 'text-gray-900 hover:bg-gray-100'
                            }`}
                          >
                            Edit
                          </button>
                          {!plan.is_active && (
                            <button
                              onClick={() => {
                                handleActivatePlan(plan.id);
                                setActionDropdown(null);
                              }}
                              className={`block px-4 py-2 text-sm w-full text-left ${
                                darkMode
                                  ? 'text-zenible-dark-text hover:bg-zenible-dark-bg'
                                  : 'text-gray-900 hover:bg-gray-100'
                              }`}
                            >
                              Activate
                            </button>
                          )}
                          <button
                            onClick={() => {
                              openSyncModal(plan);
                              setActionDropdown(null);
                            }}
                            className={`block px-4 py-2 text-sm w-full text-left ${
                              darkMode
                                ? 'text-zenible-dark-text hover:bg-zenible-dark-bg'
                                : 'text-gray-900 hover:bg-gray-100'
                            }`}
                          >
                            Sync to Stripe
                          </button>
                          {plan.is_active && (
                            <button
                              onClick={() => {
                                handleDeactivatePlan(plan.id);
                                setActionDropdown(null);
                              }}
                              className={`block px-4 py-2 text-sm w-full text-left ${
                                darkMode
                                  ? 'text-orange-400 hover:bg-zenible-dark-bg'
                                  : 'text-orange-600 hover:bg-gray-100'
                              }`}
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-lg mx-4 rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                {showCreateModal ? 'Create New Plan' : 'Edit Plan'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <input
                type="text"
                placeholder="Plan Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                rows={3}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm mb-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                    Monthly Price
                  </label>
                  <input
                    type="number"
                    placeholder="Monthly Price"
                    value={formData.monthly_price}
                    onChange={(e) => setFormData({ ...formData, monthly_price: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm mb-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                    Annual Price
                  </label>
                  <input
                    type="number"
                    placeholder="Annual Price"
                    value={formData.annual_price}
                    onChange={(e) => setFormData({ ...formData, annual_price: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm mb-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                    Old Monthly Price (Sale)
                  </label>
                  <input
                    type="number"
                    placeholder="Old Monthly Price (optional)"
                    value={formData.old_monthly_price}
                    onChange={(e) => setFormData({ ...formData, old_monthly_price: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm mb-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'}`}>
                    Old Annual Price (Sale)
                  </label>
                  <input
                    type="number"
                    placeholder="Old Annual Price (optional)"
                    value={formData.old_annual_price}
                    onChange={(e) => setFormData({ ...formData, old_annual_price: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                  />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="mr-2"
                  />
                  <span className={darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}>Active</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_recommended}
                    onChange={(e) => setFormData({ ...formData, is_recommended: e.target.checked })}
                    className="mr-2"
                  />
                  <span className={darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}>Recommended</span>
                </label>
              </div>
              {modalError && (
                <div className={`p-3 rounded-lg ${
                  darkMode
                    ? 'bg-red-900/20 border border-red-800 text-red-400'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm whitespace-pre-wrap">{modalError}</div>
                  </div>
                </div>
              )}
            </div>
            <div className={`px-6 py-4 border-t flex gap-2 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <button
                onClick={showCreateModal ? handleCreatePlan : handleUpdatePlan}
                className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90"
              >
                {showCreateModal ? 'Create' : 'Update'}
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  resetForm();
                  setModalError(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stripe Sync Modal */}
      {showSyncModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md mx-4 rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
                Sync Plan to Stripe
              </h3>
            </div>
            <div className="p-6">
              <div className={`mb-4 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
                <p className="mb-3">
                  Sync "<strong>{selectedPlan.name}</strong>" to Stripe?
                </p>
                <p className="text-sm mb-4">
                  This will create or update the product and pricing in your Stripe account.
                </p>
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-zenible-dark-bg' : 'bg-gray-50'} text-sm`}>
                  <p className="mb-2"><strong>What will happen:</strong></p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Create product in Stripe if it doesn't exist</li>
                    <li>Update pricing information</li>
                    <li>Sync monthly and annual prices</li>
                  </ul>
                </div>
              </div>

              <div className={`p-3 rounded-lg border ${
                forceUpgrades
                  ? darkMode
                    ? 'bg-orange-900/20 border-orange-800'
                    : 'bg-orange-50 border-orange-200'
                  : darkMode
                    ? 'bg-zenible-dark-bg border-zenible-dark-border'
                    : 'bg-gray-50 border-gray-200'
              }`}>
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={forceUpgrades}
                    onChange={(e) => setForceUpgrades(e.target.checked)}
                    className="mr-3 mt-1"
                  />
                  <div>
                    <span className={`font-medium ${
                      darkMode ? 'text-zenible-dark-text' : 'text-gray-900'
                    }`}>
                      Force Upgrades
                    </span>
                    <p className={`text-sm mt-1 ${
                      darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'
                    }`}>
                      Archive old prices and force existing customers to upgrade to new pricing.
                      <span className={`font-medium ${
                        forceUpgrades
                          ? darkMode ? 'text-orange-400' : 'text-orange-600'
                          : ''
                      }`}>
                        {' '}This will affect active subscriptions!
                      </span>
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className={`px-6 py-4 border-t flex gap-2 justify-end ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
              <button
                onClick={() => {
                  setShowSyncModal(false);
                  setSelectedPlan(null);
                  setForceUpgrades(false);
                }}
                className={`px-4 py-2 border rounded-lg ${
                  darkMode
                    ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-bg'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSyncToStripe}
                className={`px-4 py-2 rounded-lg text-white ${
                  forceUpgrades
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-zenible-primary hover:bg-opacity-90'
                }`}
              >
                {forceUpgrades ? 'Force Sync' : 'Sync to Stripe'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
