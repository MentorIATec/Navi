export const privateGoalGlobs = [
  '**/goalsCatalogSeed.json', '**/goalCatalogOverrides.json', '**/goalRecommendationRules.json',
  '**/goalRecommendationMatrix.csv', '**/goalCurationChanges.json',
  '**/api/**', '**/docs/**', '**/google-apps-script/**', '**/verification/**', '**/outputs/**', '**/scripts/**', '**/.vite-temp/**',
];
export function protectGoalSources() {
  return { name: 'private-goal-source-boundary', configureServer(server) {
    server.middlewares.use((request, response, next) => {
      let path;
      try { path = decodeURIComponent(new URL(request.url, 'http://local.invalid').pathname).replaceAll('\\', '/'); }
      catch { response.statusCode = 400; response.end(); return; }
      const privateFile = /(?:^|\/)(?:goalsCatalogSeed\.json|goalCatalogOverrides\.json|goalRecommendationRules\.json|goalRecommendationMatrix\.csv|goalCurationChanges\.json)(?:$|[/?])/i;
      const privateDirectory = /(?:^|\/)(?:docs|google-apps-script|verification|outputs|scripts|\.vite-temp)(?:\/|$)/i;
      const privateApi = path.startsWith('/api/') || (path.startsWith('/@fs/') && path.includes(`${server.config.root}/api/`));
      if (privateFile.test(path) || privateDirectory.test(path) || privateApi) { response.statusCode = 404; response.end('Not found'); return; }
      next();
    });
  } };
}
