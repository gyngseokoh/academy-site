'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const MENU_GROUPS = [
  {
    label: '상담',
    color: 'blue',
    items: [
      { icon: '📋', title: '신규생 상담', desc: '신청 확인 · 승인/거절', href: '/admin/consultations/new', roles: ['director', 'vice_director'] },
      { icon: '💬', title: '재원생 상담', desc: '재원생 상담 현황', href: '/admin/consultations/current' },
      { icon: '🗓️', title: '상담 시간 설정', desc: '상담 시간 오픈', href: '/admin/slots' },
      { icon: '📈', title: '상담 현황', desc: '전환율 · 월별 추이', href: '/admin/consultation-dashboard', roles: ['director', 'vice_director'] },
    ],
  },
  {
    label: '학생',
    color: 'green',
    items: [
      { icon: '👨‍🎓', title: '학생 관리', desc: '등록 · 정보 관리', href: '/admin/students' },
      { icon: '📓', title: '학생 일지', desc: '수업 일지 · 진도', href: '/admin/students/logs' },
      { icon: '📄', title: '리포트', desc: '월간 학습 리포트', href: '/admin/reports' },
    ],
  },
  {
    label: '수업 · 출결',
    color: 'purple',
    items: [
      { icon: '📚', title: '반 관리', desc: '반 생성 · 학생 배정', href: '/admin/classes' },
      { icon: '🗂️', title: '전체 시간표', desc: '요일별 수업 현황', href: '/admin/timetable' },
      { icon: '✅', title: '출결 관리', desc: '출석 · 지각 · 결석', href: '/admin/attendance' },
      { icon: '🔄', title: '보충 수업', desc: '보충 일정 · 완료 처리', href: '/admin/makeup' },
      { icon: '📊', title: '출결 현황판', desc: '결석 · 장기미등원 · 엑셀', href: '/admin/dashboard' },
    ],
  },
  {
    label: '선생님',
    color: 'orange',
    items: [
      { icon: '👩‍🏫', title: '선생님 관리', desc: '등록 · 계정 관리', href: '/admin/teachers', roles: ['director', 'vice_director'] },
      { icon: '📋', title: '업무 현황', desc: '담당 학생 · 대기 업무', href: '/admin/teacher-workload' },
    ],
  },
  {
    label: '콘텐츠 · 통계',
    color: 'gray',
    items: [
      { icon: '✏️', title: '콘텐츠 관리', desc: '학교분석 · 칼럼 · 후기', href: '/admin/content' },
      { icon: '📈', title: '통계 대시보드', desc: '학교별 · 학년별 현황', href: '/admin/stats', roles: ['director', 'vice_director'] },
    ],
  },
];

const COLOR: Record<string, string> = {
  blue: 'bg-blue-50 border-blue-100 text-blue-700',
  green: 'bg-green-50 border-green-100 text-green-700',
  purple: 'bg-purple-50 border-purple-100 text-purple-700',
  orange: 'bg-orange-50 border-orange-100 text-orange-700',
  gray: 'bg-gray-50 border-gray-200 text-gray-600',
};

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string>('director');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('sb_access_token');
    const userData = localStorage.getItem('sb_user');
    const savedRole = localStorage.getItem('sb_role') || 'director';
    if (!token) { router.push('/login'); return; }
    if (savedRole === 'teacher') { router.push('/admin/teacher'); return; }
    setRole(savedRole);
    if (userData) setUser(JSON.parse(userData));
  }, []);

  const handleLogout = () => {
    ['sb_access_token', 'sb_user', 'sb_role', 'sb_teacher_id'].forEach(k => localStorage.removeItem(k));
    router.push('/login');
  };

  if (!user) return null;

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-blue-700 text-white px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="SKY" className="h-8 w-8 object-contain" />
          <span className="font-bold">스카이 관리자</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-blue-200">{user.email}</span>
          <button onClick={handleLogout} className="bg-white text-blue-700 px-3 py-1 rounded-full text-sm font-bold hover:bg-blue-50">
            로그아웃
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-8 px-6 space-y-6">
        {MENU_GROUPS.map(group => {
          const visibleItems = group.items.filter(item =>
            !item.roles || item.roles.includes(role)
          );
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label}>
              <h2 className={`text-xs font-bold uppercase tracking-widest mb-3 px-1 ${COLOR[group.color].split(' ')[2]}`}>
                {group.label}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {visibleItems.map(item => (
                  <a key={item.href} href={item.href}
                    className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-blue-200 transition group">
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <div className="font-bold text-gray-800 text-sm group-hover:text-blue-700 transition">{item.title}</div>
                    <div className="text-gray-400 text-xs mt-0.5 leading-tight">{item.desc}</div>
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
