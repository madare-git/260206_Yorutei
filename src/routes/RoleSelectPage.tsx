import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/stores/useUserStore';
import './RoleSelectPage.css';

export default function RoleSelectPage() {
  const navigate = useNavigate();
  const { user } = useUserStore();

  // 既にログイン済みの場合はリダイレクト
  useEffect(() => {
    if (user) {
      if (user.role === 'store') {
        navigate('/store/mypage');
      } else {
        navigate('/map');
      }
    }
  }, [user, navigate]);

  // ログイン済みの場合はローディング表示
  if (user) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="role-select-page">
      <div className="role-select-content">
        <h1 className="app-title">よる定</h1>
        <p className="app-subtitle">夜の定食マッチング</p>

        <div className="role-buttons">
          <button
            className="role-btn store-btn"
            onClick={() => navigate('/store/login')}
          >
            <span className="role-icon">🏪</span>
            <span className="role-label">店舗の方</span>
            <span className="role-desc">定食を提供する</span>
          </button>

          <button
            className="role-btn user-btn"
            onClick={() => navigate('/user/login')}
          >
            <span className="role-icon">🍽️</span>
            <span className="role-label">お客様</span>
            <span className="role-desc">定食を食べる</span>
          </button>
        </div>
      </div>
    </div>
  );
}
