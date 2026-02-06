import React, { useState, useEffect } from 'react';
import { usePreferences } from '../contexts/PreferencesContext';
import { useAuth } from '../contexts/AuthContext';
import { useCRMReferenceData } from '../contexts/CRMReferenceDataContext';
import { useCountries } from '../hooks/crm/useCountries';
import { useCompanyCurrencies } from '../hooks/crm/useCompanyCurrencies';
import { useCompanyAttributes } from '../hooks/crm/useCompanyAttributes';
import companiesAPI from '../services/api/crm/companies';
import planAPI from '../services/planAPI';
import { XMarkIcon, PlusIcon, CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

// Icons
const sparkleIcon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 28' fill='none'%3E%3Cpath d='M14 2L16.29 9.71L24 12L16.29 14.29L14 22L11.71 14.29L4 12L11.71 9.71L14 2Z' fill='%238e51ff'/%3E%3C/svg%3E";
const buildingIcon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M3 21H21M5 21V7L13 3V21M13 21H19V11L13 7M9 9V9.01M9 12V12.01M9 15V15.01M9 18V18.01' stroke='%238e51ff' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";
const globeIcon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z' stroke='%238e51ff' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M2 12H22M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z' stroke='%238e51ff' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";
const settingsIcon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z' stroke='%238e51ff' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z' stroke='%238e51ff' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";

const STEPS = ['welcome', 'company', 'localization', 'regional', 'plan', 'complete'];

// Timezone list
const TIMEZONES = [
  { value: 'America/New_York', label: 'New York', region: 'US' },
  { value: 'America/Chicago', label: 'Chicago', region: 'US' },
  { value: 'America/Denver', label: 'Denver', region: 'US' },
  { value: 'America/Los_Angeles', label: 'Los Angeles', region: 'US' },
  { value: 'America/Anchorage', label: 'Anchorage', region: 'US' },
  { value: 'Pacific/Honolulu', label: 'Honolulu', region: 'US' },
  { value: 'America/Toronto', label: 'Toronto', region: 'Canada' },
  { value: 'America/Vancouver', label: 'Vancouver', region: 'Canada' },
  { value: 'America/Mexico_City', label: 'Mexico City', region: 'Mexico' },
  { value: 'Europe/London', label: 'London', region: 'UK' },
  { value: 'Europe/Paris', label: 'Paris', region: 'France' },
  { value: 'Europe/Berlin', label: 'Berlin', region: 'Germany' },
  { value: 'Europe/Madrid', label: 'Madrid', region: 'Spain' },
  { value: 'Europe/Rome', label: 'Rome', region: 'Italy' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam', region: 'Netherlands' },
  { value: 'Europe/Stockholm', label: 'Stockholm', region: 'Sweden' },
  { value: 'Europe/Dublin', label: 'Dublin', region: 'Ireland' },
  { value: 'Europe/Lisbon', label: 'Lisbon', region: 'Portugal' },
  { value: 'Europe/Warsaw', label: 'Warsaw', region: 'Poland' },
  { value: 'Europe/Moscow', label: 'Moscow', region: 'Russia' },
  { value: 'Europe/Istanbul', label: 'Istanbul', region: 'Turkey' },
  { value: 'Asia/Tokyo', label: 'Tokyo', region: 'Japan' },
  { value: 'Asia/Seoul', label: 'Seoul', region: 'South Korea' },
  { value: 'Asia/Shanghai', label: 'Shanghai', region: 'China' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong', region: 'China' },
  { value: 'Asia/Singapore', label: 'Singapore', region: 'Singapore' },
  { value: 'Asia/Dubai', label: 'Dubai', region: 'UAE' },
  { value: 'Asia/Kolkata', label: 'Mumbai', region: 'India' },
  { value: 'Asia/Bangkok', label: 'Bangkok', region: 'Thailand' },
  { value: 'Asia/Jakarta', label: 'Jakarta', region: 'Indonesia' },
  { value: 'Australia/Sydney', label: 'Sydney', region: 'Australia' },
  { value: 'Australia/Melbourne', label: 'Melbourne', region: 'Australia' },
  { value: 'Australia/Perth', label: 'Perth', region: 'Australia' },
  { value: 'Pacific/Auckland', label: 'Auckland', region: 'New Zealand' },
  { value: 'America/Sao_Paulo', label: 'São Paulo', region: 'Brazil' },
  { value: 'America/Buenos_Aires', label: 'Buenos Aires', region: 'Argentina' },
  { value: 'Africa/Cairo', label: 'Cairo', region: 'Egypt' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg', region: 'South Africa' },
];

export default function FirstSignInModal({ isOpen, onClose }) {
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
  const [error, setError] = useState(null);
  const [localizationError, setLocalizationError] = useState(null);

  // Company profile data
  const [companyProfile, setCompanyProfile] = useState({
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
  const [selectedNumberFormat, setSelectedNumberFormat] = useState(null);
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
  const [availablePlans, setAvailablePlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [subscribing, setSubscribing] = useState(false);
  const [planError, setPlanError] = useState(null);

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
      const response = await planAPI.getPublicPlans();
      const plansArray = response.plans || response.items || response || [];
      // Sort plans by price (lowest first) and filter active ones
      const sortedPlans = plansArray
        .filter(plan => plan.is_active !== false)
        .sort((a, b) => (parseFloat(a.monthly_price) || 0) - (parseFloat(b.monthly_price) || 0));
      setAvailablePlans(sortedPlans);
    } catch (err) {
      console.error('Failed to fetch plans:', err);
      setPlanError('Failed to load plans. You can skip this step and select a plan later in settings.');
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleSelectPlan = async (planId) => {
    if (subscribing) return;

    try {
      setSubscribing(true);
      setSelectedPlanId(planId);
      setPlanError(null);

      // Create new subscription
      await planAPI.createSubscription(planId, 'monthly');

      // Move to complete step
      setCurrentStep('complete');
    } catch (err) {
      setPlanError(err.message || 'Failed to select plan. Please try again.');
    } finally {
      setSubscribing(false);
      setSelectedPlanId(null);
    }
  };

  const loadExistingData = async () => {
    setLoading(true);
    setError(null);
    try {
      const companyData = await companiesAPI.getCurrent().catch(() => null);

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
    } catch (err) {
      console.error('Failed to load data:', err);
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

  const filteredTimezones = TIMEZONES.filter(tz =>
    tz.label.toLowerCase().includes(timezoneSearch.toLowerCase()) ||
    tz.region.toLowerCase().includes(timezoneSearch.toLowerCase()) ||
    tz.value.toLowerCase().includes(timezoneSearch.toLowerCase())
  );

  const getTimezoneLabel = (value) => {
    const tz = TIMEZONES.find(t => t.value === value);
    if (tz) return `${tz.label}, ${tz.region}`;
    return value;
  };

  // Get display info for selected number format
  const getNumberFormatInfo = (formatId) => {
    const format = numberFormats?.find(f => f.id === formatId);
    if (format) return { name: format.name, example: format.format_string };
    return { name: 'Select format', example: '' };
  };

  // Country handlers
  const handleAddCountry = async (countryId) => {
    setLocalizationError(null);
    const result = await addCountry(countryId);
    if (result.success) {
      setCountrySearch('');
      setShowCountryModal(false);
    } else if (result.error) {
      setLocalizationError(result.error);
    }
  };

  const handleRemoveCountry = async (associationId) => {
    setLocalizationError(null);
    const result = await removeCountry(associationId);
    if (!result.success && result.error) {
      setLocalizationError(result.error);
    }
  };

  const handleSetDefaultCountry = async (associationId) => {
    setLocalizationError(null);
    const result = await setDefaultCountry(associationId);
    if (!result.success && result.error) {
      setLocalizationError(result.error);
    }
  };

  // Currency handlers
  const handleAddCurrency = async (currencyId) => {
    setLocalizationError(null);
    const result = await addCurrency(currencyId);
    if (result.success) {
      setCurrencySearch('');
      setShowCurrencyModal(false);
    } else if (result.error) {
      setLocalizationError(result.error);
    }
  };

  const handleRemoveCurrency = async (associationId) => {
    setLocalizationError(null);
    const result = await removeCurrency(associationId);
    if (!result.success && result.error) {
      setLocalizationError(result.error);
    }
  };

  const handleSetDefaultCurrency = async (associationId) => {
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
      } catch (err) {
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
      } catch (err) {
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
      } catch (err) {
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

  const renderWelcome = () => (
    <div className="flex flex-col items-center p-8 space-y-6">
      <div className="w-14 h-14 bg-zenible-tab-bg rounded-full flex items-center justify-center">
        <img src={sparkleIcon} alt="Sparkle" className="w-7 h-7" />
      </div>

      <div className="text-center max-w-md space-y-2">
        <h3 className={`text-xl font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          Welcome to Zenible
        </h3>
        <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
          Let's get you set up! We'll collect some basic information about your business to personalize your experience.
        </p>
      </div>

      <div className="flex gap-4 w-full max-w-lg">
        <div className={`flex-1 p-6 rounded-xl border text-center space-y-4 ${
          darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'
        }`}>
          <img src={buildingIcon} alt="Company" className="w-6 h-6 mx-auto" />
          <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
            Company Profile
          </p>
        </div>

        <div className={`flex-1 p-6 rounded-xl border text-center space-y-4 ${
          darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'
        }`}>
          <img src={globeIcon} alt="Localization" className="w-6 h-6 mx-auto" />
          <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
            Localization
          </p>
        </div>

        <div className={`flex-1 p-6 rounded-xl border text-center space-y-4 ${
          darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-gray-200'
        }`}>
          <img src={settingsIcon} alt="Regional" className="w-6 h-6 mx-auto" />
          <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
            Regional Settings
          </p>
        </div>
      </div>

      <p className={`text-xs text-center ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
        This will only take a couple of minutes
      </p>

      <button
        onClick={handleRemindLater}
        className={`text-xs text-center underline hover:no-underline transition-all ${
          darkMode ? 'text-zenible-dark-text-secondary hover:text-zenible-dark-text' : 'text-zinc-500 hover:text-zinc-700'
        }`}
      >
        Remind me later
      </button>
    </div>
  );

  const renderCompanyProfile = () => (
    <div className="p-6 space-y-6">
      <div className="text-center mb-6">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          Company Profile
        </h3>
        <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
          Tell us about your business
        </p>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              Company Name *
            </label>
            <input
              type="text"
              value={companyProfile.name}
              onChange={(e) => setCompanyProfile({ ...companyProfile, name: e.target.value })}
              placeholder="Enter company name"
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-zenible-primary`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              Company Email
            </label>
            <input
              type="email"
              value={companyProfile.email}
              onChange={(e) => setCompanyProfile({ ...companyProfile, email: e.target.value })}
              placeholder="company@example.com"
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-zenible-primary`}
            />
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
            Street Address
          </label>
          <input
            type="text"
            value={companyProfile.address}
            onChange={(e) => setCompanyProfile({ ...companyProfile, address: e.target.value })}
            placeholder="Street address"
            className={`w-full px-4 py-3 rounded-lg border ${
              darkMode
                ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-zenible-primary`}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              City
            </label>
            <input
              type="text"
              value={companyProfile.city}
              onChange={(e) => setCompanyProfile({ ...companyProfile, city: e.target.value })}
              placeholder="City"
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-zenible-primary`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              State/Province
            </label>
            <input
              type="text"
              value={companyProfile.state}
              onChange={(e) => setCompanyProfile({ ...companyProfile, state: e.target.value })}
              placeholder="State"
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-zenible-primary`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              Postal Code
            </label>
            <input
              type="text"
              value={companyProfile.postal_code}
              onChange={(e) => setCompanyProfile({ ...companyProfile, postal_code: e.target.value })}
              placeholder="12345"
              className={`w-full px-4 py-3 rounded-lg border ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-zenible-primary`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
              Country
            </label>
            <button
              type="button"
              onClick={() => setShowCompanyCountryModal(true)}
              className={`w-full px-4 py-3 rounded-lg border text-left flex items-center justify-between ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                  : 'bg-white border-gray-300 text-gray-900'
              } hover:border-zenible-primary transition-colors`}
            >
              <span className={!companyProfile.country ? (darkMode ? 'text-gray-500' : 'text-gray-400') : ''}>
                {getSelectedCountryName() || 'Select country'}
              </span>
              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLocalization = () => (
    <div className="p-6 space-y-6">
      <div className="text-center mb-6">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          Localization
        </h3>
        <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
          Select countries and currencies for your business
        </p>
      </div>

      {/* Localization Error Message */}
      {localizationError && (
        <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
          {localizationError}
        </div>
      )}

      <div className="space-y-6">
        {/* Countries Section */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
            Countries
          </label>
          <p className={`text-xs mb-3 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
            Available in contacts and addresses. Click to set as default.
          </p>

          <div className="flex flex-wrap gap-2">
            {companyCountries.map((cc) => (
              <div
                key={cc.id}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                  transition-colors cursor-pointer
                  ${cc.is_default
                    ? 'bg-zenible-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                `}
                onClick={() => !cc.is_default && handleSetDefaultCountry(cc.id)}
                title={cc.is_default ? 'Default country' : 'Click to set as default'}
              >
                {cc.is_default && <CheckIcon className="h-3.5 w-3.5" />}
                <span>{cc.country.name}</span>
                <span className="text-xs opacity-60">({cc.country.code})</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveCountry(cc.id);
                  }}
                  className={`ml-1 p-0.5 rounded-full transition-colors ${
                    cc.is_default ? 'hover:bg-white/20' : 'hover:bg-gray-300 dark:hover:bg-gray-500'
                  }`}
                  title="Remove country"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            <button
              onClick={() => setShowCountryModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-zenible-primary hover:text-zenible-primary transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Currencies Section */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
            Currencies
          </label>
          <p className={`text-xs mb-3 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
            For services, invoices, and quotes. Click to set as default.
          </p>

          <div className="flex flex-wrap gap-2">
            {companyCurrencies.map((cc) => (
              <div
                key={cc.id}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                  transition-colors cursor-pointer
                  ${cc.is_default
                    ? 'bg-zenible-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                `}
                onClick={() => !cc.is_default && handleSetDefaultCurrency(cc.id)}
                title={cc.is_default ? 'Default currency' : 'Click to set as default'}
              >
                {cc.is_default && <CheckIcon className="h-3.5 w-3.5" />}
                <span className="font-semibold">{cc.currency.code}</span>
                <span className="opacity-60">{cc.currency.symbol}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveCurrency(cc.id);
                  }}
                  className={`ml-1 p-0.5 rounded-full transition-colors ${
                    cc.is_default ? 'hover:bg-white/20' : 'hover:bg-gray-300 dark:hover:bg-gray-500'
                  }`}
                  title="Remove currency"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            <button
              onClick={() => setShowCurrencyModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-zenible-primary hover:text-zenible-primary transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRegional = () => (
    <div className="p-6 space-y-6">
      <div className="text-center mb-6">
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          Regional Settings
        </h3>
        <p className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
          Set your timezone and number format preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Timezone */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
            Timezone
          </label>
          <button
            type="button"
            onClick={() => setShowTimezoneModal(true)}
            className={`w-full px-4 py-3 border rounded-lg text-left flex items-center justify-between ${
              darkMode
                ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                : 'bg-white border-gray-300 text-gray-900'
            } hover:border-zenible-primary transition-colors`}
          >
            <span>{getTimezoneLabel(selectedTimezone)}</span>
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Number Format */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
            Number Format
          </label>
          <p className={`text-xs mb-3 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
            Choose how numbers are displayed (decimals and thousands separators)
          </p>

          <button
            type="button"
            onClick={() => setShowNumberFormatModal(true)}
            className={`w-full px-4 py-3 border rounded-lg text-left flex items-center justify-between ${
              darkMode
                ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                : 'bg-white border-gray-300 text-gray-900'
            } hover:border-zenible-primary transition-colors`}
          >
            <div>
              <span>{getNumberFormatInfo(selectedNumberFormat).name}</span>
              {getNumberFormatInfo(selectedNumberFormat).example && (
                <span className={`ml-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  (e.g. {getNumberFormatInfo(selectedNumberFormat).example})
                </span>
              )}
            </div>
            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderPlanPicker = () => (
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-2">
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
                  onClick={() => handleSelectPlan(plan.id)}
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

  const renderComplete = () => (
    <div className="flex flex-col items-center justify-center py-16 px-8">
      <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6">
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
          <path d="M20 6L9 17L4 12" stroke="#8e51ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
        You're All Set!
      </h3>

      <p className={`text-sm text-center max-w-md mx-auto mb-6 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
        Your company profile and settings have been saved. You can always update these in your settings.
      </p>

      <p className={`text-xs text-center ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-zinc-500'}`}>
        Click "Get Started" to begin using Zenible
      </p>
    </div>
  );

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
        return renderWelcome();
      case 'company':
        return renderCompanyProfile();
      case 'localization':
        return renderLocalization();
      case 'regional':
        return renderRegional();
      case 'plan':
        return renderPlanPicker();
      case 'complete':
        return renderComplete();
      default:
        return renderWelcome();
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
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => {
                setShowCountryModal(false);
                setCountrySearch('');
              }}
            />
            <div className={`relative rounded-xl shadow-xl w-full max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Add Country
                </h3>
                <button
                  onClick={() => {
                    setShowCountryModal(false);
                    setCountrySearch('');
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-4">
                <input
                  type="text"
                  placeholder="Search countries..."
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  autoFocus
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-transparent mb-3 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                  }`}
                />
                <div className="max-h-64 overflow-y-auto">
                  {filteredCountries.length === 0 ? (
                    <div className={`px-4 py-6 text-sm text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {countrySearch ? `No countries matching "${countrySearch}"` : 'All countries added'}
                    </div>
                  ) : (
                    filteredCountries.slice(0, 50).map((country) => (
                      <button
                        key={country.id}
                        onClick={() => handleAddCountry(country.id)}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between rounded-lg ${
                          darkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-900'
                        }`}
                      >
                        <span>{country.name}</span>
                        <span className="text-gray-400 text-xs">{country.code}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Currency Modal */}
      {showCurrencyModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => {
                setShowCurrencyModal(false);
                setCurrencySearch('');
              }}
            />
            <div className={`relative rounded-xl shadow-xl w-full max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Add Currency
                </h3>
                <button
                  onClick={() => {
                    setShowCurrencyModal(false);
                    setCurrencySearch('');
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-4">
                <input
                  type="text"
                  placeholder="Search currencies..."
                  value={currencySearch}
                  onChange={(e) => setCurrencySearch(e.target.value)}
                  autoFocus
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-transparent mb-3 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                  }`}
                />
                <div className="max-h-64 overflow-y-auto">
                  {filteredCurrencies.length === 0 ? (
                    <div className={`px-4 py-6 text-sm text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {currencySearch ? `No currencies matching "${currencySearch}"` : 'All currencies added'}
                    </div>
                  ) : (
                    filteredCurrencies.slice(0, 50).map((currency) => (
                      <button
                        key={currency.id}
                        onClick={() => handleAddCurrency(currency.id)}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between rounded-lg ${
                          darkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-900'
                        }`}
                      >
                        <span>
                          <span className="font-medium">{currency.code}</span>
                          <span className={`ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{currency.name}</span>
                        </span>
                        <span className="text-gray-400">{currency.symbol}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timezone Modal */}
      {showTimezoneModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => {
                setShowTimezoneModal(false);
                setTimezoneSearch('');
              }}
            />
            <div className={`relative rounded-xl shadow-xl w-full max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Select Timezone
                </h3>
                <button
                  onClick={() => {
                    setShowTimezoneModal(false);
                    setTimezoneSearch('');
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-4">
                <input
                  type="text"
                  placeholder="Search timezones..."
                  value={timezoneSearch}
                  onChange={(e) => setTimezoneSearch(e.target.value)}
                  autoFocus
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-transparent mb-3 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                  }`}
                />
                <div className="max-h-64 overflow-y-auto">
                  {filteredTimezones.length === 0 ? (
                    <div className={`px-4 py-6 text-sm text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      No timezones matching "{timezoneSearch}"
                    </div>
                  ) : (
                    filteredTimezones.map((tz) => (
                      <button
                        key={tz.value}
                        onClick={() => {
                          setSelectedTimezone(tz.value);
                          setShowTimezoneModal(false);
                          setTimezoneSearch('');
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between rounded-lg ${
                          selectedTimezone === tz.value ? 'bg-zenible-primary/10 text-zenible-primary' : ''
                        } ${darkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-900'}`}
                      >
                        <span>{tz.label}</span>
                        <span className="text-gray-400 text-xs">{tz.region}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Company Country Modal */}
      {showCompanyCountryModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => {
                setShowCompanyCountryModal(false);
                setCompanyCountrySearch('');
              }}
            />
            <div className={`relative rounded-xl shadow-xl w-full max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Select Country
                </h3>
                <button
                  onClick={() => {
                    setShowCompanyCountryModal(false);
                    setCompanyCountrySearch('');
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-4">
                <input
                  type="text"
                  placeholder="Search countries..."
                  value={companyCountrySearch}
                  onChange={(e) => setCompanyCountrySearch(e.target.value)}
                  autoFocus
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-zenible-primary focus:border-transparent mb-3 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'
                  }`}
                />
                <div className="max-h-64 overflow-y-auto">
                  {filteredCompanyCountries.length === 0 ? (
                    <div className={`px-4 py-6 text-sm text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      No countries matching "{companyCountrySearch}"
                    </div>
                  ) : (
                    filteredCompanyCountries.slice(0, 50).map((country) => (
                      <button
                        key={country.id}
                        onClick={() => {
                          setCompanyProfile({ ...companyProfile, country: country.name });
                          setShowCompanyCountryModal(false);
                          setCompanyCountrySearch('');
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between rounded-lg ${
                          companyProfile.country === country.name ? 'bg-zenible-primary/10 text-zenible-primary' : ''
                        } ${darkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-900'}`}
                      >
                        <span>{country.name}</span>
                        <span className="text-gray-400 text-xs">{country.code}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Number Format Modal */}
      {showNumberFormatModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setShowNumberFormatModal(false)}
            />
            <div className={`relative rounded-xl shadow-xl w-full max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Select Number Format
                </h3>
                <button
                  onClick={() => setShowNumberFormatModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-4">
                <div className="max-h-64 overflow-y-auto">
                  {numberFormats?.map((format) => (
                    <button
                      key={format.id}
                      onClick={() => {
                        setSelectedNumberFormat(format.id);
                        setShowNumberFormatModal(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between rounded-lg ${
                        selectedNumberFormat === format.id ? 'bg-zenible-primary/10 text-zenible-primary' : ''
                      } ${darkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-900'}`}
                    >
                      <div>
                        <div className={`font-medium ${selectedNumberFormat === format.id ? 'text-zenible-primary' : darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {format.name}
                        </div>
                        <div className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Example: {format.format_string}
                        </div>
                      </div>
                      {selectedNumberFormat === format.id && (
                        <div className="h-2 w-2 rounded-full bg-zenible-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
