import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPortfolios } from '../api/portfolio';
import { toggleFollow, getFollowStatus } from '../api/follow';
import { getUserProfile, updateProfile, changePassword } from '../api/user';
import { useToast } from '../context/ToastContext';
import { uploadImage } from '../api/portfolio';
import PortfolioCard from '../components/PortfolioCard';
import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../api/axios';

function EditProfileModal({ profile, onClose, onSave }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    nickname: profile.nickname ?? '',
    bio: profile.bio ?? '',
    profileImageUrl: profile.profileImageUrl ?? '',
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const handlePwChange = (e) => setPwForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await uploadImage(file);
      setForm((f) => ({ ...f, profileImageUrl: data.url }));
    } catch {
      setError('이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setError('');
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (e) {
      setError(e.response?.data?.message ?? '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setError('');
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    setSaving(true);
    try {
      await changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      showToast('비밀번호가 변경되었습니다.', 'success');
      onClose();
    } catch (e) {
      setError(e.response?.data?.message ?? '비밀번호 변경에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>프로필 편집</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-tabs">
          <button className={`modal-tab${tab === 'profile' ? ' active' : ''}`} onClick={() => setTab('profile')}>프로필</button>
          <button className={`modal-tab${tab === 'password' ? ' active' : ''}`} onClick={() => setTab('password')}>비밀번호 변경</button>
        </div>

        {error && <p className="form-error">{error}</p>}

        {tab === 'profile' && (
          <div className="modal-body">
            <div className="profile-img-upload">
              <div className="profile-avatar large">
                {form.profileImageUrl
                  ? <img src={form.profileImageUrl.startsWith('http') ? form.profileImageUrl : `${BASE_URL}${form.profileImageUrl}`} alt="프로필" className="profile-img-preview" />
                  : <span>{form.nickname.charAt(0).toUpperCase()}</span>
                }
              </div>
              <label className="btn-upload-img">
                {uploading ? '업로드 중...' : '이미지 변경'}
                <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
              </label>
            </div>
            <div className="form-group">
              <label className="form-label">닉네임</label>
              <input name="nickname" value={form.nickname} onChange={handleChange} className="form-input" maxLength={50} />
            </div>
            <div className="form-group">
              <label className="form-label">자기소개</label>
              <textarea name="bio" value={form.bio} onChange={handleChange} className="form-input" rows={4} maxLength={500} placeholder="자신을 소개해주세요" />
            </div>
            <button className="btn-primary" onClick={handleSaveProfile} disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        )}

        {tab === 'password' && (
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">현재 비밀번호</label>
              <input type="password" name="currentPassword" value={pwForm.currentPassword} onChange={handlePwChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">새 비밀번호</label>
              <input type="password" name="newPassword" value={pwForm.newPassword} onChange={handlePwChange} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">새 비밀번호 확인</label>
              <input type="password" name="confirmPassword" value={pwForm.confirmPassword} onChange={handlePwChange} className="form-input" />
            </div>
            <button className="btn-primary" onClick={handleChangePassword} disabled={saving}>
              {saving ? '변경 중...' : '비밀번호 변경'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { email } = useParams();
  const { user, signIn } = useAuth();
  const { showToast } = useToast();
  const decodedEmail = decodeURIComponent(email);
  const [portfolios, setPortfolios] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [followData, setFollowData] = useState({ following: false, followerCount: 0, followingCount: 0 });
  const [followLoading, setFollowLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const isMe = user?.email === decodedEmail;

  const loadData = useCallback(() => {
    Promise.all([
      getPortfolios({ authorEmail: decodedEmail, size: 100, sort: 'createdAt,desc' }),
      getUserProfile(decodedEmail),
      getFollowStatus(decodedEmail),
    ]).then(([portfoliosRes, profileRes, followRes]) => {
      setPortfolios(Array.isArray(portfoliosRes.data) ? portfoliosRes.data : portfoliosRes.data.content ?? []);
      setUserProfile(profileRes.data);
      setFollowData(followRes.data);
    }).catch(() => setError('정보를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [decodedEmail]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  const handleFollow = async () => {
    if (!user) return;
    setFollowLoading(true);
    try {
      const { data } = await toggleFollow(decodedEmail);
      setFollowData((prev) => ({ ...prev, following: data.following, followerCount: data.followerCount }));
    } catch {
      showToast('팔로우에 실패했습니다.', 'error');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSaveProfile = async (formData) => {
    const { data } = await updateProfile(formData);
    setUserProfile(data);
    // AuthContext user 정보도 업데이트
    const stored = JSON.parse(localStorage.getItem('user') || '{}');
    const updated = { ...stored, nickname: data.nickname, profileImageUrl: data.profileImageUrl };
    localStorage.setItem('user', JSON.stringify(updated));
    const token = localStorage.getItem('token');
    const refresh = localStorage.getItem('refreshToken');
    signIn(token, refresh, updated);
  };

  const authorName = userProfile?.nickname ?? decodedEmail;

  return (
    <div className="page-container">
      {loading ? (
        <div className="profile-header">
          <div className="profile-avatar skeleton-avatar" />
          <div className="profile-info">
            <div className="skeleton-line wide" style={{ height: 24, marginBottom: 8 }} />
            <div className="skeleton-line narrow" style={{ height: 16 }} />
          </div>
        </div>
      ) : (
        <div className="profile-header">
          <div className="profile-avatar large">
            {userProfile?.profileImageUrl
              ? <img src={userProfile.profileImageUrl.startsWith('http') ? userProfile.profileImageUrl : `${BASE_URL}${userProfile.profileImageUrl}`} alt={authorName} className="profile-img-preview" />
              : <span>{authorName.charAt(0).toUpperCase()}</span>
            }
          </div>
          <div className="profile-info">
            <h1 className="profile-name">{authorName}</h1>
            <p className="profile-email">{decodedEmail}</p>
            {userProfile?.bio && <p className="profile-bio">{userProfile.bio}</p>}
            <div className="follow-stats">
              <span><strong>{followData.followerCount}</strong> 팔로워</span>
              <span><strong>{followData.followingCount}</strong> 팔로잉</span>
            </div>
          </div>
          <div className="profile-actions">
            {isMe && (
              <button className="btn-edit-profile" onClick={() => setShowEdit(true)}>프로필 편집</button>
            )}
            {!isMe && user && (
              <button
                className={`btn-follow${followData.following ? ' following' : ''}`}
                onClick={handleFollow}
                disabled={followLoading}
              >
                {followData.following ? '팔로잉' : '팔로우'}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="list-toolbar">
        <span className="result-count">포트폴리오 {portfolios.length}개{isMe ? ' (내 포트폴리오)' : ''}</span>
        {isMe && <Link to="/portfolio/new" className="btn-new">+ 새 포트폴리오</Link>}
      </div>

      {error && <div className="status-msg error">{error}</div>}
      {!loading && !error && portfolios.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <p>등록된 포트폴리오가 없습니다.</p>
        </div>
      )}

      <div className="portfolio-grid">
        {portfolios.map((p) => (
          <PortfolioCard key={p.id} portfolio={p} />
        ))}
      </div>

      <Link to="/" className="back-link">← 목록으로</Link>

      {showEdit && (
        <EditProfileModal
          profile={userProfile ?? {}}
          onClose={() => setShowEdit(false)}
          onSave={handleSaveProfile}
        />
      )}
    </div>
  );
}
