import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db, ref, get, update } from '@/services/firebase';
import { useUserStore } from '@/stores/useUserStore';
import { mapsConfig } from '@/config';
import type { StoreGenre, ChildrenPolicy, AllergyPolicy } from '@/types';
import './AuthPage.css';

const GENRES: StoreGenre[] = ['和食', '魚料理', '鶏料理', 'うどん・そば', 'とんかつ', '中華', '洋食', 'カレー', 'その他'];

const CHILDREN_POLICY_OPTIONS: { value: ChildrenPolicy; label: string }[] = [
  { value: '子供OK', label: '子供OK (制限なし)' },
  { value: '年齢制限あり', label: '年齢制限あり (例: 10歳以上)' },
  { value: '幼児NG', label: '幼児NG / 小さなお子様不可' },
];

const ALLERGY_POLICY_OPTIONS: { value: AllergyPolicy; label: string }[] = [
  { value: '可', label: '個別対応 可' },
  { value: '要相談', label: '要相談 (当日の食材次第)' },
  { value: '不可', label: '不可' },
];

export default function StoreEditPage() {
  const navigate = useNavigate();
  const { user } = useUserStore();

  const [formData, setFormData] = useState({
    ownerName: '',
    name: '',
    address: '',
    phone: '',
    genre: '' as StoreGenre | '',
    childrenPolicy: '' as ChildrenPolicy | '',
    allergyPolicy: '' as AllergyPolicy | '',
    teishokuName: '',
    teishokuPrice: '',
    lat: '',
    lng: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ログインチェック
  useEffect(() => {
    if (!user || user.role !== 'store') {
      navigate('/store/login');
    }
  }, [user, navigate]);

  // 既存データをロード
  useEffect(() => {
    if (!user?.storeId) return;

    const loadStoreData = async () => {
      try {
        const snapshot = await get(ref(db, `stores/${user.storeId}`));
        if (snapshot.exists()) {
          const data = snapshot.val();
          setFormData({
            ownerName: data.ownerName || '',
            name: data.name || '',
            address: data.address || '',
            phone: data.phone || '',
            genre: data.genre || '',
            childrenPolicy: data.childrenPolicy || '',
            allergyPolicy: data.allergyPolicy || '',
            teishokuName: data.teishokuName || '',
            teishokuPrice: data.teishokuPrice?.toString() || '',
            lat: data.location?.lat?.toString() || '',
            lng: data.location?.lng?.toString() || '',
          });
        }
      } catch (err) {
        console.error('Load store data error:', err);
        setError('店舗情報の読み込みに失敗しました');
      } finally {
        setIsDataLoading(false);
      }
    };

    loadStoreData();
  }, [user?.storeId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSuccessMessage(null);
  };

  // 住所から緯度・経度を取得
  const getLocationFromAddress = async () => {
    if (!formData.address) {
      setError('住所を入力してください');
      return;
    }

    setIsGeocodingLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(formData.address)}&key=${mapsConfig.apiKey}&language=ja`
      );

      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        setFormData(prev => ({
          ...prev,
          lat: location.lat.toFixed(6),
          lng: location.lng.toFixed(6),
        }));
      } else if (data.status === 'ZERO_RESULTS') {
        setError('住所が見つかりませんでした。より詳細な住所を入力してください。');
      } else {
        setError(`位置情報の取得に失敗しました: ${data.status}`);
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      setError('位置情報の取得に失敗しました');
    } finally {
      setIsGeocodingLoading(false);
    }
  };

  // 現在地から緯度・経度を取得
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('位置情報が利用できません');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6),
        }));
      },
      () => {
        setError('位置情報の取得に失敗しました');
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!user?.storeId) {
      setError('店舗情報が見つかりません');
      return;
    }

    if (!formData.lat || !formData.lng) {
      setError('位置情報を入力してください（「住所から取得」ボタンをクリック）');
      return;
    }

    if (!formData.genre) {
      setError('ジャンルを選択してください');
      return;
    }

    if (!formData.childrenPolicy) {
      setError('お子様の入店ポリシーを選択してください');
      return;
    }

    if (!formData.allergyPolicy) {
      setError('アレルギー対応の可否を選択してください');
      return;
    }

    setIsLoading(true);

    try {
      // 店舗マスタ情報のみを更新（isOpen, remainingCount 等は変更しない）
      const updateData = {
        ownerName: formData.ownerName,
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        genre: formData.genre,
        childrenPolicy: formData.childrenPolicy,
        allergyPolicy: formData.allergyPolicy,
        teishokuName: formData.teishokuName || '本日の定食',
        teishokuPrice: parseInt(formData.teishokuPrice) || 800,
        location: {
          lat: parseFloat(formData.lat),
          lng: parseFloat(formData.lng),
        },
      };

      await update(ref(db, `stores/${user.storeId}`), updateData);

      setSuccessMessage('店舗情報を更新しました');
    } catch (err) {
      console.error('Update error:', err);
      setError('更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.role !== 'store') {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (isDataLoading) {
    return (
      <div className="auth-page">
        <div className="auth-container" style={{ maxWidth: '500px' }}>
          <div className="loading-screen" style={{ minHeight: '300px' }}>
            <div className="loading-spinner" />
            <p>店舗情報を読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ maxWidth: '500px' }}>
        <Link to="/store/mypage" className="back-link">← マイページ</Link>

        <h1 className="auth-title">登録情報の変更</h1>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">代表者名 *</label>
            <input
              type="text"
              name="ownerName"
              className="form-input"
              value={formData.ownerName}
              onChange={handleChange}
              placeholder="山田 太郎"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">店舗名 *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              placeholder="定食屋よる定"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">店舗住所 *</label>
            <div className="address-row">
              <input
                type="text"
                name="address"
                className="form-input"
                value={formData.address}
                onChange={handleChange}
                placeholder="東京都渋谷区道玄坂1-2-3"
                required
              />
              <button
                type="button"
                className="btn btn-secondary geocode-btn"
                onClick={getLocationFromAddress}
                disabled={isGeocodingLoading || !formData.address}
              >
                {isGeocodingLoading ? '取得中...' : '住所から取得'}
              </button>
            </div>
            {formData.lat && formData.lng && (
              <p className="location-result">
                緯度: {formData.lat}, 経度: {formData.lng}
              </p>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">電話番号 *</label>
              <input
                type="tel"
                name="phone"
                className="form-input"
                value={formData.phone}
                onChange={handleChange}
                placeholder="03-1234-5678"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">ジャンル *</label>
              <select
                name="genre"
                className="form-input"
                value={formData.genre}
                onChange={handleChange}
                required
              >
                <option value="">選択してください</option>
                {GENRES.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">お子様の入店ポリシー *</label>
            <div className="radio-group">
              {CHILDREN_POLICY_OPTIONS.map(option => (
                <label key={option.value} className="radio-label">
                  <input
                    type="radio"
                    name="childrenPolicy"
                    value={option.value}
                    checked={formData.childrenPolicy === option.value}
                    onChange={handleChange}
                    required
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">アレルギー対応の可否 *</label>
            <div className="radio-group">
              {ALLERGY_POLICY_OPTIONS.map(option => (
                <label key={option.value} className="radio-label">
                  <input
                    type="radio"
                    name="allergyPolicy"
                    value={option.value}
                    checked={formData.allergyPolicy === option.value}
                    onChange={handleChange}
                    required
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">定食名</label>
              <input
                type="text"
                name="teishokuName"
                className="form-input"
                value={formData.teishokuName}
                onChange={handleChange}
                placeholder="本日の定食"
              />
            </div>

            <div className="form-group">
              <label className="form-label">定食予算（円）</label>
              <input
                type="number"
                name="teishokuPrice"
                className="form-input"
                value={formData.teishokuPrice}
                onChange={handleChange}
                placeholder="800"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">位置情報（自動入力または手動）</label>
            <div className="location-row">
              <div className="form-group">
                <input
                  type="text"
                  name="lat"
                  className="form-input"
                  value={formData.lat}
                  onChange={handleChange}
                  placeholder="緯度"
                  readOnly
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  name="lng"
                  className="form-input"
                  value={formData.lng}
                  onChange={handleChange}
                  placeholder="経度"
                  readOnly
                />
              </div>
              <button
                type="button"
                className="btn btn-outline"
                onClick={getCurrentLocation}
                title="現在地から取得"
              >
                📍
              </button>
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          {successMessage && (
            <div className="form-success">{successMessage}</div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-large auth-submit"
            disabled={isLoading}
          >
            {isLoading ? '更新中...' : '基本情報を保存・更新'}
          </button>
        </form>
      </div>
    </div>
  );
}
