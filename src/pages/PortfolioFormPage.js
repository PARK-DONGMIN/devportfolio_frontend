import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getPortfolio, createPortfolio, updatePortfolio, uploadImage } from '../api/portfolio';
import { generateDescription } from '../api/ai';
import { BASE_URL } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import RichEditor from '../components/RichEditor';

const CATEGORIES = ['웹', '앱', '데이터/AI', '게임', '기타'];

const EMPTY_FORM = {
  title: '',
  summary: '',
  description: '',
  skills: '',
  githubUrl: '',
  demoUrl: '',
  imageUrl: '',
  isPublic: true,
  category: '웹',
};

export default function PortfolioFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isEdit = Boolean(id);
  const fileInputRef = useRef(null);

  const templateContent = location.state?.templateContent;
  const [form, setForm] = useState(
    templateContent ? { ...EMPTY_FORM, description: templateContent } : EMPTY_FORM
  );
  const [preview, setPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [aiModal, setAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiHtml, setAiHtml] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (!isEdit) return;
    getPortfolio(id)
      .then(({ data }) => {
        setForm({
          title: data.title ?? '',
          summary: data.summary ?? '',
          description: data.description ?? '',
          skills: Array.isArray(data.skills) ? data.skills.join(', ') : '',
          githubUrl: data.githubUrl ?? '',
          demoUrl: data.demoUrl ?? '',
          imageUrl: data.imageUrl ?? '',
          isPublic: data.isPublic ?? true,
          category: data.category ?? '웹',
        });
        if (data.imageUrl) setPreview(data.imageUrl.startsWith('http') ? data.imageUrl : `${BASE_URL}${data.imageUrl}`);
      })
      .catch(() => setError('포트폴리오를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [id, isEdit, user, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const { data } = await uploadImage(file);
      setForm((prev) => ({ ...prev, imageUrl: data.url }));
    } catch {
      setError('이미지 업로드에 실패했습니다.');
      setPreview('');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreview('');
    setForm((prev) => ({ ...prev, imageUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const payload = {
      ...form,
      skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
    };
    try {
      if (isEdit) {
        await updatePortfolio(id, payload);
        navigate(`/portfolio/${id}`);
      } else {
        const { data } = await createPortfolio(payload);
        navigate(`/portfolio/${data.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || '저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAiGenerate = async (inputs) => {
    setAiLoading(true);
    try {
      const { data } = await generateDescription(inputs);
      setAiHtml(data.content);
      setAiModal(false);
      showToast('AI 초안이 생성되었습니다.', 'success');
    } catch (e) {
      showToast(e.response?.data?.message || 'AI 생성에 실패했습니다.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div className="page-container status-msg">불러오는 중...</div>;

  return (
    <div className="page-container form-container">
      <div className="form-page-header">
        <h1 className="page-title">{isEdit ? '포트폴리오 수정' : '포트폴리오 작성'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="portfolio-form">

        {/* 이미지 업로드 */}
        <div className="image-upload-area" onClick={() => !preview && fileInputRef.current?.click()}>
          {preview ? (
            <div className="image-preview-wrap">
              <img src={preview} alt="미리보기" className="image-preview" />
              <div className="image-overlay">
                <button type="button" className="img-btn change" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>변경</button>
                <button type="button" className="img-btn remove" onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}>삭제</button>
              </div>
              {uploading && <div className="upload-spinner">업로드 중...</div>}
            </div>
          ) : (
            <div className="image-placeholder">
              <span className="upload-icon">📷</span>
              <span>커버 이미지 추가</span>
              <span className="upload-hint">클릭하여 업로드 (최대 10MB)</span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />
        </div>

        {/* 제목 + 공개여부 */}
        <div className="title-row">
          <div className="form-group title-group">
            <label>제목 *</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="포트폴리오 제목을 입력하세요"
              required
            />
          </div>
          <div className="public-toggle">
            <label className="toggle-label">
              <span className="toggle-text">{form.isPublic ? '공개' : '비공개'}</span>
              <div className={`toggle-switch ${form.isPublic ? 'on' : 'off'}`} onClick={() => setForm(p => ({ ...p, isPublic: !p.isPublic }))}>
                <div className="toggle-thumb" />
              </div>
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>카테고리</label>
          <select name="category" value={form.category} onChange={handleChange} className="form-input">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>한 줄 소개</label>
          <input name="summary" value={form.summary} onChange={handleChange} placeholder="본인을 한 문장으로 소개해주세요" />
        </div>

        <div className="form-group">
          <label>기술 스택</label>
          <input name="skills" value={form.skills} onChange={handleChange} placeholder="React, TypeScript, Spring Boot (쉼표로 구분)" />
        </div>

        <div className="form-group">
          <div className="description-label-row">
            <label>상세 설명</label>
            <button type="button" className="btn-ai" onClick={() => setAiModal(true)}>
              ✨ AI 초안 작성
            </button>
          </div>
          <RichEditor
            content={form.description}
            onChange={(val) => setForm((prev) => ({ ...prev, description: val }))}
            externalHtml={aiHtml}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>GitHub URL</label>
            <input type="url" name="githubUrl" value={form.githubUrl} onChange={handleChange} placeholder="https://github.com/username" />
          </div>
          <div className="form-group">
            <label>Demo URL</label>
            <input type="url" name="demoUrl" value={form.demoUrl} onChange={handleChange} placeholder="https://your-demo.com" />
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="form-buttons">
          <button type="button" className="btn-cancel" onClick={() => navigate(-1)}>취소</button>
          <button type="submit" className="btn-primary" disabled={submitting || uploading}>
            {submitting ? '저장 중...' : isEdit ? '수정 완료' : '등록하기'}
          </button>
        </div>
      </form>
      {aiModal && (
        <AiAssistModal
          defaultValues={{ projectName: form.title, skills: form.skills, summary: form.summary }}
          onGenerate={handleAiGenerate}
          onClose={() => setAiModal(false)}
          loading={aiLoading}
        />
      )}
    </div>
  );
}

function AiAssistModal({ defaultValues, onGenerate, onClose, loading }) {
  const [inputs, setInputs] = useState({
    projectName: defaultValues.projectName || '',
    skills: defaultValues.skills || '',
    summary: defaultValues.summary || '',
  });

  const handleChange = (e) => setInputs((p) => ({ ...p, [e.target.name]: e.target.value }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>✨ AI 포트폴리오 초안 작성</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p className="ai-modal-desc">프로젝트 정보를 입력하면 AI가 상세 설명을 자동으로 작성해드립니다.</p>
          <div className="form-group">
            <label className="form-label">프로젝트명 *</label>
            <input name="projectName" value={inputs.projectName} onChange={handleChange} className="form-input" placeholder="예: DevPortfolio" />
          </div>
          <div className="form-group">
            <label className="form-label">기술 스택</label>
            <input name="skills" value={inputs.skills} onChange={handleChange} className="form-input" placeholder="예: React, Spring Boot, MySQL" />
          </div>
          <div className="form-group">
            <label className="form-label">프로젝트 개요</label>
            <textarea name="summary" value={inputs.summary} onChange={handleChange} className="form-input" rows={3} placeholder="프로젝트를 한두 문장으로 설명해주세요" />
          </div>
          <button
            className="btn-primary"
            onClick={() => onGenerate(inputs)}
            disabled={loading || !inputs.projectName.trim()}
            style={{ width: '100%' }}
          >
            {loading ? '✨ 생성 중...' : '✨ 초안 생성하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
