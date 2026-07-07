import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BoardPost, BoardComment } from '../types';

const STORAGE_KEY = 'bigyogwa-board-v1';

const SEED_POSTS: BoardPost[] = [
  {
    id: 'p1',
    title: '비교과 프로그램 일정 물어봅니다!',
    content: '학과내 비교과 계획서 제출 기한이 언제까지인가요? 공지사항을 놓친 것 같아서 질문 올립니다.',
    createdAt: '2026-07-05T14:30:00',
    authorId: '20231234', // student 계정 (김지혜)
    views: 12,
    comments: [
      {
        id: 'c1',
        postId: 'p1',
        content: '보통 학기 초에 제출하고, 보고서는 기한이 11월 말까지였던 것 같아요.',
        createdAt: '2026-07-05T15:10:00',
        authorId: '20239999', // 다른 가상 학번
      }
    ]
  },
  {
    id: 'p2',
    title: '토익 접수 기한 연장 안되나요?',
    content: '이번 토익 제출 기한에 깜빡하고 성적표 발급번호를 안 넣어서 반려되었는데, 재제출 기간이 따로 주어지는지 궁금해요.',
    createdAt: '2026-07-06T09:15:00',
    authorId: '20238888',
    views: 8,
    comments: []
  },
  {
    id: 'p3',
    title: '봉사활동 꿀팁 공유합니다.',
    content: '지역 아동센터에서 하는 전공연계봉사활동이 시간 채우기도 좋고 보람도 찹니다! 추천해요.',
    createdAt: '2026-07-06T18:00:00',
    authorId: '20231234',
    views: 15,
    comments: []
  }
];

interface BoardCtx {
  posts: BoardPost[];
  createPost: (title: string, content: string, authorId: string) => void;
  deletePost: (id: string) => void;
  incrementViews: (id: string) => void;
  addComment: (postId: string, content: string, authorId: string) => void;
  deleteComment: (postId: string, commentId: string) => void;
}

const BoardCtx = createContext<BoardCtx | null>(null);

export function BoardProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<BoardPost[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setPosts(JSON.parse(saved));
      } catch (e) {
        setPosts(SEED_POSTS);
      }
    } else {
      setPosts(SEED_POSTS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_POSTS));
    }
  }, []);

  const savePosts = (newPosts: BoardPost[]) => {
    setPosts(newPosts);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPosts));
  };

  const createPost = (title: string, content: string, authorId: string) => {
    const newPost: BoardPost = {
      id: `p_${Date.now()}`,
      title,
      content,
      createdAt: new Date().toISOString(),
      authorId,
      views: 0,
      comments: []
    };
    savePosts([newPost, ...posts]);
  };

  const deletePost = (id: string) => {
    savePosts(posts.filter(p => p.id !== id));
  };

  const incrementViews = (id: string) => {
    savePosts(posts.map(p => p.id === id ? { ...p, views: p.views + 1 } : p));
  };

  const addComment = (postId: string, content: string, authorId: string) => {
    const newComment: BoardComment = {
      id: `c_${Date.now()}`,
      postId,
      content,
      createdAt: new Date().toISOString(),
      authorId
    };
    savePosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [...p.comments, newComment]
        };
      }
      return p;
    }));
  };

  const deleteComment = (postId: string, commentId: string) => {
    savePosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: p.comments.filter(c => c.id !== commentId)
        };
      }
      return p;
    }));
  };

  return (
    <BoardCtx.Provider value={{ posts, createPost, deletePost, incrementViews, addComment, deleteComment }}>
      {children}
    </BoardCtx.Provider>
  );
}

export function useBoard() {
  const ctx = useContext(BoardCtx);
  if (!ctx) throw new Error('useBoard must be used within BoardProvider');
  return ctx;
}
