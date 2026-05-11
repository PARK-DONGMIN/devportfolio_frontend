import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTemplates, deleteTemplate, useTemplate as applyTemplate } from '../api/template';
import { BASE_URL } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const PAGE_SIZE = 12;

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  const start = Math.max(0, page - 2);
  const end = Math.min(totalPages - 1, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);
  return (
    <div className="pagination">
      <button className="page-btn" onClick={() => onChange(0)} disabled={page === 0}>«</button>
      <button className="page-btn" onClick={() => onChange(page - 1)} disabled={page === 0}>‹</button>
      {start > 0 && <span className="page-ellipsis">…</span>}
      {pages.map((p) => (
        <button key={p} className={`page-btn${p === page ? ' page-btn--active' : ''}`} onClick={() => onChange(p)}>{p + 1}</button>
      ))}
      {end < totalPages - 1 && <span className="page-ellipsis">…</span>}
      <button className="page-btn" onClick={() => onChange(page + 1)} disabled={page === totalPages - 1}>›</button>
      <button className="page-btn" onClick={() => onChange(totalPages - 1)} disabled={page === totalPages - 1}>»</button>
    </div>
  );
}

export default function TemplateListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    setLoading(true);
    const params = { page, size: PAGE_SIZE };
    if (query) params.search = query;
    getTemplates(params)
      .then(({ data }) => {
        setTemplates(data.content ?? []);
        setTotalPages(data.totalPages ?? 1);
        setTotalElements(data.totalElements ?? 0);
      })
      .catch(() => setError('템플릿 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [query, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    setQuery(search.trim());
  };

  const handleUse = async (template) => {
    try {
      await applyTemplate(template.id);
      navigate('/portfolio/new', { state: { templateContent: template.description } });
    } catch {
      showToast('템플릿 불러오기에 실패했습니다.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('이 템플릿을 삭제할까요?')) return;
    try {
      await deleteTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      setTotalElements((prev) => prev - 1);
    } catch {
      showToast('삭제에 실패했습니다.', 'error');
    }
  };

  return (
    <div>
      <div className="hero-section" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
        <div className="hero-content">
          <h1 className="hero-title">포트폴리오 템플릿</h1>
          <p className="hero-sub">다른 개발자들의 양식을 가져다 나만의 포트폴리오를 작성해보세요</p>
          <form onSubmit={handleSearch} className="hero-search">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="템플릿 이름, 작성자로 검색..."
              className="hero-search-input"
            />
            <button type="submit" className="hero-search-btn">검색</button>
          </form>
        </div>
      </div>

      <div className="page-container">
        <div className="list-toolbar">
          <span className="result-count">{!loading && `총 ${totalElements}개의 템플릿`}</span>
        </div>

        {loading && <div className="status-msg">불러오는 중...</div>}
        {error && <div className="status-msg error">{error}</div>}
        {!loading && !error && templates.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>등록된 템플릿이 없습니다.</p>
          </div>
        )}

        <div className="template-grid">
          {templates.map((t) => (
            <div key={t.id} className="template-card">
              {t.previewImageUrl && (
                <img src={`${BASE_URL}${t.previewImageUrl}`} alt={t.title} className="template-card-img" />
              )}
              <div className="template-card-body">
                <h3 className="template-card-title">{t.title}</h3>
                {t.summary && <p className="template-card-summary">{t.summary}</p>}
                <div className="template-card-meta">
                  <span className="template-author">{t.authorName}</span>
                  <span className="template-use-count">사용 {t.useCount}회</span>
                </div>
              </div>
              <div className="template-card-actions">
                <button className="btn-primary" style={{ flex: 1 }} onClick={() => handleUse(t)}>
                  이 템플릿으로 작성
                </button>
                {user && user.id === t.authorId && (
                  <button className="btn-delete" onClick={() => handleDelete(t.id)}>삭제</button>
                )}
              </div>
            </div>
          ))}
        </div>

        <Pagination page={page} totalPages={totalPages} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
      </div>
    </div>
  );
}
