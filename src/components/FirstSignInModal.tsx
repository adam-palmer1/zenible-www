import React, { useState, useEffect } from 'react';
import { usePreferences } from '../contexts/PreferencesContext';
import { useCRMReferenceData } from '../contexts/CRMReferenceDataContext';
import { useCountries } from '../hooks/crm/useCountries';
import { useCompanyCurrencies } from '../hooks/crm/useCompanyCurrencies';
import { useCompanyAttributes } from '../hooks/crm/useCompanyAttributes';
import companiesAPI from '../services/api/crm/companies';
import planAPI from '../services/planAPI';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { STEPS } from './first-sign-in/constants';
import { PlansApiResponse, CompanyData, CompanyProfile } from './first-sign-in/types';
import WelcomeStep from './first-sign-in/WelcomeStep';
import CompanyProfileStep from './first-sign-in/CompanyProfileStep';
import LocalizationStep from './first-sign-in/LocalizationStep';
import RegionalStep from './first-sign-in/RegionalStep';
import PlanPickerStep from './first-sign-in/PlanPickerStep';
import CompleteStep from './first-sign-in/CompleteStep';
import AddCountryModal from './first-sign-in/AddCountryModal';
import AddCurrencyModal from './first-sign-in/AddCurrencyModal';
import TimezoneModal from './first-sign-in/TimezoneModal';
import CompanyCountryModal from './first-sign-in/CompanyCountryModal';
import NumberFormatModal from './first-sign-in/NumberFormatModal';

interface FirstSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FirstSignInModal({ isOpen, onClose }: FirstSignInModalProps) {
  const { darkMode, updatePreference, reloadPreferences } = usePreferences();
  const { numberFormats } = useCRMReferenceData();

  // Countries and currencies hooks
  const {
    countries,
    companyCountries,
    loading: countriesLoading,
    addCountry,
    removeCountry,
    setDefaultCountry,
  } = useCountries();

  const {
    currencies,
    companyCurrencies,
    loading: currenciesLoading,
    addCurrency,
    removeCurrency,
    setDefaultCurrency,
  } = useCompanyCurrencies();

  const {
    getTimezone,
    setTimezone,
    getNumberFormat,
    setNumberFormat,
    loading: attributesLoading,
  } = useCompanyAttributes();

