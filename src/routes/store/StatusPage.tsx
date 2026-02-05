import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/stores/useUserStore';
import { useStoreRealtimeSingle } from '@/hooks/useStoreRealtime';
import { useStoreAdmin } from '@/hooks/useStoreAdmin';
import './StatusPage.css';

export default function StatusPage() {
  const navigate = useNavigate();
  const { user } = useUserStore();

  const storeId = user?.storeId || '';
  const status = useStoreRealtimeSingle(storeId);
  const { toggleOpen, updateRemainingCount, setRemainingCount } = useStoreAdmin(storeId);

  // ログインしていない場合はリダイレクト
  useEffect(() => {
    if (!user || user.role !== 'store' || !user.storeId) {
      navigate('/store/login');
    }
  }, [user, navigate]);

  // 認証チェック中はローディング表示
  if (!user || user.role !== 'store' || !user.storeId) {
    return (
      <div className="status-page">
        <div className="status-loading">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  // ローディング中
  if (!status) {
    return (
      <div className="status-page">
        <div className="status-loading">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className={`status-page ${status.isOpen ? 'is-open' : 'is-closed'}`}>
      {/* 戻るボタン */}
      <button
        className="back-button"
        onClick={() => navigate('/store/mypage')}
      >
        ← マイページ
      </button>

      {/* メインステータストグル - 画面上部 */}
      <button
        className={`main-toggle ${status.isOpen ? 'open' : 'closed'}`}
        onClick={toggleOpen}
      >
        <span className="toggle-status">
          {status.isOpen ? '提供中' : '停止中'}
        </span>
        <span className="toggle-hint">
          タップで{status.isOpen ? '停止' : '開始'}
        </span>
      </button>

      {/* 残り食数コントロール - 画面下部 */}
      <div className={`count-section ${!status.isOpen ? 'disabled' : ''}`}>
        <div className="count-label">残り食数</div>

        <div className="count-control">
          <button
            className="count-btn minus"
            onClick={() => updateRemainingCount(-1)}
            disabled={!status.isOpen || status.remainingCount <= 0}
          >
            −
          </button>

          <div className="count-display">
            <span className="count-number">{status.remainingCount}</span>
            <span className="count-unit">食</span>
          </div>

          <button
            className="count-btn plus"
            onClick={() => updateRemainingCount(1)}
            disabled={!status.isOpen}
          >
            ＋
          </button>
        </div>

        {/* クイック設定 */}
        <div className="quick-buttons">
          {[5, 10, 15, 20].map((num) => (
            <button
              key={num}
              className={`quick-btn ${status.remainingCount === num ? 'active' : ''}`}
              onClick={() => setRemainingCount(num)}
              disabled={!status.isOpen}
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
