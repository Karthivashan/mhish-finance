import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';

const Spend = lazy(() => import('./pages/Spend'));
const TransactionForm = lazy(() => import('./pages/TransactionForm'));
const Insights = lazy(() => import('./pages/Insights'));
const Budgets = lazy(() => import('./pages/Budgets'));
const Categories = lazy(() => import('./pages/Categories'));
const Profile = lazy(() => import('./pages/Profile'));

export default function App() {
  return (
    <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="spend" element={<Spend />} />
          <Route path="spend/new/:type" element={<TransactionForm />} />
          <Route path="spend/edit/:id" element={<TransactionForm />} />
          <Route path="insights" element={<Insights />} />
          <Route path="budgets" element={<Budgets />} />
          <Route path="categories" element={<Categories />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
    </Routes>
  );
}
