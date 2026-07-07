import React, { useState, useMemo } from 'react';
import { useBoard } from '../store/boardStore';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/ui/Toast';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { Table, THead, Th, Td, TableEmpty } from '../components/ui/Table';
import { FieldGroup, Input, Textarea } from '../components/ui/Field';
import { MessageSquare, Plus, Search, Trash2 } from 'lucide-react';
import { BoardPost } from '../types';

export default function BoardView() {
  const { posts, createPost, deletePost, incrementViews, addComment, deleteComment } = useBoard();
  const { user } = useAuth();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  
  // 삭제 확인 다이얼로그 상태
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [commentToDelete, setCommentToDelete] = useState<{ postId: string; commentId: string } | null>(null);

  // 날짜 포맷팅 헬퍼
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}.${month}.${day} ${hours}:${minutes}`;
    } catch (e) {
      return isoString;
    }
  };

  // 작성자 레이블 헬퍼
  const getAuthorLabel = (authorId: string, postAuthorId?: string) => {
    const currentUserId = user?.studentId || user?.id;
    const isMe = authorId === currentUserId;
    const isPostAuthor = postAuthorId && authorId === postAuthorId;

    if (isMe && isPostAuthor) return '익명 (나·글쓴이)';
    if (isMe) return '익명 (나)';
    if (isPostAuthor) return '익명 (글쓴이)';
    return '익명';
  };

  // 검색 필터링된 게시글 목록
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts;
    const query = searchQuery.toLowerCase();
    return posts.filter(
      (post) =>
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query)
    );
  }, [posts, searchQuery]);

  const selectedPost = useMemo(() => {
    return posts.find((p) => p.id === selectedPostId) || null;
  }, [posts, selectedPostId]);

  const handlePostClick = (postId: string) => {
    incrementViews(postId);
    setSelectedPostId(postId);
  };

  const handleCreatePost = (title: string, content: string) => {
    const authorId = user?.studentId || user?.id || 'unknown';
    createPost(title, content, authorId);
    setCreateOpen(false);
    toast('익명 게시글을 등록했습니다.', 'success');
  };

  const handleDeletePostConfirm = () => {
    if (postToDelete) {
      deletePost(postToDelete);
      setSelectedPostId(null);
      setPostToDelete(null);
      toast('게시글을 삭제했습니다.', 'success');
    }
  };

  const handleDeleteCommentConfirm = () => {
    if (commentToDelete) {
      deleteComment(commentToDelete.postId, commentToDelete.commentId);
      setCommentToDelete(null);
      toast('댓글을 삭제했습니다.', 'success');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="익명 게시판" sub="자유롭게 익명으로 의견을 나누는 공간입니다." />
        <Button onClick={() => setCreateOpen(true)} className="flex items-center gap-1">
          <Plus size={16} />
          <span>글쓰기</span>
        </Button>
      </div>

      {/* 검색 바 */}
      <div className="flex items-center gap-2 border border-slate-400 bg-white p-2">
        <Search size={16} className="text-slate-500 ml-2" />
        <input
          type="text"
          placeholder="제목이나 내용으로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-sm bg-transparent outline-none font-bold text-slate-800"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 px-1 cursor-pointer"
          >
            초기화
          </button>
        )}
      </div>

      {/* 게시글 목록 테이블 */}
      <Table>
        <THead>
          <Th className="w-16 text-center">번호</Th>
          <Th>제목</Th>
          <Th className="w-32 text-center">작성일</Th>
          <Th className="w-20 text-center">조회수</Th>
        </THead>
        <tbody>
          {filteredPosts.length === 0 ? (
            <TableEmpty colSpan={4} message="등록된 게시글이 없습니다." />
          ) : (
            filteredPosts.map((post, idx) => (
              <tr key={post.id} className="hover:bg-slate-50 border-b border-slate-200">
                <Td className="text-center text-xs text-slate-500 font-normal">
                  {filteredPosts.length - idx}
                </Td>
                <Td className="font-bold cursor-pointer hover:underline text-slate-900" onClick={() => handlePostClick(post.id)}>
                  <div className="flex items-center gap-2">
                    <span>{post.title}</span>
                    {post.comments.length > 0 && (
                      <span className="text-xs font-bold text-[#3c6e91] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                        [{post.comments.length}]
                      </span>
                    )}
                  </div>
                </Td>
                <Td className="text-center text-xs text-slate-500 font-normal">
                  {formatDate(post.createdAt)}
                </Td>
                <Td className="text-center text-xs text-slate-500 font-normal">
                  {post.views}
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      {/* 새 글 쓰기 모달 */}
      {createOpen && (
        <CreateModal
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreatePost}
        />
      )}

      {/* 게시글 상세 보기 모달 */}
      {selectedPost && (
        <DetailModal
          post={selectedPost}
          onClose={() => setSelectedPostId(null)}
          onDelete={() => setPostToDelete(selectedPost.id)}
          formatDate={formatDate}
          getAuthorLabel={getAuthorLabel}
          addComment={(content) => addComment(selectedPost.id, content, user?.studentId || user?.id || 'unknown')}
          onDeleteComment={(commentId) => setCommentToDelete({ postId: selectedPost.id, commentId })}
        />
      )}

      {/* 글 삭제 확인 창 */}
      <ConfirmDialog
        open={postToDelete !== null}
        title="게시글 삭제"
        message="정말로 이 게시글을 삭제하시겠습니까?"
        confirmLabel="삭제"
        variant="danger"
        onConfirm={handleDeletePostConfirm}
        onClose={() => setPostToDelete(null)}
      />

      {/* 댓글 삭제 확인 창 */}
      <ConfirmDialog
        open={commentToDelete !== null}
        title="댓글 삭제"
        message="정말로 이 댓글을 삭제하시겠습니까?"
        confirmLabel="삭제"
        variant="danger"
        onConfirm={handleDeleteCommentConfirm}
        onClose={() => setCommentToDelete(null)}
      />
    </div>
  );
}

// ---- 새 글 쓰기 모달 컴포넌트 ----
function CreateModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (title: string, content: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSubmit(title.trim(), content.trim());
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="새 익명글 작성"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button
            onClick={handleFormSubmit}
            disabled={!title.trim() || !content.trim()}
          >
            등록
          </Button>
        </>
      }
    >
      <form onSubmit={handleFormSubmit} className="space-y-4">
        <FieldGroup label="제목">
          <Input
            type="text"
            placeholder="제목을 입력하세요 (예: 비교과 제출 기한 질문)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
        </FieldGroup>
        <FieldGroup label="내용">
          <Textarea
            rows={8}
            placeholder="내용을 자세히 입력해주세요. 타인을 비방하는 글은 삭제될 수 있습니다."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </FieldGroup>
      </form>
    </Modal>
  );
}

// ---- 게시글 상세 보기 모달 컴포넌트 ----
interface DetailModalProps {
  post: BoardPost;
  onClose: () => void;
  onDelete: () => void;
  formatDate: (iso: string) => string;
  getAuthorLabel: (authorId: string, postAuthorId?: string) => string;
  addComment: (content: string) => void;
  onDeleteComment: (commentId: string) => void;
}

function DetailModal({
  post,
  onClose,
  onDelete,
  formatDate,
  getAuthorLabel,
  addComment,
  onDeleteComment,
}: DetailModalProps) {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');

  const currentUserId = user?.studentId || user?.id;
  const isPostAuthor = post.authorId === currentUserId;

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(commentText.trim());
    setCommentText('');
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="익명글 상세보기"
      width="max-w-3xl"
      footer={
        <div className="flex justify-between w-full">
          <div>
            {isPostAuthor && (
              <Button variant="danger" onClick={onDelete} className="flex items-center gap-1">
                <Trash2 size={14} />
                <span>삭제</span>
              </Button>
            )}
          </div>
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* 본문 헤더 */}
        <div className="border-b border-slate-300 pb-3">
          <h2 className="text-lg font-black text-slate-900 mb-1">{post.title}</h2>
          <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
            <span>작성자: {getAuthorLabel(post.authorId)}</span>
            <span>•</span>
            <span>작성일: {formatDate(post.createdAt)}</span>
            <span>•</span>
            <span>조회수: {post.views}</span>
          </div>
        </div>

        {/* 본문 */}
        <div className="bg-white p-4 border border-slate-300 min-h-[150px] whitespace-pre-wrap text-sm text-slate-800 leading-relaxed font-semibold">
          {post.content}
        </div>

        {/* 댓글 섹션 */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-950 uppercase tracking-wider flex items-center gap-1">
            <MessageSquare size={14} />
            <span>댓글 ({post.comments.length})</span>
          </h3>

          {/* 댓글 목록 */}
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            {post.comments.length === 0 ? (
              <p className="text-xs text-slate-500 font-bold py-2">등록된 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>
            ) : (
              post.comments.map((comment) => {
                const isCommentAuthor = comment.authorId === currentUserId;
                return (
                  <div key={comment.id} className="bg-slate-100 p-2.5 border border-slate-300 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`font-black ${comment.authorId === post.authorId ? 'text-[#3c6e91]' : 'text-slate-700'}`}>
                          {getAuthorLabel(comment.authorId, post.authorId)}
                        </span>
                        <span className="text-slate-400 font-normal">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 leading-relaxed">{comment.content}</p>
                    </div>
                    {isCommentAuthor && (
                      <button
                        onClick={() => onDeleteComment(comment.id)}
                        className="text-slate-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                        title="댓글 삭제"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* 댓글 입력 폼 */}
          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="댓글을 입력하세요..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 border border-slate-500 p-2 text-xs bg-white text-slate-950 font-bold"
              required
            />
            <Button
              type="submit"
              size="sm"
              disabled={!commentText.trim()}
              className="whitespace-nowrap"
            >
              등록
            </Button>
          </form>
        </div>
      </div>
    </Modal>
  );
}
