import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import adminAPI from '../../services/adminAPI';

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  coupon_type: string;
  discount_percent: number | null;
  discount_amount: number | null;
  currency: string;
  duration: string;
  duration_in_months: number | null;
  trial_extension_days: number | null;
  requires_card: boolean;
  max_redemptions: number | null;
  times_redeemed: number;
  max_redemptions_per_user: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  stripe_coupon_id: string | null;
  plan_ids: string[];
  plan_names: string[];
  created_at: string;
}

interface Plan {
  id: string;
  name: string;
  is_active: boolean;
}

const COUPON_TYPES = [
  { value: 'FREE_ACCESS', label: 'Free Access (N months)' },
  { value: 'LIFETIME_FREE', label: 'Lifetime Free' },
  { value: 'TRIAL_EXTENSION', label: 'Trial Extension' },
  { value: 'PERCENT_OFF', label: 'Percentage Off' },
  { value: 'AMOUNT_OFF', label: 'Fixed Amount Off' },
];

const DURATION_OPTIONS = [
  { value: 'ONCE', label: 'Once' },
  { value: 'REPEATING', label: 'Repeating' },
  { value: 'FOREVER', label: 'Forever' },
];

const defaultFormData = {
  code: '',
  description: '',
  coupon_type: 'PERCENT_OFF',
  discount_percent: '',
  discount_amount: '',
  currency: 'USD',
  duration: 'ONCE',
  duration_in_months: '',
  trial_extension_days: '',
  requires_card: true,
  max_redemptions: '',
  max_redemptions_per_user: '1',
  starts_at: '',
  expires_at: '',
  plan_ids: [] as string[],
};

