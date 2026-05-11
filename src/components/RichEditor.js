import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import { useRef, useState, useCallback } from 'react';
import { uploadImage } from '../api/portfolio';
import './RichEditor.css';

const ToolbarButton = ({ onClick, active, title, children }) => (
  <button
    type="button"
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    className={`re-btn${active ? ' re-btn--active' : ''}`}
    title={title}
  >
    {children}
  </button>
);

const Divider = () => <span className="re-divider" />;

export default function RichEditor({ content, onChange, externalHtml }) {
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: false, underline: false }),
      Underline,
      TextStyle,
      Highlight.configure({ multicolor: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: '내용을 입력하세요... (이미지는 드래그하거나 툴바 버튼을 눌러 삽입할 수 있어요)' }),
    ],
    content: (() => {
      if (!content) return '';
      try { return JSON.parse(content); } catch { return content; }
    })(),
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()));
    },
  });

  useEffect(() => {
    if (externalHtml && editor) {
      editor.commands.setContent(externalHtml);
      onChange(JSON.stringify(editor.getJSON()));
    }
  }, [externalHtml]); // eslint-disable-line react-hooks/exhaustive-deps

  const insertImage = useCallback(async (file) => {
    if (!file || !editor) return;
    setUploading(true);
    try {
      const { data } = await uploadImage(file);
      editor.chain().focus().setImage({ src: `http://localhost:8080${data.url}` }).run();
    } catch {
      showToast('이미지 업로드에 실패했습니다.', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [editor]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) insertImage(file);
  }, [insertImage]);

  if (!editor) return null;

  return (
    <div className="re-wrap" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
      <div className="re-toolbar">
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="제목 1">H1</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="제목 2">H2</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="제목 3">H3</ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="굵게"><b>B</b></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="기울임"><i>I</i></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="밑줄"><u>U</u></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="취소선"><s>S</s></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="형광펜">🖊</ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="왼쪽 정렬">&#8676;</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="가운데 정렬">&#8677;</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="오른쪽 정렬">&#8677;</ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="목록">• 목록</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="번호 목록">1. 목록</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="인용구">" 인용</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="코드블록">{'</>'}</ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="구분선">— 선</ToolbarButton>
        <ToolbarButton onClick={() => fileInputRef.current?.click()} title={uploading ? '업로드 중...' : '이미지 삽입'}>
          {uploading ? '⏳' : '🖼 이미지'}
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} className="re-content" />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => insertImage(e.target.files[0])}
      />
    </div>
  );
}
