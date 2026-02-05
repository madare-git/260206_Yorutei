import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '@/services/auth';
import { useUserStore } from '@/stores/useUserStore';
import { useStoreRealtimeSingle } from '@/hooks/useStoreRealtime';
import './MyPage.css';

export default function StoreMyPage() {
  const navigate = useNavigate();
  const { user, logout: clearUser } = useUserStore();

  const status = useStoreRealtimeSingle(user?.storeId || '');

  // ログインしていない場合はリダイレクト
  useEffect(() => {
    if (!user || user.role !== 'store') {
      navigate('/store/login');
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    clearUser();
    navigate('/');
  };

  // 認証チェック中はローディング表示
  if (!user || user.role !== 'store') {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="mypage">
      <header className="mypage-header">
        <h1>マイページ</h1>
        <button className="logout-btn" onClick={handleLogout}>
          ログアウト
        </button>
      </header>

      <main className="mypage-main">
        {/* 現在のステータス表示 */}
        {status && (
          <section className="status-summary card">
            <div className={`status-indicator ${status.isOpen ? 'open' : 'closed'}`}>
              {status.isOpen ? '提供中' : '停止中'}
            </div>
            <div className="status-count">
              残り <strong>{status.remainingCount}</strong> 食
            </div>
          </section>
        )}

        {/* メニュー */}
        <nav className="mypage-menu">
          <button
            className="menu-item primary"
            onClick={() => navigate(`/store/status`)}
          >
            <span className="menu-icon">📊</span>
            <span className="menu-label">ステータス管理</span>
            <span className="menu-desc">提供状態・残り食数を管理</span>
          </button>

          <button
            className="menu-item"
            onClick={() => navigate('/store/edit')}
          >
            <span className="menu-icon">✏️</span>
            <span className="menu-label">登録情報の変更</span>
            <span className="menu-desc">店舗情報を編集</span>
          </button>
        </nav>
      </main>
    </div>
  );
}
