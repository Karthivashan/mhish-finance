import { forwardRef } from 'react';
import { displayAmountInput, sanitizeAmountInput } from '../../utils/currencyUtils';

const AmountInput = forwardRef(function AmountInput({
  value, onChange, onBlur, name, invalid, describedBy, tone = 'text-ink', compact = false,
}, ref) {
  const normalizeOnBlur = () => {
    if (value !== '' && value != null && Number.isFinite(parseFloat(value))) onChange(parseFloat(value).toFixed(2));
    onBlur?.();
  };

  return (
    <div className={`flex items-center gap-2 rounded-2xl border bg-bg/40 transition focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30 ${compact ? 'px-3 py-2 sm:px-5 sm:py-4' : 'px-4 py-3 sm:px-5 sm:py-4'} ${invalid ? 'border-expense' : 'border-line'}`}>
      <span className={`${compact ? 'text-[9px] sm:text-3xl' : 'text-2xl sm:text-3xl'} font-extrabold ${tone}`} aria-hidden="true">₹</span>
      <input ref={ref} id="amount" name={name} onBlur={normalizeOnBlur} inputMode="decimal" autoComplete="off" placeholder="0.00"
        aria-invalid={invalid} aria-describedby={describedBy}
        value={displayAmountInput(value)} onChange={(event) => onChange(sanitizeAmountInput(event.target.value.replace(/,/g, '')))}
        className={`w-full min-w-0 bg-transparent font-extrabold tracking-tight tnum outline-none placeholder:text-muted/40 ${compact ? 'text-[9px] sm:text-3xl' : 'text-2xl sm:text-3xl'}`} />
    </div>
  );
});

export default AmountInput;
