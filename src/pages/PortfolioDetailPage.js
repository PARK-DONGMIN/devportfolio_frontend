import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPortfolio, deletePortfolio, likePortfolio, toggleVisibility } from '../api/portfolio';
import { getComments, addComment, updateComment, deleteComment } from '../api/comment';
import { createTemplate } from '../api/template';
import { BASE_URL } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Link2 from '@tiptap/extension-link';
import { chatWithPortfolio } from '../api/ai';
import '../components/RichEditor.css';

function RichViewer({ content }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: false, underline: false }),
      Underline, TextStyle,
      Highlight.configure({ multicolor: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({ inline: false }),
      Link2.configure({ openOnClick: true }),
    ],
    content: (() => {
      if (!content) return '';
      try { return JSON.parse(content); } catch { return content; }
    })(),
    editable: false,
  });

  return <EditorContent editor={editor} className="re-content" />;
}

function CommentSection({ portfolioId, currentUser }) {
  const { showToast } = useToast();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    getComments(portfolioId).then(({ data }) => setComments(data)).catch(() => {});
  }, [portfolioId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await addComment(portfolioId, { content: text.trim() });
      setComments((prev) => [...prev, data]);
      setText('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditStart = (c) => {
    setEditingId(c.id);
    setEditText(c.content);
  };

  const handleEditSave = async (commentId) => {
    if (!editText.trim()) return;
    try {
      const { data } = await updateComment(portfolioId, commentId, { content: editText.trim() });
      setComments((prev) => prev.map((c) => c.id === commentId ? data : c));
      setEditingId(null);
    } catch {
      showToast('댓글 수정에 실패했습니다.', 'error');
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('댓글을 삭제할까요?')) return;
    await deleteComment(portfolioId, commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  return (
    <div className="detail-section">
      <h2 className="section-title">댓글 {comments.length > 0 && <span className="comment-count">{comments.length}</span>}</h2>
      <div className="comment-list">
        {comments.length === 0 && <p className="comment-empty">첫 번째 댓글을 남겨보세요.</p>}
        {comments.map((c) => (
          <div key={c.id} className="comment-item">
            <div className="comment-meta">
              <Link to={`/profile/${encodeURIComponent(c.authorEmail)}`} className="comment-author">{c.authorName}</Link>
              <span className="comment-date">{new Date(c.createdAt).toLocaleDateString('ko-KR')}</span>
              {c.updatedAt && <span className="comment-edited">(수정됨)</span>}
              {currentUser && currentUser.nickname === c.authorName && editingId !== c.id && (
                <button className="comment-edit-btn" onClick={() => handleEditStart(c)}>수정</button>
              )}
              {currentUser && (currentUser.nickname === c.authorName || currentUser.role === 'ADMIN') && (
                <button className="comment-delete" onClick={() => handleDelete(c.id)}>삭제</button>
              )}
            </div>
            {editingId === c.id ? (
              <div className="comment-edit-form">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="comment-input"
                  rows={2}
                  maxLength={1000}
                />
                <div className="comment-edit-actions">
                  <button className="btn-primary" onClick={() => handleEditSave(c.id)}>저장</button>
                  <button className="btn-cancel" onClick={() => setEditingId(null)}>취소</button>
                </div>
              </div>
            ) : (
              <p className="comment-content">{c.content}</p>
            )}
          </div>
        ))}
      </div>
      {currentUser && (
        <form onSubmit={handleSubmit} className="comment-form">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="댓글을 입력하세요..."
            className="comment-input"
            rows={3}
            maxLength={1000}
          />
          <button type="submit" disabled={submitting || !text.trim()} className="btn-primary comment-submit">
            {submitting ? '등록 중...' : '댓글 등록'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function PortfolioDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [liking, setLiking] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getPortfolio(id)
      .then(({ data }) => {
        setPortfolio(data);
        setLiked(data.liked);
        setLikeCount(data.likeCount ?? 0);
        setIsPublic(data.isPublic);
      })
      .catch(() => setError('포트폴리오를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleLike = async () => {
    if (!user) return;
    setLiking(true);
    try {
      const { data } = await likePortfolio(id);
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } catch {
      // ignore
    } finally {
      setLiking(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleVisibility = async () => {
    try {
      const { data } = await toggleVisibility(id);
      setIsPublic(data.isPublic);
    } catch {
      showToast('공개 설정 변경에 실패했습니다.', 'error');
    }
  };

  const handleSaveTemplate = async () => {
    if (!window.confirm('이 포트폴리오를 템플릿으로 저장할까요?')) return;
    setSavingTemplate(true);
    try {
      await createTemplate({
        title: portfolio.title,
        summary: portfolio.summary,
        description: portfolio.description,
        skills: portfolio.skills,
        previewImageUrl: portfolio.imageUrl,
      });
      showToast('템플릿으로 저장되었습니다.', 'success');
    } catch {
      showToast('템플릿 저장에 실패했습니다.', 'error');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deletePortfolio(id);
      navigate('/');
    } catch {
      showToast('삭제에 실패했습니다.', 'error');
    }
  };

  if (loading) return <div className="page-container status-msg">불러오는 중...</div>;
  if (error) return <div className="page-container status-msg error">{error}</div>;
  if (!portfolio) return null;

  const isOwner = user && (user.id === portfolio.authorId || user.email === portfolio.authorEmail);
  const isAdmin = user && user.role === 'ADMIN';
  const canEdit = isOwner || isAdmin;

  const { title, authorName, authorEmail, skills = [], summary, description, githubUrl, demoUrl, imageUrl, createdAt, updatedAt, viewCount = 0 } = portfolio;

  return (
    <div className="page-container detail-container">
      {imageUrl && (
        <div className="detail-cover">
          <img src={imageUrl.startsWith('http') ? imageUrl : `${BASE_URL}${imageUrl}`} alt={title} className="detail-cover-img" />
        </div>
      )}

      <div className="detail-header">
        <div>
          <div className="detail-title-row">
            <h1 className="detail-title">{title}</h1>
            {!isPublic && <span className="badge-private large">비공개</span>}
          </div>
          <p className="detail-meta">
            <Link to={`/profile/${encodeURIComponent(authorEmail)}`} className="detail-author-link">{authorName}</Link>
            {createdAt && <span> · {new Date(createdAt).toLocaleDateString('ko-KR')}</span>}
            {updatedAt && updatedAt !== createdAt && <span className="edited-tag"> (수정됨)</span>}
            <span className="detail-stat"> · 👁 {viewCount}</span>
          </p>
        </div>
        <div className="detail-actions">
          <button onClick={handleCopyLink} className="btn-share">
            {copied ? '✓ 복사됨' : '🔗 공유'}
          </button>
          <button
            onClick={handleLike}
            disabled={!user || liking}
            className={`btn-like${liked ? ' btn-like--active' : ''}`}
            title={user ? '' : '로그인 후 이용 가능'}
          >
            ♥ {likeCount}
          </button>
          {canEdit && (
            <button
              onClick={handleToggleVisibility}
              className={`btn-visibility${isPublic ? '' : ' active'}`}
            >
              {isPublic ? '공개' : '비공개'}
            </button>
          )}
          {isOwner && (
            <button onClick={handleSaveTemplate} className="btn-edit" disabled={savingTemplate}>
              {savingTemplate ? '저장 중...' : '템플릿으로 저장'}
            </button>
          )}
          {canEdit && (
            <>
              <Link to={`/portfolio/${id}/edit`} className="btn-edit">수정</Link>
              <button onClick={handleDelete} className="btn-delete">삭제</button>
            </>
          )}
        </div>
      </div>

      {skills.length > 0 && (
        <div className="detail-section">
          <h2 className="section-title">기술 스택</h2>
          <div className="skills-list">
            {skills.map((s) => <span key={s} className="skill-tag large">{s}</span>)}
          </div>
        </div>
      )}

      {summary && (
        <div className="detail-section">
          <h2 className="section-title">한 줄 소개</h2>
          <p className="detail-text">{summary}</p>
        </div>
      )}

      {description && (
        <div className="detail-section">
          <h2 className="section-title">상세 설명</h2>
          <div className="detail-description">
            <RichViewer content={description} />
          </div>
        </div>
      )}

      {(githubUrl || demoUrl) && (
        <div className="detail-section">
          <h2 className="section-title">링크</h2>
          <div className="detail-links">
            {githubUrl && (
              <a href={githubUrl} target="_blank" rel="noreferrer" className="link-btn github">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
                GitHub
              </a>
            )}
            {demoUrl && (
              <a href={demoUrl} target="_blank" rel="noreferrer" className="link-btn demo">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                Demo
              </a>
            )}
          </div>
        </div>
      )}

      <CommentSection portfolioId={id} currentUser={user} />

      <Link to="/" className="back-link">← 목록으로</Link>

      <PortfolioChatBot portfolioId={id} portfolioTitle={title} />
    </div>
  );
}

function PortfolioChatBot({ portfolioId, portfolioTitle }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', text: `안녕하세요! **${portfolioTitle}** 포트폴리오에 대해 궁금한 점을 물어보세요.` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const getHistory = (msgs) =>
    msgs.slice(1).map((m) => ({ role: m.role, text: m.text }));

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg = { role: 'user', text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    try {
      const { data } = await chatWithPortfolio({
        portfolioId,
        message: text,
        history: getHistory(messages),
      });
      setMessages((prev) => [...prev, { role: 'model', text: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'model', text: '죄송합니다. 잠시 후 다시 시도해주세요.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  };

  return (
    <>
      <button className="chat-fab" onClick={() => setOpen((o) => !o)} title="AI에게 질문하기">
        {open ? '✕' : '💬'}
      </button>

      {open && (
        <div className="chat-panel">
          <div className="chat-panel-header">
            <span>✨ AI 포트폴리오 어시스턴트</span>
            <button className="chat-panel-close" onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg chat-msg--${m.role}`}>
                <div className="chat-bubble">{m.text}</div>
              </div>
            ))}
            {loading && (
              <div className="chat-msg chat-msg--model">
                <div className="chat-bubble chat-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="chat-input-row">
            <input
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="질문을 입력하세요..."
              disabled={loading}
            />
            <button className="chat-send-btn" onClick={handleSend} disabled={loading || !input.trim()}>
              전송
            </button>
          </div>
        </div>
      )}
    </>
  );
}
