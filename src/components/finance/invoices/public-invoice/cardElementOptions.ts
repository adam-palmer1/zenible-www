// Card element styling for Stripe
export const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#ef4444',
    },
  },
  hidePostalCode: true, // We use a custom postal code field to support international formats
};
