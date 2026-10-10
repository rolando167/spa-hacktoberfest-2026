import { Navigate, Route, Routes } from 'react-router-dom';
import { Home } from './screens/Home';
import { Login } from './screens/Login';
import { NavigateScreen } from './screens/NavigateScreen';
import { RouteScreen } from './screens/RouteScreen';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/inicio" element={<Home />} />
      <Route path="/ruta" element={<RouteScreen />} />
      <Route path="/navegar" element={<NavigateScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
