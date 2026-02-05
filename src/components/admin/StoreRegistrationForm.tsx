import { useState } from 'react';
import { db, ref, set } from '@/services/firebase';
import type { StoreGenre, ChildrenPolicy, AllergyPolicy } from '@/types';
import './StoreRegistrationForm.css';

interface StoreRegistrationFormProps {
  onRegistered: (storeId: string) => void;
}

const GENRE_OPTIONS: StoreGenre[] = [
  '和食', '魚料理', '鶏料理', 'うどん・そば', 'とんかつ', '中華', '洋食', 'カレー', 'その他',
];

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

export default function StoreRegistrationForm({ onRegistered }: StoreRegistrationFormProps) {
  const [formData, setFormData] = useState({
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
    initialCount: '10',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // バリデーション
    if (!formData.name || !formData.lat || !formData.lng) {
      setError('店舗名と位置情報は必須です');
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

    const lat = parseFloat(formData.lat);
    const lng = parseFloat(formData.lng);

    if (isNaN(lat) || isNaN(lng)) {
      setError('位置情報は数値で入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      // 店舗IDを生成（シンプルなタイムスタンプベース）
      const storeId = `store_${Date.now()}`;

      // Firebaseに店舗データを登録
      const storeData = {
        isOpen: false,
        remainingCount: parseInt(formData.initialCount) || 10,
        lastUpdated: Date.now(),
        location: { lat, lng },
        // 店舗マスタ情報
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        genre: formData.genre,
        childrenPolicy: formData.childrenPolicy,
        allergyPolicy: formData.allergyPolicy,
        teishokuName: formData.teishokuName || '本日の定食',
        teishokuPrice: parseInt(formData.teishokuPrice) || 800,
        createdAt: Date.now(),
      };

      await set(ref(db, `stores/${storeId}`), storeData);

      onRegistered(storeId);
    } catch (err) {
      console.error('Registration error:', err);
      setError('登録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 現在地を取得
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

  return (
    <div className="registration-form card">
      <h2>店舗情報登録</h2>
      <p className="registration-subtitle">一度登録すれば変更は少なめ。ユーザーへの基本情報を設定します。</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">店舗名 *</label>
          <input
            type="text"
            name="name"
            className="form-input"
            value={formData.name}
            onChange={handleChange}
            placeholder="店舗名を入力"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">住所 *</label>
          <input
            type="text"
            name="address"
            className="form-input"
            value={formData.address}
            onChange={handleChange}
            placeholder="都道府県から住所を入力"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">電話番号 *</label>
          <input
            type="text"
            name="phone"
            className="form-input"
            value={formData.phone}
            onChange={handleChange}
            placeholder="例: 03-XXXX-XXXX"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">主なジャンル *</label>
          <select
            name="genre"
            className="form-input form-select"
            value={formData.genre}
            onChange={handleChange}
            required
          >
            <option value="">選択してください</option>
            {GENRE_OPTIONS.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
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
              placeholder="例: 本日の定食"
            />
          </div>

          <div className="form-group">
            <label className="form-label">価格（円）</label>
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
          <label className="form-label">位置情報 *</label>
          <div className="location-inputs">
            <input
              type="text"
              name="lat"
              className="form-input"
              value={formData.lat}
              onChange={handleChange}
              placeholder="緯度 (例: 35.6812)"
              required
            />
            <input
              type="text"
              name="lng"
              className="form-input"
              value={formData.lng}
              onChange={handleChange}
              placeholder="経度 (例: 139.7671)"
              required
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={getCurrentLocation}
            >
              現在地を取得
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">初期食数</label>
          <input
            type="number"
            name="initialCount"
            className="form-input"
            value={formData.initialCount}
            onChange={handleChange}
            min="0"
          />
        </div>

        {error && (
          <div className="form-error">{error}</div>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-large"
          disabled={isSubmitting}
          style={{ width: '100%', marginTop: 'var(--space-md)' }}
        >
          {isSubmitting ? '登録中...' : '基本情報を保存・更新'}
        </button>
      </form>
    </div>
  );
}
