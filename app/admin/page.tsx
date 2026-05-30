'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string>('director');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('sb_access_token');
    const userData = localStorage.getItem('sb_user');
    const savedRole = localStorage.getItem('sb_role') || 'director';

    if (!token) {
      router.push('/login');
      return;
    }
    // 일반 선생님은 /admin/teacher 로 이동
    if (savedRole === 'teacher') {
      router.push('/admin/teacher');
      return;
    }
    setRole(savedRole);
    if (userData) setUser(JSON.parse(userData));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('sb_access_token');
    localStorage.removeItem('sb_user');
    localStorage.removeItem('sb_role');
    localStorage.removeItem('sb_teacher_id');
    router.push('/login');
  };

  if (!user) return null;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 상단 네비 */}
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold"><img src="/logo.png" alt="SKY" className="h-9 w-9 object-contain inline-block" /> 스카이 관리자</h1>
        <div className="flex items-center gap-6">
          <span className="text-sm text-blue-200">{user.email}</span>
          <button
            onClick={handleLogout}
            className="bg-white text-blue-700 px-4 py-1 rounded-full text-sm font-bold hover:bg-blue-50"
          >
            로그아웃
          </button>
        </div>
      </nav>

      {/* 메뉴 카드 */}
      <div className="max-w-4xl mx-auto py-16 px-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-10">관리자 메뉴</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 신규생 상담 관리: 원장/부원장만 */}
          {role !== 'teacher' && (
            <a
              href="/admin/consultations/new"
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition"
            >
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                신규생 상담 관리
              </h3>
              <p className="text-gray-500 text-sm">
                신규 상담 신청 확인 및 승인/거절
              </p>
            </a>
          )}

          <a
            href="/admin/consultations/current"
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition"
          >
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              재원생 상담 관리
            </h3>
            <p className="text-gray-500 text-sm">재원생 상담 신청 전체 현황</p>
          </a>

          <a
            href="/admin/students"
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition"
          >
            <div className="text-4xl mb-4">👨‍🎓</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">학생 관리</h3>
            <p className="text-gray-500 text-sm">학생 등록 및 정보 관리</p>
          </a>

          <a
            href="/admin/students/logs"
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition"
          >
            <div className="text-4xl mb-4">📓</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">학생 일지</h3>
            <p className="text-gray-500 text-sm">수업 일지 및 진도 관리</p>
          </a>

          {/* 선생님 관리: 원장/부원장만 */}
          {role !== 'teacher' && (
            <a
              href="/admin/teachers"
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition"
            >
              <div className="text-4xl mb-4">👩‍🏫</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                선생님 관리
              </h3>
              <p className="text-gray-500 text-sm">선생님 등록 및 계정 관리</p>
            </a>
          )}

          <a
            href="/admin/slots"
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition"
          >
            <div className="text-4xl mb-4">🗓️</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              상담 시간 설정
            </h3>
            <p className="text-gray-500 text-sm">신규생·재원생 상담 시간 오픈</p>
          </a>

          <a
            href="/admin/content"
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition"
          >
            <div className="text-4xl mb-4">✏️</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">콘텐츠 관리</h3>
            <p className="text-gray-500 text-sm">학교분석·합격사례·후기·칼럼·설명회</p>
          </a>

          <a
            href="/admin/attendance"
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition"
          >
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">출결 관리</h3>
            <p className="text-gray-500 text-sm">날짜별 출석·지각·결석 체크</p>
          </a>

          <a
            href="/admin/classes"
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition"
          >
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">반 관리</h3>
            <p className="text-gray-500 text-sm">반 생성, 요일/시간, 학생 배정</p>
          </a>

          <a
            href="/admin/makeup"
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition"
          >
            <div className="text-4xl mb-4">🔄</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">보충 수업 관리</h3>
            <p className="text-gray-500 text-sm">결석 보충 일정 및 완료 처리</p>
          </a>

          <a
            href="/admin/dashboard"
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition"
          >
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">출결 현황판</h3>
            <p className="text-gray-500 text-sm">결석·보충·장기미등원 현황 + 엑셀</p>
          </a>

          <a
            href="/admin/sessions"
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition"
          >
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">수강료 · 회차 관리</h3>
            <p className="text-gray-500 text-sm">월별 납부 현황 및 잔여 회차 관리</p>
          </a>

          <a
            href="/admin/consultation-dashboard"
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition"
          >
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">상담 현황 대시보드</h3>
            <p className="text-gray-500 text-sm">전환율·월별 추이·선생님별 현황</p>
          </a>

          <a
            href="/admin/teacher-workload"
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition"
          >
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">선생님 업무 현황</h3>
            <p className="text-gray-500 text-sm">담당 학생·출결 처리·대기 업무</p>
          </a>
        </div>
      </div>
    </main>
  );
}
