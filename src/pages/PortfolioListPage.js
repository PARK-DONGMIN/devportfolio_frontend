import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPortfolios } from '../api/portfolio';
import PortfolioCard from '../components/PortfolioCard';
import SkeletonCard from '../components/SkeletonCard';
import { useAuth } from '../context/AuthContext';

const PAGE_SIZE = 12;

const POPULAR_SKILLS = ['React', 'Spring Boot', 'Node.js', 'Vue.js', 'Python', 'TypeScript', 'Flutter', 'Java', 'Kotlin', 'Next.js'];
const CATEGORIES = ['웹', '앱', '데이터/AI', '게임', '기타'];

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
        <button
          key={p}
          className={`page-btn${p === page ? ' page-btn--active' : ''}`}
          onClick={() => onChange(p)}
        >
          {p + 1}
        </button>
      ))}
      {end < totalPages - 1 && <span className="page-ellipsis">…</span>}
      <button className="page-btn" onClick={() => onChange(page + 1)} disabled={page === totalPages - 1}>›</button>
      <button className="page-btn" onClick={() => onChange(totalPages - 1)} disabled={page === totalPages - 1}>»</button>
    </div>
  );
}

export default function PortfolioListPage() {
  const { user } = useAuth();
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sort, setSort] = useState('createdAt,desc');
  const [mineOnly, setMineOnly] = useState(false);
  const [skillFilter, setSkillFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    const params = { page, size: PAGE_SIZE, sort };
    if (query) params.search = query;
    if (skillFilter) params.skill = skillFilter;
    if (categoryFilter) params.category = categoryFilter;
    if (mineOnly && user) params.authorEmail = user.email;
    getPortfolios(params)
      .then(({ data }) => {
        if (Array.isArray(data)) {
          setPortfolios(data);
          setTotalPages(1);
          setTotalElements(data.length);
        } else {
          setPortfolios(data.content ?? []);
          setTotalPages(data.totalPages ?? 1);
          setTotalElements(data.totalElements ?? 0);
        }
      })
      .catch(() => setError('포트폴리오 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [query, page, sort, mineOnly, skillFilter, categoryFilter, user]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    setMineOnly(false);
    setSkillFilter('');
    setCategoryFilter('');
    setQuery(search.trim());
  };

  const handleSort = (e) => {
    setSort(e.target.value);
    setPage(0);
  };

  const handleMineToggle = () => {
    setMineOnly((prev) => !prev);
    setQuery('');
    setSearch('');
    setSkillFilter('');
    setCategoryFilter('');
    setPage(0);
  };

  const handleSkillClick = (skill) => {
    setSkillFilter((prev) => prev === skill ? '' : skill);
    setCategoryFilter('');
    setQuery('');
    setSearch('');
    setMineOnly(false);
    setPage(0);
  };

  const handleCategoryClick = (cat) => {
    setCategoryFilter((prev) => prev === cat ? '' : cat);
    setSkillFilter('');
    setQuery('');
    setSearch('');
    setMineOnly(false);
    setPage(0);
  };

  const handlePageChange = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">개발자 포트폴리오</h1>
          <p className="hero-sub">뛰어난 개발자들의 작업물을 만나보세요</p>
          <form onSubmit={handleSearch} className="hero-search">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름, 기술 스택으로 검색..."
              className="hero-search-input"
            />
            <button type="submit" className="hero-search-btn">검색</button>
          </form>
        </div>
      </div>

      <div className="page-container">
        <div className="filter-bar-wrap">
          <div className="filter-section">
            <span className="filter-label">카테고리</span>
            <div className="skill-filter-bar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`skill-filter-chip category-chip${categoryFilter === cat ? ' active' : ''}`}
                  onClick={() => handleCategoryClick(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-section">
            <span className="filter-label">기술 스택</span>
            <div className="skill-filter-bar">
              {POPULAR_SKILLS.map((skill) => (
                <button
                  key={skill}
                  className={`skill-filter-chip${skillFilter === skill ? ' active' : ''}`}
                  onClick={() => handleSkillClick(skill)}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="list-toolbar">
          <span className="result-count">
            {!loading && `총 ${totalElements}개의 포트폴리오`}
            {mineOnly && <span className="filter-badge"> · 내 포트폴리오</span>}
            {skillFilter && <span className="filter-badge"> · {skillFilter}</span>}
            {categoryFilter && <span className="filter-badge"> · {categoryFilter}</span>}
          </span>
          <div className="toolbar-right">
            <select value={sort} onChange={handleSort} className="sort-select">
              <option value="createdAt,desc">최신순</option>
              <option value="likeCount,desc">좋아요순</option>
              <option value="viewCount,desc">조회순</option>
            </select>
            {user && (
              <button
                onClick={handleMineToggle}
                className={`btn-mine${mineOnly ? ' active' : ''}`}
              >
                내 포트폴리오
              </button>
            )}
            {user && (
              <Link to="/portfolio/new" className="btn-new">+ 새 포트폴리오</Link>
            )}
          </div>
        </div>

        {error && <div className="status-msg error">{error}</div>}

        <div className="portfolio-grid">
          {loading
            ? Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)
            : portfolios.map((p) => (
                <PortfolioCard key={p.id} portfolio={p} onSkillClick={handleSkillClick} />
              ))
          }
        </div>

        {!loading && !error && portfolios.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📂</div>
            <p>등록된 포트폴리오가 없습니다.</p>
            {user && <Link to="/portfolio/new" className="btn-primary" style={{ marginTop: 16 }}>첫 번째 포트폴리오 작성하기</Link>}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
      </div>
    </div>
  );
}
