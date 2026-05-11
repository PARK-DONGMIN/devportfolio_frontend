import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getNotifications, markAllRead } from '../api/notification';
import useNotificationSocket from '../hooks/useNotificationSocket';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { dark, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const handleNewNotification = useCallback((notification) => {
    setUnreadCount((c) => c + 1);
    setNotifications((prev) => [notification, ...prev]);
  }, []);

  useNotificationSocket(user, handleNewNotification);

  useEffect(() => {
    if (!user) { setUnreadCount(0); setNotifications([]); }
  }, [user]);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleOpenNotif = async () => {
    if (showNotif) { setShowNotif(false); return; }
    try {
      const { data } = await getNotifications();
      setNotifications(data);
      if (unreadCount > 0) {
        await markAllRead();
        setUnreadCount(0);
      }
    } catch {}
    setShowNotif(true);
    setShowProfile(false);
  };

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="brand-icon">⚡</span>DevPortfolio
      </Link>
      <div className="navbar-links">
        <Link to="/">포트폴리오</Link>
        <Link to="/templates">템플릿</Link>
        <button className="theme-toggle" onClick={toggleTheme} title={dark ? '라이트 모드' : '다크 모드'}>
          {dark ? '☀️' : '🌙'}
        </button>
        {user ? (
          <>
            <Link to="/portfolio/new" className="btn-write">+ 작성하기</Link>

            <div className="notif-wrap" ref={notifRef}>
              <button className="notif-btn" onClick={handleOpenNotif}>
                🔔
                {unreadCount > 0 && <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
              </button>
              {showNotif && (
                <div className="notif-dropdown">
                  <div className="notif-header">알림</div>
                  {notifications.length === 0 ? (
                    <p className="notif-empty">새로운 알림이 없습니다.</p>
                  ) : (
                    <ul className="notif-list">
                      {notifications.map((n) => (
                        <li
                          key={n.id}
                          className={`notif-item${n.isRead ? '' : ' unread'}`}
                          onClick={() => {
                            if (n.portfolioId) navigate(`/portfolio/${n.portfolioId}`);
                            setShowNotif(false);
                          }}
                        >
                          <p className="notif-msg">{n.message}</p>
                          {n.portfolioTitle && <p className="notif-portfolio">{n.portfolioTitle}</p>}
                          <p className="notif-time">{new Date(n.createdAt).toLocaleDateString('ko-KR')}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="profile-wrap" ref={profileRef}>
              <button
                className="navbar-avatar-btn"
                onClick={() => { setShowProfile((p) => !p); setShowNotif(false); }}
              >
                <span className="navbar-avatar">{(user.nickname ?? user.email ?? '?')[0].toUpperCase()}</span>
                {user.role === 'ADMIN' && <span className="badge-admin">ADMIN</span>}
              </button>
              {showProfile && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-name">{user.nickname ?? user.email}</div>
                  <Link
                    to={`/profile/${encodeURIComponent(user.email)}`}
                    className="profile-dropdown-item"
                    onClick={() => setShowProfile(false)}
                  >
                    내 프로필
                  </Link>
                  <button className="profile-dropdown-item logout" onClick={handleLogout}>
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/login">로그인</Link>
            <Link to="/register" className="btn-register">회원가입</Link>
          </>
        )}
      </div>
    </nav>
  );
}
