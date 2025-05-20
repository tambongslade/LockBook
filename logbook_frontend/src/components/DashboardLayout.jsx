import { useState, useEffect } from 'react';
import { Link, useLocation, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyLogbookCorrections } from '../services/api';
import { FaUsers, FaBook, FaClipboardList, FaSignOutAlt, FaChartBar, FaCalendarAlt, FaBuilding, FaUserGraduate, FaEdit, FaBars, FaTimes } from 'react-icons/fa';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [correctionCount, setCorrectionCount] = useState(0);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchCount = async () => {
      if (user?.role?.toUpperCase() === 'DELEGATE') {
        try {
          const response = await getMyLogbookCorrections();
          setCorrectionCount(response.data?.length || 0);
        } catch (error) {
          console.error("Failed to fetch correction count:", error);
          setCorrectionCount(0);
        }
      }
    };
    fetchCount();
  }, [user]);

  const getNavLinks = (isMobile = false) => {
    if (!user) return [];

    const baseClasses = `flex items-center justify-between px-4 py-2 text-gray-700 rounded-md ${isMobile ? 'hover:bg-gray-700 hover:text-white' : 'hover:bg-gray-200'}`;
    const activeClasses = isMobile ? "bg-gray-900 text-white font-semibold" : "bg-gray-300 text-gray-900 font-semibold";

    const adminLinks = [
      { to: '/admin/users', text: 'Manage Users', icon: <FaUsers className="mr-3" /> },
      { to: '/admin/delegates', text: 'Manage Delegates', icon: <FaUserGraduate className="mr-3" /> },
      { to: '/admin/courses', text: 'Manage Courses', icon: <FaBook className="mr-3" /> },
      { to: '/admin/departments', text: 'Manage Departments', icon: <FaBuilding className="mr-3" /> },
      { to: '/admin/timetable', text: 'Manage Timetable', icon: <FaCalendarAlt className="mr-3" /> },
      { to: '/admin/progress', text: 'Progress Report', icon: <FaClipboardList className="mr-3" /> },
      { to: '/admin/logbook-history', text: 'Logbook History', icon: <FaBook className="mr-3" /> },
    ];

    const teacherLinks = [
      { to: '/teacher/dashboard', text: 'Dashboard', icon: <FaChartBar className="mr-3" /> },
      { to: '/teacher/reviews', text: 'Review Logbooks', icon: <FaClipboardList className="mr-3" /> },
      { to: '/teacher/history', text: 'Logbook History', icon: <FaBook className="mr-3" /> },
    ];

    const delegateLinks = [
      { to: '/delegate/dashboard', text: 'Dashboard', icon: <FaCalendarAlt className="mr-3" /> },
      { 
        to: '/delegate/corrections', 
        text: 'Corrections', 
        icon: <FaEdit className="mr-3" />, 
        badge: correctionCount > 0 ? correctionCount : null 
      },
      { to: '/delegate/history', text: 'Logbook History', icon: <FaBook className="mr-3" /> },
    ];

    let links = [];
    if (user.role?.toUpperCase() === 'ADMIN') links = adminLinks;
    if (user.role?.toUpperCase() === 'TEACHER') links = teacherLinks;
    if (user.role?.toUpperCase() === 'DELEGATE' || user.role?.toUpperCase() === 'STUDENT') links = delegateLinks;

    return links.map(link => (
      <NavLink
        key={link.to}
        to={link.to}
        className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : ''}`}
        onClick={isMobile ? () => setIsMobileSidebarOpen(false) : undefined}
      >
        <span className="flex items-center">
          {link.icon}
          {link.text}
        </span>
        {link.badge && (
          <span className={`ml-auto inline-block py-0.5 px-2 text-xs font-semibold text-white rounded-full ${isMobile ? 'bg-red-400' : 'bg-red-500'}`}>
            {link.badge}
          </span>
        )}
      </NavLink>
    ));
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Desktop Sidebar - Hidden on smaller screens */}
      <aside className="w-64 bg-white shadow-md flex-col flex-shrink-0 hidden md:flex">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-center text-indigo-600">LogBook</h1>
          <p className="text-sm text-center text-gray-500 capitalize">{user?.role} Portal</p>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-2">
          {getNavLinks(false)}
        </nav>
        <div className="p-4 border-t">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center px-4 py-2 text-red-700 hover:bg-red-100 rounded-md"
          >
             <FaSignOutAlt className="mr-3" /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar - Absolute position, slides in/out or overlays */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-800 text-white transform ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:hidden`}>
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">LogBook</h1>
          <button onClick={() => setIsMobileSidebarOpen(false)} className="text-gray-400 hover:text-white">
            <FaTimes size={20} />
          </button>
        </div>
        <nav className="px-2 py-4 space-y-2">
          {getNavLinks(true)}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-700">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center px-4 py-2 text-red-400 hover:bg-red-700 hover:text-white rounded-md"
          >
            <FaSignOutAlt className="mr-3" /> Logout
          </button>
        </div>
      </div>
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && <div className="fixed inset-0 bg-black opacity-50 z-20 md:hidden" onClick={() => setIsMobileSidebarOpen(false)}></div>}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header bar for Mobile - Contains Hamburger */}
        <header className="bg-white shadow-sm md:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <button
                  onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                  className="-ml-2 mr-2 flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                >
                  <span className="sr-only">Open main menu</span>
                  {isMobileSidebarOpen ? <FaTimes className="block h-6 w-6" aria-hidden="true" /> : <FaBars className="block h-6 w-6" aria-hidden="true" />}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children ? children : <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;