export default function CouponManagement() {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState(defaultFormData);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionCoupon, setActionCoupon] = useState<Coupon | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionAnchor, setActionAnchor] = useState<{ top: number; left: number } | null>(null);
  const [syncAllLoading, setSyncAllLoading] = useState(false);

  useEffect(() => {
    if (!actionCoupon) return;
    const onClick = () => { setActionCoupon(null); setActionAnchor(null); };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [actionCoupon]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [couponsRes, plansRes] = await Promise.all([
        adminAPI.getCoupons({ per_page: '100' }) as Promise<any>,
        adminAPI.getPlans({ include_inactive: 'false', per_page: '100' }) as Promise<any>,
      ]);
      setCoupons(couponsRes.items || []);
      setPlans((plansRes.plans || plansRes.items || []).filter((p: Plan) => p.is_active));
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormData(defaultFormData);
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      coupon_type: coupon.coupon_type,
      discount_percent: coupon.discount_percent?.toString() || '',
      discount_amount: coupon.discount_amount?.toString() || '',
      currency: coupon.currency,
      duration: coupon.duration,
      duration_in_months: coupon.duration_in_months?.toString() || '',
      trial_extension_days: coupon.trial_extension_days?.toString() || '',
      requires_card: coupon.requires_card,
      max_redemptions: coupon.max_redemptions?.toString() || '',
      max_redemptions_per_user: coupon.max_redemptions_per_user.toString(),
      starts_at: coupon.starts_at ? coupon.starts_at.slice(0, 16) : '',
      expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 16) : '',
      plan_ids: coupon.plan_ids || [],
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setFormError(null);
    try {
      if (editingCoupon) {
        await adminAPI.updateCoupon(editingCoupon.id, {
          description: formData.description || null,
          requires_card: formData.requires_card,
          max_redemptions: formData.max_redemptions ? parseInt(formData.max_redemptions) : null,
          max_redemptions_per_user: parseInt(formData.max_redemptions_per_user) || 1,
          expires_at: formData.expires_at || null,
          plan_ids: formData.plan_ids.length > 0 ? formData.plan_ids : [],
        });
      } else {
        const payload: Record<string, unknown> = {
          code: formData.code,
          description: formData.description || null,
          coupon_type: formData.coupon_type,
          duration: formData.duration,
          max_redemptions_per_user: parseInt(formData.max_redemptions_per_user) || 1,
          plan_ids: formData.plan_ids,
        };
        if (formData.discount_percent) payload.discount_percent = parseFloat(formData.discount_percent);
        if (formData.discount_amount) payload.discount_amount = parseFloat(formData.discount_amount);
        if (formData.duration_in_months) payload.duration_in_months = parseInt(formData.duration_in_months);
        if (formData.trial_extension_days) payload.trial_extension_days = parseInt(formData.trial_extension_days);
        payload.requires_card = formData.requires_card;
        if (formData.max_redemptions) payload.max_redemptions = parseInt(formData.max_redemptions);
        if (formData.starts_at) payload.starts_at = new Date(formData.starts_at).toISOString();
        if (formData.expires_at) payload.expires_at = new Date(formData.expires_at).toISOString();
        if (formData.currency) payload.currency = formData.currency;
        await adminAPI.createCoupon(payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err: unknown) {
      const msg = (err as any)?.response?.detail || (err as Error).message || 'Failed to save coupon';
      setFormError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (fn: () => Promise<unknown>, errMsg: string) => {
    setActionError(null);
    setActionLoading(true);
    try {
      await fn();
      setActionCoupon(null);
      fetchData();
    } catch (err: unknown) {
      setActionError((err as Error).message || errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = (couponId: string) =>
    runAction(() => adminAPI.deactivateCoupon(couponId), 'Failed to deactivate coupon');
  const handleActivate = (couponId: string) =>
    runAction(() => adminAPI.updateCoupon(couponId, { is_active: true }), 'Failed to activate coupon');
  const handleDelete = (couponId: string) =>
    runAction(() => adminAPI.deleteCoupon(couponId), 'Failed to delete coupon');
  const handleSyncStripe = (couponId: string) =>
    runAction(() => adminAPI.syncCouponToStripe(couponId), 'Failed to sync to Stripe');

  const getTypeLabel = (type: string) => COUPON_TYPES.find(t => t.value === type)?.label || type;

  const getDiscountDisplay = (coupon: Coupon) => {
    const parts: string[] = [];
    // Trial days (any type)
    if (coupon.trial_extension_days && coupon.trial_extension_days > 0) {
      parts.push(`${coupon.trial_extension_days}-day trial`);
    }
    // Discount/free (based on type + fields)
    if (coupon.coupon_type === 'LIFETIME_FREE') {
      parts.push('Free forever');
    } else if (coupon.coupon_type === 'FREE_ACCESS') {
      parts.push(`Free for ${coupon.duration_in_months} mo`);
    } else if (coupon.discount_percent && coupon.discount_percent > 0) {
      parts.push(`${coupon.discount_percent}% off`);
    } else if (coupon.discount_amount && parseFloat(String(coupon.discount_amount)) > 0) {
      parts.push(`$${coupon.discount_amount} off`);
    }
    // No card
    if (!coupon.requires_card) {
      parts.push('no card');
    }
    return parts.length > 0 ? parts.join(' + ') : '-';
  };

  const showField = (field: string) => {
    const t = formData.coupon_type;
    if (field === 'discount_percent') return t === 'PERCENT_OFF' || t === 'TRIAL_EXTENSION';
    if (field === 'discount_amount') return t === 'AMOUNT_OFF' || t === 'TRIAL_EXTENSION';
    if (field === 'duration_in_months') return t === 'FREE_ACCESS' || (t === 'PERCENT_OFF' && formData.duration === 'REPEATING') || (t === 'AMOUNT_OFF' && formData.duration === 'REPEATING');
    if (field === 'trial_extension_days') return true;  // Any type can have trial days
    if (field === 'duration') return t === 'PERCENT_OFF' || t === 'AMOUNT_OFF';
    return true;
  };

  const togglePlanId = (planId: string) => {
    setFormData(prev => ({
      ...prev,
      plan_ids: prev.plan_ids.includes(planId)
        ? prev.plan_ids.filter(id => id !== planId)
        : [...prev.plan_ids, planId],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Coupons</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              if (!confirm('Recreate Stripe coupons for ALL non-trial coupons? Use this after switching between live and test Stripe keys.')) return;
              setSyncAllLoading(true);
              setError(null);
              try {
                const result = await adminAPI.syncAllCouponsToStripe() as {
                  synced: string[];
                  failed: { code: string; error: string }[];
                  skipped?: { code: string; reason: string }[];
                  total: number;
                };
                fetchData();
                const skippedCount = result.skipped?.length || 0;
                const skippedNote = skippedCount > 0
                  ? ` (${skippedCount} skipped: ${result.skipped!.map(s => s.code).join(', ')} — trial coupons handled locally)`
                  : '';
                if (result.failed.length > 0) {
                  setError(`Synced ${result.synced.length}/${result.total}. Failed: ${result.failed.map(f => `${f.code} (${f.error})`).join(', ')}${skippedNote}`);
                } else {
                  setError(`Synced ${result.synced.length}/${result.total} coupons to Stripe.${skippedNote}`);
                }
              } catch (err: unknown) {
                setError((err as Error).message || 'Failed to sync coupons');
              } finally {
                setSyncAllLoading(false);
              }
            }}
            disabled={syncAllLoading}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'} disabled:opacity-50`}
          >
            {syncAllLoading ? 'Syncing...' : 'Sync All to Stripe'}
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
          >
            Create Coupon
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-medium">Dismiss</button>
        </div>
      )}

      {/* Coupons Table */}
      <div className={`border rounded-lg overflow-hidden ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <table className="w-full text-sm">
          <thead className={darkMode ? 'bg-gray-800' : 'bg-gray-50'}>
            <tr>
              <th className="text-left px-4 py-3 font-medium">Code</th>
              <th className="text-left px-4 py-3 font-medium">Type</th>
              <th className="text-left px-4 py-3 font-medium">Discount</th>
              <th className="text-left px-4 py-3 font-medium">Usage</th>
              <th className="text-left px-4 py-3 font-medium">Plans</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Expires</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">No coupons created yet</td>
              </tr>
            ) : (
              coupons.map(coupon => (
                <tr key={coupon.id} className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className="px-4 py-3 font-mono font-medium">{coupon.code}</td>
                  <td className="px-4 py-3">{getTypeLabel(coupon.coupon_type)}</td>
                  <td className="px-4 py-3">{getDiscountDisplay(coupon)}</td>
                  <td className="px-4 py-3">
                    {coupon.times_redeemed}{coupon.max_redemptions ? `/${coupon.max_redemptions}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    {coupon.plan_names.length > 0 ? coupon.plan_names.join(', ') : 'All plans'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      coupon.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {coupon.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (actionCoupon?.id === coupon.id) {
                          setActionCoupon(null);
                          setActionAnchor(null);
                        } else {
                          const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                          setActionCoupon(coupon);
                          setActionAnchor({ top: rect.bottom + 4, left: rect.right - 224 });
                          setActionError(null);
                        }
                      }}
                      className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                      title="Actions"
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <circle cx="10" cy="4" r="1.5" />
                        <circle cx="10" cy="10" r="1.5" />
                        <circle cx="10" cy="16" r="1.5" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-lg rounded-xl shadow-xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">
                {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
              </h2>

              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {formError}
                </div>
              )}

              <div className="space-y-4">
                {/* Code */}
                <div>
                  <label className="block text-sm font-medium mb-1">Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    disabled={!!editingCoupon}
                    className={`w-full px-3 py-2 border rounded-lg text-sm font-mono ${
                      darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                    } ${editingCoupon ? 'opacity-50' : ''}`}
                    placeholder="PROMO2026"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-1">Description (admin note)</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg text-sm ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    placeholder="Internal description"
                  />
                </div>

                {/* Type */}
                {!editingCoupon && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Coupon Type</label>
                    <select
                      value={formData.coupon_type}
                      onChange={(e) => setFormData(prev => ({ ...prev, coupon_type: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg text-sm ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    >
                      {COUPON_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Conditional fields */}
                {!editingCoupon && showField('discount_percent') && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Discount Percent</label>
                    <input
                      type="number"
                      value={formData.discount_percent}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount_percent: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg text-sm ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                      min="0" max="100" step="0.01"
                    />
                  </div>
                )}

                {!editingCoupon && showField('discount_amount') && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Discount Amount ($)</label>
                    <input
                      type="number"
                      value={formData.discount_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount_amount: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg text-sm ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                      min="0" step="0.01"
                    />
                  </div>
                )}

                {!editingCoupon && showField('duration') && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Duration</label>
                    <select
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg text-sm ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    >
                      {DURATION_OPTIONS.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {!editingCoupon && showField('duration_in_months') && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Duration (months)</label>
                    <input
                      type="number"
                      value={formData.duration_in_months}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration_in_months: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg text-sm ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                      min="1" max="120"
                    />
                  </div>
                )}

                {!editingCoupon && showField('trial_extension_days') && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Trial Extension (days)</label>
                    <input
                      type="number"
                      value={formData.trial_extension_days}
                      onChange={(e) => setFormData(prev => ({ ...prev, trial_extension_days: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg text-sm ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                      min="1" max="365"
                    />
                  </div>
                )}

                {/* Requires card */}
                {/* Requires card */}
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requires_card}
                      onChange={(e) => setFormData(prev => ({ ...prev, requires_card: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-300 peer-checked:bg-purple-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-purple-300 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                  <span className="text-sm font-medium">Require card details</span>
                </div>

                {/* Max redemptions */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Redemptions</label>
                    <input
                      type="number"
                      value={formData.max_redemptions}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_redemptions: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg text-sm ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                      min="1" placeholder="Unlimited"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Per-User Limit</label>
                    <input
                      type="number"
                      value={formData.max_redemptions_per_user}
                      onChange={(e) => setFormData(prev => ({ ...prev, max_redemptions_per_user: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg text-sm ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                      min="1"
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  {!editingCoupon && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Start Date</label>
                      <input
                        type="datetime-local"
                        value={formData.starts_at}
                        onChange={(e) => setFormData(prev => ({ ...prev, starts_at: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg text-sm ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-1">Expiry Date</label>
                    <input
                      type="datetime-local"
                      value={formData.expires_at}
                      onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg text-sm ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    />
                  </div>
                </div>

                {/* Plans */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Applicable Plans <span className="text-gray-400 font-normal">(none = all plans)</span>
                  </label>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {plans.map(plan => (
                      <label key={plan.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.plan_ids.includes(plan.id)}
                          onChange={() => togglePlanId(plan.id)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{plan.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                    darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingCoupon ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action popover (fixed-positioned to escape table overflow) */}
      {actionCoupon && actionAnchor && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ top: actionAnchor.top, left: Math.max(8, actionAnchor.left) }}
          className={`fixed z-50 w-56 rounded-lg shadow-lg border ${
            darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}
        >
          {actionError && (
            <div className="px-3 pt-3">
              <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-2">
                {actionError}
              </p>
            </div>
          )}
          <div className="p-1.5 flex flex-col">
            <button
              onClick={() => { openEditModal(actionCoupon); setActionCoupon(null); setActionAnchor(null); }}
              disabled={actionLoading}
              className={`text-left px-3 py-2 rounded-md text-sm font-medium ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} disabled:opacity-50`}
            >
              Edit
            </button>
            {actionCoupon.coupon_type !== 'TRIAL_EXTENSION' && (
              <button
                onClick={() => handleSyncStripe(actionCoupon.id)}
                disabled={actionLoading}
                className={`text-left px-3 py-2 rounded-md text-sm font-medium text-blue-600 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-50'} disabled:opacity-50`}
              >
                {actionLoading ? 'Syncing...' : 'Sync to Stripe'}
              </button>
            )}
            {actionCoupon.is_active ? (
              <button
                onClick={() => handleDeactivate(actionCoupon.id)}
                disabled={actionLoading}
                className={`text-left px-3 py-2 rounded-md text-sm font-medium text-yellow-600 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-yellow-50'} disabled:opacity-50`}
              >
                Deactivate
              </button>
            ) : (
              <button
                onClick={() => handleActivate(actionCoupon.id)}
                disabled={actionLoading}
                className={`text-left px-3 py-2 rounded-md text-sm font-medium text-green-600 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-green-50'} disabled:opacity-50`}
              >
                Activate
              </button>
            )}
            <button
              onClick={() => {
                if (confirm('Delete this coupon? This action cannot be undone.')) {
                  handleDelete(actionCoupon.id);
                }
              }}
              disabled={actionLoading}
              className={`text-left px-3 py-2 rounded-md text-sm font-medium text-red-600 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-red-50'} disabled:opacity-50`}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
