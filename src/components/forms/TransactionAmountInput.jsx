import { Check, Delete, X } from 'lucide-react';
import { useState } from 'react';
import { displayAmountInput } from '../../utils/currencyUtils';

const MAX_AMOUNT = 999999999.99;

export default function AmountInput({ value, onChange, invalid, describedBy }) {
  const [accumulator, setAccumulator] = useState(null);
  const [operator, setOperator] = useState(null);
  const [replaceNext, setReplaceNext] = useState(value !== '' && value != null);
  const [calculatorError, setCalculatorError] = useState('');
  const current = value === '' || value == null ? '0' : String(value);

  const update = (next) => {
    onChange(next);
    setCalculatorError('');
  };

  const enterDigit = (digit) => {
    if (replaceNext) {
      update(digit === '.' ? '0.' : digit);
      setReplaceNext(false);
      return;
    }
    if (digit === '.' && current.includes('.')) return;
    const next = current === '0' && digit !== '.' ? digit : current + digit;
    const [integer, decimal] = next.split('.');
    if (integer.length > 9 || (decimal && decimal.length > 2)) return;
    update(next);
  };

  const calculate = (left, right, op) => {
    if (op === '+') return left + right;
    if (op === '-') return left - right;
    if (op === '*') return left * right;
    if (op === '/') return right === 0 ? NaN : left / right;
    return right;
  };

  const evaluate = () => {
    if (accumulator === null || !operator) return;
    const result = calculate(accumulator, Number(current), operator);
    if (!Number.isFinite(result)) {
      setCalculatorError('Cannot divide by zero.');
      return;
    }
    const rounded = Number(result.toFixed(2));
    if (Math.abs(rounded) > MAX_AMOUNT) {
      setCalculatorError('That amount is too large.');
      return;
    }
    update(String(rounded));
    setAccumulator(null);
    setOperator(null);
    setReplaceNext(true);
  };

  const enterOperator = (nextOperator) => {
    const result = accumulator !== null && operator && !replaceNext
      ? calculate(accumulator, Number(current), operator)
      : Number(current);
    if (!Number.isFinite(result)) {
      setCalculatorError('Cannot divide by zero.');
      return;
    }
    setAccumulator(Number(result.toFixed(2)));
    setOperator(nextOperator);
    onChange(String(Number(result.toFixed(2))));
    setReplaceNext(true);
    setCalculatorError('');
  };

  const clear = () => {
    update('');
    setAccumulator(null);
    setOperator(null);
    setReplaceNext(false);
  };

  const press = (key) => {
    if (key === 'AC') return clear();
    if (key === 'backspace') {
      if (replaceNext) {
        update('');
        setReplaceNext(false);
      } else {
        update(current.slice(0, -1) || '');
      }
      return;
    }
    if (key === '=') return evaluate();
    if (['+', '-', '*', '/'].includes(key)) return enterOperator(key);
    enterDigit(key);
  };

  const keys = [
    { key: 'AC', label: <X size={17} />, labelText: 'Clear amount', action: true },
    { key: 'backspace', label: <Delete size={18} />, labelText: 'Delete last digit', action: true },
    { key: '/', label: '÷', labelText: 'Divide', action: true },
    { key: '*', label: '×', labelText: 'Multiply', action: true },
    { key: '7', label: '7' }, { key: '8', label: '8' }, { key: '9', label: '9' },
    { key: '-', label: '−', labelText: 'Subtract', action: true },
    { key: '4', label: '4' }, { key: '5', label: '5' }, { key: '6', label: '6' },
    { key: '+', label: '+', labelText: 'Add', action: true },
    { key: '1', label: '1' }, { key: '2', label: '2' }, { key: '3', label: '3' },
    { key: '=', label: <Check size={18} />, labelText: 'Calculate', action: true },
    { key: '0', label: '0', wide: true }, { key: '.', label: '.' },
  ];

  return (
    <div>
      <div className={`mb-2 flex min-h-12 items-baseline justify-center gap-2 text-center ${invalid ? 'text-[#FF756B]' : 'text-white'}`}
        aria-live="polite" aria-invalid={invalid} aria-describedby={describedBy}>
        <span className="text-[30px] font-medium leading-none">₹</span>
        <span className="max-w-[72vw] truncate text-[32px] font-semibold leading-none tracking-tight tabular-nums sm:text-[38px]">
          {displayAmountInput(current) || '0'}
        </span>
        <span className="text-[10px] font-semibold tracking-wider text-white/40">INR</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2" role="group" aria-label="Amount calculator">
        {keys.map(({ key, label, labelText, wide }) => (
          <button key={key} type="button" aria-label={labelText || (key === '.' ? 'Decimal point' : `Enter ${key}`)}
            onClick={() => press(key)}
            className={`flex h-[40px] items-center justify-center rounded-xl text-[9px] font-semibold text-white transition active:scale-95 hover:bg-[#302638] sm:h-[46px] ${wide ? 'col-span-2' : ''} bg-[#1D1824]`}>
            {label}
          </button>
        ))}
      </div>
      {calculatorError && <p role="alert" className="mt-1 text-center text-[9px] font-medium text-[#FF756B]">{calculatorError}</p>}
    </div>
  );
}
