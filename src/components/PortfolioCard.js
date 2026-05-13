import { Link, useNavigate } from 'react-router-dom';
import { BASE_URL } from '../api/axios';

export default function PortfolioCard({ portfolio, onSkillClick }) {
  const navigate = useNavigate();
  const { id, title, authorName, authorEmail, skills = [], summary, createdAt, imageUrl, isPublic, likeCount = 0, viewCount = 0, category } = portfolio;

  return (
    <Link to={`/portfolio/${id}`} className="portfolio-card">
      <div className="card-image">
        {imageUrl ? (
          <img src={`${BASE_URL}${imageUrl}`} alt={title} className="card-img" />
        ) : (
          <div className="card-img-placeholder">
            <span>{title.charAt(0).toUpperCase()}</span>
          </div>
        )}
        {!isPublic && <span className="badge-private">비공개</span>}
        {category && category !== '기타' && <span className="badge-category">{category}</span>}
      </div>
      <div className="card-body">
        <div className="card-header">
          <h3 className="card-title">{title}</h3>
          <span
            className="card-author card-author-link"
            onClick={(e) => { e.preventDefault(); navigate(`/profile/${encodeURIComponent(authorEmail)}`); }}
          >
            {authorName}
          </span>
        </div>
        {summary && <p className="card-summary">{summary}</p>}
        <div className="card-footer">
          <div className="card-skills">
            {skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="skill-tag"
                onClick={(e) => { e.preventDefault(); onSkillClick && onSkillClick(skill); }}
              >
                {skill}
              </span>
            ))}
            {skills.length > 3 && <span className="skill-more">+{skills.length - 3}</span>}
          </div>
          <div className="card-stats">
            <span className="card-stat">♥ {likeCount}</span>
            <span className="card-stat">👁 {viewCount}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
