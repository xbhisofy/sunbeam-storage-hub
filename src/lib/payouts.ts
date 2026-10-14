// Single source of truth for payout methods.
// The backend function request_withdrawal accepts exactly these values, so the
// withdrawal form, the admin payout note and the public landing page all read
// from this list instead of repeating method names.

export type PayoutValue = "upi" | "paypal" | "bank" | "usdt";

export type PayoutMethod = {
  value: PayoutValue;
  label: string;
  /** Short line shown under the method name on the public site. */
  hint: string;
  /** Field label used in the withdrawal form. */
  detailsLabel: string;
  /** Field placeholder used in the withdrawal form. */
  placeholder: string;
};

export const PAYOUT_METHODS: PayoutMethod[] = [
  { value: "upi", label: "UPI", hint: "India", detailsLabel: "UPI ID", placeholder: "name@bank" },
  { value: "paypal", label: "PayPal", hint: "PayPal account", detailsLabel: "PayPal email", placeholder: "you@example.com" },
  { value: "bank", label: "Bank Transfer", hint: "Direct to your bank", detailsLabel: "Bank details", placeholder: "Account no, IFSC, account name" },
  { value: "usdt", label: "USDT", hint: "Crypto wallet (TRC-20)", detailsLabel: "USDT wallet address", placeholder: "T…xample (TRC-20)" },
];

export const PAYOUT_METHOD_VALUES: PayoutValue[] = PAYOUT_METHODS.map((m) => m.value);

export function payoutMethod(value: string): PayoutMethod | undefined {
  return PAYOUT_METHODS.find((m) => m.value === value);
}

/** Sentence used in help copy so the listed methods never drift from the form. */
export const PAYOUT_METHODS_SENTENCE = PAYOUT_METHODS.map((m) => m.label).join(", ").replace(/, ([^,]*)$/, " and $1");
