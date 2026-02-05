import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '@/services/auth';
import { useUserStore } from '@/stores/useUserStore';
import '../store/AuthPage.css';

export default function UserRegisterPage() {
  const navigate = useNavigate();
  const { setUser } = useUserStore();

  const [formData, setFormData] = useState({
    nickname: '',
    email: '',
    password: '',
    passwordConfirm: '',
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

    if (formData.password !== formData.passwordConfirm) {
      setError('パスワードが一致しません');
      return;
    }

    if (formData.password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }

    setIsLoading(true);

    try {
      const firebaseUser = await registerUser(
        formData.email,
        formData.password,
        formData.nickname
      );

      setUser({
        uid: firebaseUser.uid,
        role: 'user',
        email: formData.email,
        nickname: formData.nickname,
        createdAt: Date.now(),
      });

      navigate('/map');
    } catch (err: unknown) {
      console.error('Registration error:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);

      if (errorMessage.includes('email-already-in-use')) {
        setError('このメールアドレスは既に使用されています');
      } else if (errorMessage.includes('auth/operation-not-allowed')) {
        setError('メール/パスワード認証が有効になっていません。Firebase Consoleで有効にしてください。');
      } else if (errorMessage.includes('PERMISSION_DENIED')) {
        setError('データベースの書き込み権限がありません。Firebaseのルールを確認してください。');
      } else {
        setError(`登録に失敗しました: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <Link to="/" className="back-link">← 戻る</Link>

        <h1 className="auth-title">新規登録</h1>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">ニックネーム *</label>
            <input
              type="text"
              name="nickname"
              className="form-input"
              value={formData.nickname}
              onChange={handleChange}
              placeholder="よる定太郎"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">メールアドレス *</label>
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
            <label className="form-label">パスワード *</label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
              minLength={6}
              placeholder="6文字以上"
            />
          </div>

          <div className="form-group">
            <label className="form-label">パスワード確認 *</label>
            <input
              type="password"
              name="passwordConfirm"
              className="form-input"
              value={formData.passwordConfirm}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary btn-large auth-submit"
            disabled={isLoading}
          >
            {isLoading ? '登録中...' : '登録する'}
          </button>
        </form>

        <p className="auth-switch">
          既にアカウントをお持ちの方は
          <Link to="/user/login">ログイン</Link>
        </p>
      </div>
    </div>
  );
}
