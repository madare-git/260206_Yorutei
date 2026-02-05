import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStoreAdmin } from '@/hooks/useStoreAdmin';
import { useStoreRealtimeSingle } from '@/hooks/useStoreRealtime';
import StatusToggle from '@/components/admin/StatusToggle';
import CounterControl from '@/components/admin/CounterControl';
import StoreRegistrationForm from '@/components/admin/StoreRegistrationForm';
import './DashboardPage.css';

export default function DashboardPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(storeId || null);
  const [showRegistration, setShowRegistration] = useState(false);

  const status = useStoreRealtimeSingle(selectedStoreId || '');
  const { toggleOpen, updateRemainingCount, setRemainingCount } = useStoreAdmin(selectedStoreId || '');

  // 店舗登録完了時
  const handleStoreRegistered = (newStoreId: string) => {
    setSelectedStoreId(newStoreId);
    setShowRegistration(false);
  };

  // 店舗未選択または登録フォーム表示時
  if (!selectedStoreId || showRegistration) {
    return (
      <div className="dashboard-page">
        <header className="dashboard-header">
          <h1>よる定 店舗管理</h1>
        </header>
        <main className="dashboard-main">
          <StoreRegistrationForm onRegistered={handleStoreRegistered} />
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>よる定 店舗管理</h1>
        <button
          className="btn btn-secondary"
          onClick={() => setShowRegistration(true)}
        >
          新規店舗登録
        </button>
      </header>

      <main className="dashboard-main">
        {!status ? (
          <div className="loading-screen">
            <div className="loading-spinner" />
            <p>店舗情報を読み込み中...</p>
          </div>
        ) : (
          <>
            {/* メインコントロールパネル */}
            <section className="control-panel card">
              <StatusToggle
                isOpen={status.isOpen}
                onToggle={toggleOpen}
              />

              <div className="divider" />

              <CounterControl
                count={status.remainingCount}
                onIncrement={() => updateRemainingCount(1)}
                onDecrement={() => updateRemainingCount(-1)}
                onSetCount={setRemainingCount}
                disabled={!status.isOpen}
              />
            </section>

            {/* 本日の実績（将来拡張用） */}
            <section className="stats-panel card mt-md">
              <h3>本日の状況</h3>
              <div className="stats-grid mt-sm">
                <div className="stat-item">
                  <span className="stat-label">残り食数</span>
                  <span className="stat-value">{status.remainingCount}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">ステータス</span>
                  <span className={`stat-value ${status.isOpen ? 'text-success' : 'text-danger'}`}>
                    {status.isOpen ? '提供中' : '停止中'}
                  </span>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
