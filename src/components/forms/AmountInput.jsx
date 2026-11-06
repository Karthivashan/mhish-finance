import { Calculator, Delete } from 'lucide-react';
import { forwardRef, useState } from 'react';
import { displayAmountInput, sanitizeAmountInput } from '../../utils/currencyUtils';

/** ₹ input that groups digits Indian-style as you type and keeps ≤ 2 decimals. Value is the raw numeric string. */
const AmountInput = forwardRef(function AmountInput({ value, onChange, onBlur, name, invalid, describedBy, tone = 'text-ink', calculator = false, compact = false }, ref) {
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [display, setDisplay] = useState('0');
  const [accumulator, setAccumulator] = useState(null);
  const [operator, setOperator] = useState(null);
  const [replaceNext, setReplaceNext] = useState(true);
  const [calculatorError, setCalculatorError] = useState('');

  const openCalculator = () => {
    setDisplay(value === '' || value == null ? '0' : String(value));
    setAccumulator(null);
    setOperator(null);
    setReplaceNext(true);
    setCalculatorError('');
    setCalculatorOpen(true);
  };

  const enterDigit = (digit) => {
    setCalculatorError('');
    setDisplay((current) => {
      if (replaceNext) return digit === '.' ? '0.' : digit;
      if (digit === '.' && current.includes('.')) return current;
      return current === '0' && digit !== '.' ? digit : current + digit;
    });
    setReplaceNext(false);
  };

  const clearCalculator = () => {
    setDisplay('0');
    setAccumulator(null);
    setOperator(null);
    setReplaceNext(true);
    setCalculatorError('');
  };

  const calculate = (left, right, op) => {
    if (op === '+') return left + right;
    if (op === '-') return left - right;
    if (op === '*') return left * right;
    if (op === '/') return right === 0 ? NaN : left / right;
    return right;
  };

  const enterOperator = (nextOperator) => {
    const current = Number(display);
    const result = accumulator !== null && operator && !replaceNext
      ? calculate(accumulator, current, operator)
      : current;
    if (!Number.isFinite(result)) {
      setCalculatorError('Cannot divide by zero.');
      return;
    }
    setAccumulator(result);
    setOperator(nextOperator);
    setDisplay(String(Number(result.toFixed(8))));
    setReplaceNext(true);
    setCalculatorError('');
  };

  const evaluate = () => {
    if (accumulator === null || !operator) return;
    const result = calculate(accumulator, Number(display), operator);
    if (!Number.isFinite(result)) {
      setCalculatorError('Cannot divide by zero.');
      return;
    }
    setDisplay(String(Number(result.toFixed(8))));
    setAccumulator(null);
    setOperator(null);
    setReplaceNext(true);
    setCalculatorError('');
  };

  const useCalculatorResult = () => {
    const result = Number(display);
    if (!Number.isFinite(result) || result < 0) {
      setCalculatorError('Amount must be zero or more.');
      return;
    }
    if (result > 999999999.99) {
      setCalculatorError('That amount is too large.');
      return;
    }
    onChange(sanitizeAmountInput(result.toFixed(2)));
    setCalculatorOpen(false);
  };

  return (
    <div className="space-y-2">
      <div className={`flex items-center gap-2 rounded-2xl border bg-bg/40 transition focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30 ${compact ? 'px-3 py-2 sm:px-5 sm:py-4' : 'px-4 py-3 sm:px-5 sm:py-4'} ${invalid ? 'border-expense' : 'border-line'}`}>
        <span className={`${compact ? 'text-xl sm:text-3xl' : 'text-2xl sm:text-3xl'} font-extrabold ${tone}`} aria-hidden="true">₹</span>
        <input ref={ref} id="amount" name={name}
          onBlur={() => { if (value !== '' && value != null && Number.isFinite(parseFloat(value))) onChange(parseFloat(value).toFixed(2)); onBlur?.(); }} inputMode="decimal" autoComplete="off" placeholder="0.00"
          aria-invalid={invalid} aria-describedby={describedBy}
          value={displayAmountInput(value)} onChange={(e) => onChange(sanitizeAmountInput(e.target.value.replace(/,/g, '')))}
          className={`w-full min-w-0 bg-transparent font-extrabold tracking-tight tnum outline-none placeholder:text-muted/40 ${compact ? 'text-xl sm:text-3xl' : 'text-2xl sm:text-3xl'}`} />
        {calculator && (
          <button type="button" aria-label={calculatorOpen ? 'Close amount calculator' : 'Open amount calculator'} aria-expanded={calculatorOpen} aria-controls="amount-calculator"
            onClick={calculatorOpen ? () => setCalculatorOpen(false) : openCalculator}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition hover:bg-raised hover:text-ink">
            <Calculator size={19} />
          </button>
        )}
      </div>
      {calculatorOpen && (
        <div id="amount-calculator" className="max-w-xs rounded-xl border border-line bg-surface p-3 shadow-card">
          <div className="mb-2 rounded-lg bg-bg/60 px-3 py-2 text-right text-lg font-bold tnum" aria-live="polite">
            {displayAmountInput(display)}
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            <button type="button" onClick={clearCalculator} className="h-9 rounded-lg bg-raised text-xs font-bold hover:bg-raised/70">AC</button>
            <button type="button" aria-label="Delete last digit" onClick={() => { setDisplay((current) => replaceNext ? '0' : current.slice(0, -1) || '0'); setReplaceNext(false); setCalculatorError(''); }}
              className="flex h-9 items-center justify-center rounded-lg bg-raised hover:bg-raised/70"><Delete size={15} /></button>
            <button type="button" aria-label="Divide" onClick={() => enterOperator('/')} className="h-9 rounded-lg bg-accent/15 text-sm font-semibold text-accent transition hover:bg-raised">÷</button>
            <button type="button" aria-label="Multiply" onClick={() => enterOperator('*')} className="h-9 rounded-lg bg-accent/15 text-sm font-semibold text-accent transition hover:bg-raised">×</button>
            {[['7', '7'], ['8', '8'], ['9', '9'], ['−', '-'], ['4', '4'], ['5', '5'], ['6', '6'], ['+', '+'], ['1', '1'], ['2', '2'], ['3', '3'], ['=', '=']].map(([label, key]) => (
              <button key={key} type="button" onClick={() => ['+', '-', '*', '/'].includes(key) ? enterOperator(key) : key === '=' ? evaluate() : enterDigit(key)}
                className={`h-9 rounded-lg text-sm font-semibold transition hover:bg-raised ${['+', '-', '*', '/', '='].includes(key) ? 'bg-accent/15 text-accent' : 'bg-bg/60'}`}>{label}</button>
            ))}
            <button type="button" onClick={() => enterDigit('0')} className="col-span-2 h-9 rounded-lg bg-bg/60 text-sm font-semibold hover:bg-raised">0</button>
            <button type="button" onClick={() => enterDigit('.')} className="h-9 rounded-lg bg-bg/60 text-sm font-semibold hover:bg-raised">.</button>
          </div>
          {calculatorError && <p role="alert" className="mt-2 text-xs font-semibold text-expense">{calculatorError}</p>}
          <button type="button" onClick={useCalculatorResult} className="mt-2 h-9 w-full rounded-lg bg-accent text-xs font-bold text-accent-ink hover:brightness-110">Use amount</button>
        </div>
      )}
    </div>
  );
});
export default AmountInput;
