import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function MainLayout() {
  return (
    <div className="app-layout">
      <div className="app-layout__sidebar">
        <Sidebar />
      </div>
      <div className="app-layout__main">
        <Navbar />
        <main className="app-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
