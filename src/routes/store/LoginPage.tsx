import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, getUserData } from '@/services/auth';
import { useUserStore } from '@/stores/useUserStore';
import './AuthPage.css';

export default function StoreLoginPage() {
  const navigate = useNavigate();
  const { setUser } = useUserStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const firebaseUser = await login(formData.email, formData.password);
      const userData = await getUserData(firebaseUser.uid);

      if (!userData || userData.role !== 'store') {
        setError('店舗アカウントではありません');
        setIsLoading(false);
        return;
      }

      setUser(userData);
      navigate('/store/mypage');
    } catch (err: unknown) {
      console.error('Login error:', err);
      if (err instanceof Error && err.message.includes('invalid-credential')) {
        setError('メールアドレスまたはパスワードが正しくありません');
      } else {
        setError('ログインに失敗しました');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <Link to="/" className="back-link">← 戻る</Link>

        <h1 className="auth-title">店舗ログイン</h1>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">メールアドレス</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">パスワード</label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary btn-large auth-submit"
            disabled={isLoading}
          >
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <p className="auth-switch">
          アカウントをお持ちでない方は
          <Link to="/store/register">新規登録</Link>
        </p>
      </div>
    </div>
  );
}
