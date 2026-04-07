import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Diagnostic from './pages/Diagnostic';
import Results from './pages/Results';
import GoalSelection from './pages/GoalSelection';
import ActionPlan from './pages/ActionPlan';
import AdminDashboard from './pages/AdminDashboard';
import CheckIn from './pages/CheckIn';
import PreTest from './pages/PreTest';
import Layout from './components/layout/Layout';

function App() {
  return (
    <Router>
      <Layout>
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
      </Layout>
    </Router>
  );
}

export default App;
