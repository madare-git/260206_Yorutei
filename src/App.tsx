import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, getUserData } from '@/services/auth';
import { auth } from '@/services/firebase';
import { useUserStore } from '@/stores/useUserStore';

// Pages - Common
import RoleSelectPage from '@/routes/RoleSelectPage';

// Pages - Store
import StoreLoginPage from '@/routes/store/LoginPage';
import StoreRegisterPage from '@/routes/store/RegisterPage';
import StoreMyPage from '@/routes/store/MyPage';
import StoreStatusPage from '@/routes/store/StatusPage';
import StoreEditPage from '@/routes/store/EditPage';

// Pages - User
import UserLoginPage from '@/routes/user/LoginPage';
import UserRegisterPage from '@/routes/user/RegisterPage';
import MapPage from '@/routes/user/MapPage';

function App() {
  const { setUser, setLoading, isLoading } = useUserStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // ユーザーデータを取得
        const userData = await getUserData(firebaseUser.uid);
        if (userData) {
          setUser(userData);
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* 初期画面 - ロール選択 */}
      <Route path="/" element={<RoleSelectPage />} />

      {/* 店舗側 */}
      <Route path="/store/login" element={<StoreLoginPage />} />
      <Route path="/store/register" element={<StoreRegisterPage />} />
      <Route path="/store/mypage" element={<StoreMyPage />} />
      <Route path="/store/status" element={<StoreStatusPage />} />
      <Route path="/store/edit" element={<StoreEditPage />} />

      {/* ユーザー側 */}
      <Route path="/user/login" element={<UserLoginPage />} />
      <Route path="/user/register" element={<UserRegisterPage />} />
      <Route path="/map" element={<MapPage />} />

      {/* フォールバック */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
