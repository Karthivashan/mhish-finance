import { forwardRef } from 'react';
import { displayAmountInput, sanitizeAmountInput } from '../../utils/currencyUtils';

/** Large ₹ input that groups digits Indian-style as you type and keeps ≤ 2 decimals. Value is the raw numeric string. */
const AmountInput = forwardRef(function AmountInput({ value, onChange, onBlur, name, invalid, describedBy, tone = 'text-ink' }, ref) {
  return (
    <div className={`flex items-center gap-2 rounded-2xl border bg-bg/40 px-5 py-4 transition focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30 ${invalid ? 'border-expense' : 'border-line'}`}>
      <span className={`text-4xl font-extrabold ${tone}`} aria-hidden="true">₹</span>
      <input ref={ref} id="amount" name={name}
        onBlur={() => { if (value !== '' && value != null && Number.isFinite(parseFloat(value))) onChange(parseFloat(value).toFixed(2)); onBlur?.(); }} inputMode="decimal" autoComplete="off" placeholder="0.00"
        aria-invalid={invalid} aria-describedby={describedBy}
        value={displayAmountInput(value)} onChange={(e) => onChange(sanitizeAmountInput(e.target.value.replace(/,/g, '')))}
        className="w-full min-w-0 bg-transparent text-4xl font-extrabold tracking-tight tnum outline-none placeholder:text-muted/40 sm:text-5xl" />
    </div>
  );
});
export default AmountInput;
