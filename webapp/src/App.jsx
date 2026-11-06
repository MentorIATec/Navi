import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';

const Welcome = lazy(() => import('./pages/Welcome'));
const PreTest = lazy(() => import('./pages/PreTest'));
const Diagnostic = lazy(() => import('./pages/Diagnostic'));
const Results = lazy(() => import('./pages/Results'));
const CheckIn = lazy(() => import('./pages/CheckIn'));
const GoalSelection = lazy(() => import('./pages/GoalSelection'));
const ActionPlan = lazy(() => import('./pages/ActionPlan'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

function RouteFallback() {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-6xl items-center justify-center px-6 py-16" aria-live="polite">
      <p className="text-sm text-[var(--ink-600)]">Cargando faro…</p>
    </main>
  );
}

function App() {
  return (
    <Router>
      <Layout>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/pre-test" element={<PreTest />} />
            <Route path="/test" element={<Diagnostic />} />
            <Route path="/resultados" element={<Results />} />
            <Route path="/check-in" element={<CheckIn />} />
            <Route path="/seleccion-metas" element={<GoalSelection />} />
            <Route path="/plan-accion" element={<ActionPlan />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Layout>
    </Router>
  );
}

export default App;
