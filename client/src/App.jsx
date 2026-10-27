import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Placeholder from './components/Placeholder';
import Login from './pages/Login';
import Register from './pages/Register';
import Animals from './pages/Animals';
import AddAnimal from './pages/AddAnimal';
import AnimalProfile from './pages/AnimalProfile';
import Settings from './pages/Settings';
import Home from './pages/Home';
import Money from './pages/Money';
import Help from './pages/Help';
import VaccineCalendarPage from './pages/VaccineCalendarPage';
import Milk from './pages/Milk';

export default function App() {
  return (
    <>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="animals" element={<Animals />} />
          <Route path="animals/new" element={<AddAnimal />} />
          <Route path="animals/:id" element={<AnimalProfile />} />
          <Route path="milk" element={<Milk />} />
          <Route path="money" element={<Money />} />
          <Route path="help" element={<Help />} />
          <Route path="vaccines" element={<VaccineCalendarPage />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
