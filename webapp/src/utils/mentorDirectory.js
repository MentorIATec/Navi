// View-only filters; never change the student's progress or permission scope.
export function normalizeDirectorySearch(value = '') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
}

export function matchesDirectoryAdvance(student, criterion) {
  if (criterion === 'pending') return !student.hasResponse;
  if (criterion === 'test') return Boolean(student.hasResponse);
  if (criterion === 'session') return Boolean(student.hasSession);
  if (criterion === 'plan') return Boolean(student.hasGoalSelection);
  return criterion === 'all';
}

export function filterMentorDirectory(students, { search = '', status = 'all', advances = [] } = {}) {
  const query = normalizeDirectorySearch(search);
  return students.filter((student) => {
    const matchesSearch = !query || [student.matricula, student.name, student.preferredName, student.email]
      .some((value) => normalizeDirectorySearch(value).includes(query));
    return matchesSearch && matchesDirectoryAdvance(student, status)
      && advances.every((criterion) => matchesDirectoryAdvance(student, criterion));
  });
}
