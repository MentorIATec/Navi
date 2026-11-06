export function getDashboardScopeStudents(students, {
  isAdmin = false,
  adminViewScope = 'own',
  userMentorId = '',
  mentorNickname = '',
} = {}) {
  const source = Array.isArray(students) ? students : [];
  if (isAdmin) {
    if (adminViewScope !== 'own' || !userMentorId) return source;
    return source.filter((student) => String(student.mentorId || '').trim() === userMentorId);
  }
  return source.filter((student) => String(student.mentor || '').trim() === mentorNickname);
}
