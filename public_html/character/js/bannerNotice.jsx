import React, { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, Bell, Layers } from 'lucide-react';

/**
 * 通知コンポーネント
 * 1枚目・2枚目はリスト表示、3枚目以降はスタック表示
 */
const Notification = ({ notification, visualIndex, onClose }) => {
  const { id, message, type, isExiting } = notification;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  const config = {
    success: { icon: <CheckCircle className="w-5 h-5 text-green-500" />, bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' },
    error: { icon: <AlertCircle className="w-5 h-5 text-red-500" />, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800' },
    info: { icon: <Info className="w-5 h-5 text-blue-500" />, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' }
  };

  const style = config[type] || config.info;

  // レイアウト定数
  const NOTIFICATION_HEIGHT = 80;
  const GAP = 12;
  const BASE_STEP = NOTIFICATION_HEIGHT + GAP;

  // 表示位置と3Dエフェクトの計算
  let translateY = 0;
  let scale = 1;
  let opacity = 1;
  let zIndex = 100 - visualIndex;
  let blur = 'none';

  if (visualIndex === 0) {
    translateY = 0;
  } else if (visualIndex === 1) {
    translateY = BASE_STEP;
  } else {
    // 3枚目以降: 3番目の位置にスタック
    const stackDepth = visualIndex - 2;
    translateY = (BASE_STEP * 2) + (stackDepth * 8);
    scale = Math.max(0.8, 1 - stackDepth * 0.05);
    opacity = Math.max(0, 1 - stackDepth * 0.2);
    blur = stackDepth > 0 ? `blur(${stackDepth * 1}px)` : 'none';
  }

  return (
    <div 
      style={{
        zIndex: zIndex,
        transform: isExiting 
          ? `translate3d(40px, ${translateY}px, 0) scale(${scale * 0.95})` 
          : `translate3d(0, ${translateY}px, 0) scale(${scale})`,
        opacity: isExiting ? 0 : opacity,
        filter: blur,
        position: 'absolute',
        top: 0,
        right: 0,
      }}
      className={`
        transition-all duration-500 cubic-bezier(0.22, 1, 0.36, 1) w-80
        ${isExiting ? 'pointer-events-none' : 'pointer-events-auto'}
      `}
    >
      <div className={`
        flex items-start p-4 rounded-2xl border shadow-xl
        ${style.bg} ${style.border} ${style.text}
        backdrop-blur-md h-[80px]
      `}>
        <div className="flex-shrink-0 mr-3">
          {style.icon}
        </div>
        <div className="flex-grow text-xs font-bold pt-0.5 leading-tight overflow-hidden line-clamp-2">
          {message}
        </div>
        <button 
          onClick={() => onClose(id)}
          className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default function App() {
  const [notifications, setNotifications] = useState([]);

    window.addNotification = function(message, type = 'info'){
        const id = Date.now();
        // 新しいものを配列の先頭に追加 (visualIndex 0)
        setNotifications((prev) => [{ id, message, type, isExiting: false, lastIndex: 0 }, ...prev]);
    };
//       const addNotification = (message, type = 'info') => {
//     const id = Date.now();
//     // 新しいものを配列の先頭に追加 (visualIndex 0)
//     setNotifications((prev) => [{ id, message, type, isExiting: false, lastIndex: 0 }, ...prev]);
//   };

  const handleClose = useCallback((id) => {
    setNotifications((prev) => {
      // 削除対象にフラグを立て、その時のインデックスを保存
      return prev.map((n, idx) => 
        n.id === id ? { ...n, isExiting: true, lastIndex: idx } : n
      );
    });

    // アニメーション完了後に配列から削除
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 500);
  }, []);

  // 描画用のインデックス計算: 消去中のものを除外してカウント
  const getVisualIndex = (item, currentIndex) => {
    if (item.isExiting) return item.lastIndex;
    
    // 自分より前にある「消去中でない」アイテムの数をカウント
    return notifications
      .slice(0, currentIndex)
      .filter(n => !n.isExiting).length;
  };

    return (
        <div className="min-h-screen bg-slate-950 p-8 font-sans text-white overflow-hidden flex flex-col items-center justify-center">
            {/* 通知コンテナ */}
            <div className="fixed top-8 right-8 z-50 w-80 h-[500px] pointer-events-none">
                {notifications.map((n, index) => (
                    <Notification 
                        key={n.id}
                        notification={n}
                        isualIndex={getVisualIndex(n, index)}
                        onClose={handleClose}
                    />
                ))}
            </div>
        </div>
    );
}
//addNotification(message, type = 'info')