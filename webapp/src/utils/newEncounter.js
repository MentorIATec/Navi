// A new encounter is distinct from editing the current encounter's notes.
export function newEncounterAvailability({ student, goalSelection, draft, contextKey, pending, today }) {
  const completePlan = student?.hasGoalSelection && goalSelection
    && String(goalSelection.matricula || '').trim().toUpperCase() === String(student.matricula || '').trim().toUpperCase()
    && ['metaprioritaria', 'metacomplementaria', 'tiempo', 'obstaculo', 'plan', 'selectionid']
      .every(key => typeof goalSelection[key] === 'string' && goalSelection[key].trim());
  if (!completePlan) return 'open';
  if (!contextKey || draft?._contextKey !== contextKey) return 'loading';
  if (pending || (draft._confirmed !== true && (draft.sessionId || String(draft.notasMentor || '').trim()
    || draft.documentadoCrm || (draft.fechaSesion && draft.fechaSesion !== today)))) return 'dirty';
  return 'ready';
}
