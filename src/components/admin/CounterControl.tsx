import './CounterControl.css';

interface CounterControlProps {
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onSetCount: (count: number) => void;
  disabled?: boolean;
}

const QUICK_SET_VALUES = [5, 10, 15, 20];

export default function CounterControl({
  count,
  onIncrement,
  onDecrement,
  onSetCount,
  disabled = false,
}: CounterControlProps) {
  return (
    <div className={`counter-control ${disabled ? 'disabled' : ''}`}>
      <h2 className="counter-label">残り食数</h2>

      <div className="counter-main">
        <button
          className="counter-btn decrement"
          onClick={onDecrement}
          disabled={disabled || count <= 0}
          aria-label="減らす"
        >
          −
        </button>

        <div className="counter-display">
          <span className="counter-value">{count}</span>
          <span className="counter-unit">食</span>
        </div>

        <button
          className="counter-btn increment"
          onClick={onIncrement}
          disabled={disabled}
          aria-label="増やす"
        >
          ＋
        </button>
      </div>

      <div className="quick-set">
        <span className="quick-set-label">クイック設定:</span>
        <div className="quick-set-buttons">
          {QUICK_SET_VALUES.map((value) => (
            <button
              key={value}
              className={`quick-set-btn ${count === value ? 'active' : ''}`}
              onClick={() => onSetCount(value)}
              disabled={disabled}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
