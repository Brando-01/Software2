import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Marketplace from './pages/Marketplace';
import Borrow from './pages/Borrow';
import Lend from './pages/Lend';
import Simulator from './pages/Simulator';
import Education from './pages/Education';
import Support from './pages/Support';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div className="container" style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/marketplace" element={
            <PrivateRoute>
              <Marketplace />
            </PrivateRoute>
          } />
          <Route path="/borrow" element={
            <PrivateRoute>
              <Borrow />
            </PrivateRoute>
          } />
          <Route path="/lend" element={
            <PrivateRoute>
              <Lend />
            </PrivateRoute>
          } />
          <Route path="/simulator" element={<Simulator />} />
          <Route path="/education" element={<Education />} />
          <Route path="/support" element={<Support />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

export default App;