import './StatusToggle.css';

interface StatusToggleProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function StatusToggle({ isOpen, onToggle }: StatusToggleProps) {
  return (
    <div className="status-toggle">
      <h2 className="status-label">提供ステータス</h2>
      <button
        className={`toggle-button ${isOpen ? 'is-open' : 'is-closed'}`}
        onClick={onToggle}
        aria-pressed={isOpen}
      >
        <span className="toggle-text">
          {isOpen ? '提供中' : '停止中'}
        </span>
        <span className="toggle-indicator" />
      </button>
      <p className="status-hint">
        {isOpen
          ? 'タップで提供を停止します'
          : 'タップで提供を開始します'
        }
      </p>
    </div>
  );
}