  const [currentStep, setCurrentStep] = useState('welcome');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localizationError, setLocalizationError] = useState<string | null>(null);

  // Company profile data
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({
    name: '',
    email: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
  });

  // Regional settings
  const [selectedTimezone, setSelectedTimezone] = useState(() => {
    // Default to browser's timezone
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/London';
    } catch {
      return 'Europe/London';
    }
  });
  const [selectedNumberFormat, setSelectedNumberFormat] = useState<any>(null);
  const [showTimezoneModal, setShowTimezoneModal] = useState(false);
  const [timezoneSearch, setTimezoneSearch] = useState('');
  const [showNumberFormatModal, setShowNumberFormatModal] = useState(false);

  // Localization modals
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');

  // Company country modal
  const [showCompanyCountryModal, setShowCompanyCountryModal] = useState(false);
  const [companyCountrySearch, setCompanyCountrySearch] = useState('');

  // Plan selection state
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  // Load existing data on mount
  useEffect(() => {
    if (isOpen) {
      loadExistingData();
    }
  }, [isOpen]);

  // Get browser's default number format based on locale
  const getBrowserNumberFormat = () => {
    try {
      const locale = navigator.language || 'en-US';
      // Format a sample number to detect the pattern
      const formatted = new Intl.NumberFormat(locale).format(1234.56);
      // Check if comma is used for decimal (European style: 1.234,56)
      if (formatted.includes(',') && formatted.indexOf(',') > formatted.indexOf('.')) {
        return 'european'; // e.g., 1.234,56
      }
      return 'us'; // e.g., 1,234.56
    } catch {
      return 'us';
    }
  };

  // Update regional settings when attributes load
  useEffect(() => {
    if (!attributesLoading) {
      const timezone = getTimezone();
      const numberFormat = getNumberFormat();
      if (timezone) setSelectedTimezone(timezone);
      if (numberFormat) {
        setSelectedNumberFormat(numberFormat);
      } else if (numberFormats?.length > 0) {
        // Auto-select based on browser locale if not already set
        const browserFormat = getBrowserNumberFormat();
        const matchingFormat = numberFormats.find(f => {
          const example = f.format_string?.toLowerCase() || '';
          if (browserFormat === 'european') {
            return example.includes(',') && example.lastIndexOf(',') > example.lastIndexOf('.');
          }
          return example.includes('.') && example.lastIndexOf('.') > example.lastIndexOf(',');
        });
        if (matchingFormat) {
          setSelectedNumberFormat(matchingFormat.id);
        } else {
          setSelectedNumberFormat(numberFormats[0].id);
        }
      }
    }
  }, [attributesLoading, getTimezone, getNumberFormat, numberFormats]);

  // Fetch plans when reaching the plan step
  useEffect(() => {
    if (currentStep === 'plan' && availablePlans.length === 0) {
      fetchAvailablePlans();
    }
  }, [currentStep]);

  const fetchAvailablePlans = async () => {
    try {
      setLoadingPlans(true);
      const response = await planAPI.getPublicPlans() as PlansApiResponse;
      const plansArray = response.plans || response.items || [];
      // Sort plans by price (lowest first) and filter active ones
      const sortedPlans = plansArray
        .filter(plan => plan.is_active !== false)
        .sort((a, b) => (parseFloat(a.monthly_price) || 0) - (parseFloat(b.monthly_price) || 0));
      setAvailablePlans(sortedPlans);
    } catch (_err) {
      console.error('Failed to fetch plans:', _err);
      setPlanError('Failed to load plans. You can skip this step and select a plan later in settings.');
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (subscribing) return;

    try {
      setSubscribing(true);
      setSelectedPlanId(planId);
      setPlanError(null);

      // Create new subscription
      await planAPI.createSubscription(planId, 'monthly');

      // Move to complete step
      setCurrentStep('complete');
    } catch (_err) {
      setPlanError((_err as Error).message || 'Failed to select plan. Please try again.');
    } finally {
      setSubscribing(false);
      setSelectedPlanId(null);
    }
  };

  const loadExistingData = async () => {
    setLoading(true);
    setError(null);
    try {
      const companyData = await companiesAPI.getCurrent().catch(() => null) as CompanyData | null;

      if (companyData) {
        setCompanyProfile({
          name: companyData.name || '',
          email: companyData.email || '',
          address: companyData.address || '',
          city: companyData.city || '',
          state: companyData.state || '',
          postal_code: companyData.postal_code || '',
          country: companyData.country || '',
        });
      }
    } catch (_err) {
      console.error('Failed to load data:', _err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter available countries for localization (exclude already added)
  const filteredCountries = countries.filter(
    (c) =>
      !companyCountries.find((cc) => cc.country.id === c.id) &&
      (c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.code.toLowerCase().includes(countrySearch.toLowerCase()))
  );

  // Filter countries for company profile country selection
  const filteredCompanyCountries = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(companyCountrySearch.toLowerCase()) ||
      c.code.toLowerCase().includes(companyCountrySearch.toLowerCase())
  );

  // Get selected country name for display
  const getSelectedCountryName = () => {
    if (!companyProfile.country) return '';
    const country = countries.find(c => c.name === companyProfile.country || c.code === companyProfile.country);
    return country ? country.name : companyProfile.country;
  };

  const filteredCurrencies = currencies.filter(
    (c) =>
      !companyCurrencies.find((cc) => cc.currency.id === c.id) &&
      (c.name.toLowerCase().includes(currencySearch.toLowerCase()) ||
        c.code.toLowerCase().includes(currencySearch.toLowerCase()))
  );

  // Country handlers
  const handleAddCountry = async (countryId: string) => {
    setLocalizationError(null);
    const result = await addCountry(countryId);
    if (result.success) {
      setCountrySearch('');
      setShowCountryModal(false);
    } else if (result.error) {
      setLocalizationError(result.error);
    }
  };

  const handleRemoveCountry = async (associationId: string) => {
    setLocalizationError(null);
    const result = await removeCountry(associationId);
    if (!result.success && result.error) {
      setLocalizationError(result.error);
    }
  };

  const handleSetDefaultCountry = async (associationId: string) => {
    setLocalizationError(null);
    const result = await setDefaultCountry(associationId);
    if (!result.success && result.error) {
      setLocalizationError(result.error);
    }
  };

  // Currency handlers
  const handleAddCurrency = async (currencyId: string) => {
    setLocalizationError(null);
    const result = await addCurrency(currencyId);
    if (result.success) {
      setCurrencySearch('');
      setShowCurrencyModal(false);
    } else if (result.error) {
      setLocalizationError(result.error);
    }
  };

  const handleRemoveCurrency = async (associationId: string) => {
    setLocalizationError(null);
    const result = await removeCurrency(associationId);
    if (!result.success && result.error) {
      setLocalizationError(result.error);
    }
  };

  const handleSetDefaultCurrency = async (associationId: string) => {
    setLocalizationError(null);
    const result = await setDefaultCurrency(associationId);
    if (!result.success && result.error) {
      setLocalizationError(result.error);
    }
  };

  const handleNext = async () => {
    if (currentStep === 'welcome') {
      setCurrentStep('company');
      return;
    }

    if (currentStep === 'company') {
      setSaving(true);
      try {
        await companiesAPI.updateCurrent(companyProfile);
        setCurrentStep('localization');
      } catch (_err) {
        setError('Failed to save company profile. Please try again.');
      } finally {
        setSaving(false);
      }
      return;
    }

    if (currentStep === 'localization') {
      // Countries and currencies are saved immediately via hooks
      setLocalizationError(null);
      setCurrentStep('regional');
      return;
    }

    if (currentStep === 'regional') {
      setSaving(true);
      try {
        if (selectedTimezone) {
          await setTimezone(selectedTimezone);
        }
        if (selectedNumberFormat) {
          await setNumberFormat(selectedNumberFormat);
        }
        setCurrentStep('plan');
      } catch (_err) {
        setError('Failed to save regional settings. Please try again.');
      } finally {
        setSaving(false);
      }
      return;
    }

    if (currentStep === 'plan') {
      // Skip to complete (user chose to skip plan selection)
      setCurrentStep('complete');
      return;
    }

    if (currentStep === 'complete') {
      setSaving(true);
      try {
        await updatePreference('onboarding_status', 'complete', 'user');
        await updatePreference('onboarding_reminder_date', null, 'user');
        await reloadPreferences();
        onClose();
      } catch (_err) {
        setError('Failed to complete setup. Please try again.');
      } finally {
        setSaving(false);
      }
    }
  };

  const handlePrevious = () => {
    const stepIndex = STEPS.indexOf(currentStep);
    if (stepIndex > 0) {
      setCurrentStep(STEPS[stepIndex - 1]);
    }
  };

  const handleRemindLater = async () => {
    const reminderDate = new Date();
    reminderDate.setHours(reminderDate.getHours() + 24);

    try {
      await updatePreference('onboarding_status', 'deferred', 'user');
      await updatePreference('onboarding_reminder_date', reminderDate.toISOString(), 'user');
      await reloadPreferences();
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
    onClose();
  };

  const handleSkip = async () => {
    await updatePreference('onboarding_status', 'ignored', 'user');
    await updatePreference('onboarding_reminder_date', null, 'user');
    await reloadPreferences();
    onClose();
  };

  if (!isOpen) return null;

  const isLoading = loading || countriesLoading || currenciesLoading || attributesLoading;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="p-12 text-center">
          <div className="inline-flex items-center">
            <svg className="animate-spin h-8 w-8 text-zenible-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className={`ml-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              Loading...
            </span>
          </div>
        </div>
      );
    }

    switch (currentStep) {
      case 'welcome':
        return <WelcomeStep darkMode={darkMode} onRemindLater={handleRemindLater} />;
      case 'company':
        return (
          <CompanyProfileStep
            darkMode={darkMode}
            companyProfile={companyProfile}
            setCompanyProfile={setCompanyProfile}
            countries={countries}
            getSelectedCountryName={getSelectedCountryName}
            onOpenCountryModal={() => setShowCompanyCountryModal(true)}
          />
        );
      case 'localization':
        return (
          <LocalizationStep
            darkMode={darkMode}
            localizationError={localizationError}
            companyCountries={companyCountries}
            companyCurrencies={companyCurrencies}
            onSetDefaultCountry={handleSetDefaultCountry}
            onRemoveCountry={handleRemoveCountry}
            onOpenCountryModal={() => setShowCountryModal(true)}
            onSetDefaultCurrency={handleSetDefaultCurrency}
            onRemoveCurrency={handleRemoveCurrency}
            onOpenCurrencyModal={() => setShowCurrencyModal(true)}
          />
        );
      case 'regional':
        return (
          <RegionalStep
            darkMode={darkMode}
            selectedTimezone={selectedTimezone}
            selectedNumberFormat={selectedNumberFormat}
            numberFormats={numberFormats}
            onOpenTimezoneModal={() => setShowTimezoneModal(true)}
            onOpenNumberFormatModal={() => setShowNumberFormatModal(true)}
          />
        );
      case 'plan':
        return (
          <PlanPickerStep
            darkMode={darkMode}
            loadingPlans={loadingPlans}
            availablePlans={availablePlans}
            subscribing={subscribing}
            selectedPlanId={selectedPlanId}
            planError={planError}
            onSelectPlan={handleSelectPlan}
          />
        );
      case 'complete':
        return <CompleteStep darkMode={darkMode} />;
      default:
        return <WelcomeStep darkMode={darkMode} onRemindLater={handleRemindLater} />;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'welcome':
        return 'Welcome';
      case 'company':
        return 'Company Profile';
      case 'localization':
        return 'Localization';
      case 'regional':
        return 'Regional Settings';
      case 'plan':
        return 'Choose Plan';
      case 'complete':
        return 'Complete';
      default:
        return 'Setup';
    }
  };

  const canProceed = () => {
    if (currentStep === 'company') {
      return companyProfile.name.trim() !== '';
    }
    return true;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-2xl max-h-[90vh] rounded-xl shadow-xl overflow-hidden ${
        darkMode ? 'bg-zenible-dark-card' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          darkMode ? 'border-zenible-dark-border' : 'border-gray-200'
        }`}>
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
            {getStepTitle()}
          </h2>
          <button
            onClick={handleSkip}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Progress Stepper */}
        {currentStep !== 'welcome' && currentStep !== 'complete' && (
          <div className={`px-6 py-3 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-gray-200'}`}>
            <div className="flex items-center justify-center space-x-2">
              {['company', 'localization', 'regional', 'plan'].map((step, index, arr) => {
                const isActive = currentStep === step;
                const isPast = STEPS.indexOf(currentStep) > STEPS.indexOf(step);

                return (
                  <React.Fragment key={step}>
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                        isPast
                          ? 'bg-zenible-tab-bg border-[1.5px] border-zenible-primary'
                          : isActive
                          ? 'bg-white border-[1.5px] border-zenible-primary text-zenible-primary'
                          : darkMode
                          ? 'bg-zenible-dark-bg border border-zenible-dark-border text-zenible-dark-text-secondary'
                          : 'bg-white border-[1.5px] border-gray-300 text-gray-500'
                      }`}
                    >
                      {isPast ? (
                        <CheckIcon className="w-3.5 h-3.5 text-zenible-primary" />
                      ) : (
                        String(index + 1).padStart(2, '0')
                      )}
                    </div>
                    {index < arr.length - 1 && (
                      <div className={`w-8 h-[1.5px] ${
                        isPast ? 'bg-zenible-primary' : darkMode ? 'bg-zenible-dark-border' : 'bg-gray-300'
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {renderContent()}

          {/* Error message */}
          {error && (
            <div className="mx-6 mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        {!isLoading && (
          <div className={`p-4 border-t ${darkMode ? 'border-zenible-dark-border' : 'border-gray-200'}`}>
            <div className="flex gap-4">
              {currentStep === 'welcome' ? (
                <>
                  <button
                    onClick={handleSkip}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-zenible-dark-border text-gray-700 dark:text-zenible-dark-text rounded-lg hover:bg-gray-50 dark:hover:bg-zenible-dark-bg transition-colors"
                  >
                    Skip for now
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex-1 px-4 py-3 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
                  >
                    Get Started
                  </button>
                </>
              ) : currentStep === 'complete' ? (
                <button
                  onClick={handleNext}
                  disabled={saving}
                  className={`w-full px-4 py-3 bg-zenible-primary text-white rounded-lg transition-colors ${
                    saving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'
                  }`}
                >
                  {saving ? 'Finishing...' : 'Get Started'}
                </button>
              ) : currentStep === 'plan' ? (
                <>
                  <button
                    onClick={handlePrevious}
                    disabled={subscribing}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-zenible-dark-border text-gray-700 dark:text-zenible-dark-text rounded-lg hover:bg-gray-50 dark:hover:bg-zenible-dark-bg transition-colors disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={subscribing}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-zenible-dark-border text-gray-700 dark:text-zenible-dark-text rounded-lg hover:bg-gray-50 dark:hover:bg-zenible-dark-bg transition-colors disabled:opacity-50"
                  >
                    Skip for now
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handlePrevious}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-zenible-dark-border text-gray-700 dark:text-zenible-dark-text rounded-lg hover:bg-gray-50 dark:hover:bg-zenible-dark-bg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={saving || !canProceed()}
                    className={`flex-1 px-4 py-3 bg-zenible-primary text-white rounded-lg transition-colors ${
                      saving || !canProceed() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'
                    }`}
                  >
                    {saving ? 'Saving...' : 'Continue'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Country Modal */}
      {showCountryModal && (
        <AddCountryModal
          darkMode={darkMode}
          filteredCountries={filteredCountries}
          countrySearch={countrySearch}
          setCountrySearch={setCountrySearch}
          onAdd={handleAddCountry}
          onClose={() => setShowCountryModal(false)}
        />
      )}

      {/* Add Currency Modal */}
      {showCurrencyModal && (
        <AddCurrencyModal
          darkMode={darkMode}
          filteredCurrencies={filteredCurrencies}
          currencySearch={currencySearch}
          setCurrencySearch={setCurrencySearch}
          onAdd={handleAddCurrency}
          onClose={() => setShowCurrencyModal(false)}
        />
      )}

      {/* Timezone Modal */}
      {showTimezoneModal && (
        <TimezoneModal
          darkMode={darkMode}
          selectedTimezone={selectedTimezone}
          timezoneSearch={timezoneSearch}
          setTimezoneSearch={setTimezoneSearch}
          onSelect={setSelectedTimezone}
          onClose={() => setShowTimezoneModal(false)}
        />
      )}

      {/* Company Country Modal */}
      {showCompanyCountryModal && (
        <CompanyCountryModal
          darkMode={darkMode}
          companyProfile={companyProfile}
          setCompanyProfile={setCompanyProfile}
          filteredCompanyCountries={filteredCompanyCountries}
          companyCountrySearch={companyCountrySearch}
          setCompanyCountrySearch={setCompanyCountrySearch}
          onClose={() => setShowCompanyCountryModal(false)}
        />
      )}

      {/* Number Format Modal */}
      {showNumberFormatModal && (
        <NumberFormatModal
          darkMode={darkMode}
          numberFormats={numberFormats}
          selectedNumberFormat={selectedNumberFormat}
          onSelect={setSelectedNumberFormat}
          onClose={() => setShowNumberFormatModal(false)}
        />
      )}
    </div>
  );
}
