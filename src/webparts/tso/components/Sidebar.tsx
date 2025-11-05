import React from 'react';

// interface SidebarProps {
//   activeView: ViewType;
//   setActiveView: (view: ViewType) => void;
//   theme: 'light' | 'dark';
//   toggleTheme: () => void;
// }

const Sidebar: React.FC<any> = ({ activeView, setActiveView, theme, toggleTheme }) => {
  const navItems = [
    { view: 'dashboard', label: 'Dashboard', icon: <HomeIcon /> },
    { view: 'leads', label: 'Leads & Enquiries', icon: <InboxInIcon /> },
    { view: 'students', label: 'Students', icon: <UsersIcon /> },
    { view: 'staff', label: 'Staff', icon: <BriefcaseIcon /> },
    { view: 'courses', label: 'Courses', icon: <BookOpenIcon /> },
    { view: 'batches', label: 'Batches', icon: <ClockIcon /> },
    { view: 'fees', label: 'Fee Collection', icon: <CurrencyDollarIcon /> },
    { view: 'expenses', label: 'Expenses', icon: <TrendingDownIcon /> },
    { view: 'attendance', label: 'Attendance', icon: <CheckCircleIcon /> },
    { view: 'assignments', label: 'Assignments', icon: <ClipboardListIcon /> },
  ];
  return (
    <aside className="d-flex flex-column flex-shrink-0 bg-body-secondary shadow-sm" style={{ width: '280px' }}>
        <div className="p-3 border-bottom">
          <h1 className="h5 text-center mb-0">
            <span className="text-body">Talent Shapers</span>
            <span className="text-primary"> Orbit</span>
          </h1>
        </div>
        <ul className="nav nav-pills flex-column mb-auto p-3">
            {navItems.map(item => {
                const isActive = activeView === item.view;
                return (
                    <li key={item.view} className="nav-item mb-1">
                        <a
                            href="#"
                            className={`nav-link d-flex align-items-center ${isActive ? 'active' : 'link-body-emphasis'}`}
                            onClick={(e) => {
                                e.preventDefault();
                                setActiveView(item.view as any);
                            }}
                        >
                            {React.cloneElement(item.icon, { className: "me-3", width:"24", height:"24"})}
                            <span>{item.label}</span>
                        </a>
                    </li>
                );
            })}
        </ul>
        <div className="p-3 border-top">
            <button
                onClick={toggleTheme}
                className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center"
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
                {theme === 'light' ? <MoonIcon className="me-2" /> : <SunIcon className="me-2" />}
                <span className="fw-semibold">
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                </span>
            </button>
        </div>
    </aside>
  );
};

// Icons
const HomeIcon: React.FC<{className?: string}> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
);
const UsersIcon: React.FC<{className?: string}> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
);
const BriefcaseIcon: React.FC<{className?: string}> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
);
const BookOpenIcon: React.FC<{className?: string}> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
);
const ClockIcon: React.FC<{className?: string}> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
const CurrencyDollarIcon: React.FC<{className?: string}> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 12v-2m0 2v.01m0 4v-2m0 2v.01M6 12h.01M18 12h.01M6 12a6 6 0 1112 0 6 6 0 01-12 0z" /></svg>
);
const TrendingDownIcon: React.FC<{className?: string}> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
);
const ClipboardListIcon: React.FC<{className?: string}> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
);
const CheckCircleIcon: React.FC<{className?: string}> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
const InboxInIcon: React.FC<{className?: string}> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" /></svg>
);
const MoonIcon: React.FC<{className?: string}> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);
const SunIcon: React.FC<{className?: string}> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

export default Sidebar;