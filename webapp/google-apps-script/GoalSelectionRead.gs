// R2-only read. Existing explorer/CAS and all writers remain unchanged.
function getGoalSelectionContext_(ss, data, timing) {
  if (!data || !/^A\d{8}$/.test(data.matricula) || !/^[a-f0-9]{64}$/.test(data.scope)) explorationFailure_('GOAL_STATE_SCOPE_INVALID');
  // Reuse the exact legacy/directory/active Staff admission checks. The fourth
  // argument is internal; neither client input nor getStudentEntry can set it.
  var entry = buildStudentLookupFast_(ss, { matricula: data.matricula }, timing, true);
  if (!entry.student) explorationFailure_('GOAL_DIAGNOSTIC_REQUIRED');

  // Reuse a valid existing product cache, without rebuilding it or creating a
  // second cache with different invalidation semantics.
  var cached = readDirectoryCacheJson_(getDirectoryReadCache_(),
    getStudentProductCacheKey_(data.matricula, entry.operationalCycle), timing, 'studentProductSnapshot');
  entry.testResponse = measureRequestStage_(timing, 'testResponse', function() {
    if (cached && cached.version === STUDENT_PRODUCT_CACHE_VERSION) return cached.testResponse || null;
    var responses = findIndexedProductRecords_(ss, 'Responses', data.matricula, timing, 'responseIndex')
      .map(function(item) { return item.record; })
      .filter(function(record) { return recordMatchesOperationalCycle_(record, entry.operationalCycle); });
    // Preserve Google68 ordering and legacy sanitization exactly.
    return responses.length ? sanitizeTestResponse_(responses[responses.length - 1]) : null;
  });
  if (entry.testResponse) {
    var test = entry.testResponse;
    var diagnosticCycle = String(test.operationalCycle || getLegacyOperationalCycle_());
    var reference = test.responseId || 'legacy:' + Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,
      JSON.stringify([data.matricula, diagnosticCycle, test.fechaTest, test.etapa, test.scores]), Utilities.Charset.UTF_8)
      .map(function(byte) { return ('0' + (byte & 255).toString(16)).slice(-2); }).join('');
    entry.diagnosticContext = { cycle: diagnosticCycle, reference: reference };
  } else {
    var checkIn = measureRequestStage_(timing, 'assistedCheckIn', function() {
      return findLatestCheckInForStudentCycle_(ss, data.matricula, entry.operationalCycle, timing);
    });
    entry.assistedExploration = Boolean(checkIn && String(checkIn.modalidad).toLowerCase() === 'presencial' && String(checkIn.pretestresumen || '').trim());
  }
  return { entry: entry, catalog: { prioritarias: measureRequestStage_(timing, 'goalsCatalog', function() {
    return getGoalsCatalogData(ss);
  }) } };
}
