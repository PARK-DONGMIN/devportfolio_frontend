export default function SkeletonCard() {
  return (
    <div className="portfolio-card skeleton-card">
      <div className="card-image skeleton-img" />
      <div className="card-body">
        <div className="skeleton-line wide" />
        <div className="skeleton-line narrow" />
        <div className="skeleton-line medium" />
        <div className="skeleton-footer">
          <div className="skeleton-tag" />
          <div className="skeleton-tag" />
          <div className="skeleton-tag" />
        </div>
      </div>
    </div>
  );
}
