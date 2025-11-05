import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/views/DashboardView';
import StudentsView from './components/views/StudentsView';
import StudentProfileView from './components/views/StudentProfileView';
import TrainersView from './components/views/TrainersView';
import TrainerProfileView from './components/views/TrainerProfileView';
import CoursesView from './components/views/CoursesView';
import FeesView from './components/views/FeesView';
import ExpensesView from './components/views/ExpensesView';
import AssignmentsView from './components/views/AssignmentsView';
import LeadsView from './components/views/LeadsView';
import BatchesView from './components/views/BatchesView';
import AttendanceView from './components/views/AttendanceView';
import { useMockData } from './hooks/useMockData';

export type ViewType =
  | 'dashboard'
  | 'students'
  | 'staff'
  | 'courses'
  | 'batches'
  | 'fees'
  | 'expenses'
  | 'assignments'
  | 'attendance'
  | 'trainerProfile'
  | 'studentProfile'
  | 'leads';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  );
  const [profileId, setProfileId] = useState<string | null>(null);
  const mockData = useMockData();

  // --- Theme Persistence ---
  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // --- Navigation Handlers ---
  const handleSidebarNavigation = (view: ViewType) => {
    setActiveView(view);
    setProfileId(null);
  };

  const handleViewStudentProfile = (studentId: string) => {
    setProfileId(studentId);
    setActiveView('studentProfile');
  };

  const handleViewTrainerProfile = (trainerId: string) => {
    setProfileId(trainerId);
    setActiveView('trainerProfile');
  };

  const handleNavigate = (view: ViewType) => {
    setActiveView(view);
    setProfileId(null);
  };

  // --- Conditional View Rendering ---
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView data={mockData} />;
      case 'students':
        return <StudentsView data={mockData} onViewProfile={handleViewStudentProfile} />;
      case 'staff':
        return <TrainersView data={mockData} onViewProfile={handleViewTrainerProfile} />;
      case 'courses':
        return <CoursesView data={mockData} />;
      case 'batches':
        return <BatchesView data={mockData} />;
      case 'fees':
        return <FeesView data={mockData} />;
      case 'expenses':
        return <ExpensesView data={mockData} />;
      case 'assignments':
        return <AssignmentsView data={mockData} />;
      case 'attendance':
        return <AttendanceView data={mockData} />;
      case 'leads':
        return <LeadsView data={mockData} />;
      case 'studentProfile':
        return profileId ? (
          <StudentProfileView studentId={profileId} data={mockData} onNavigate={handleNavigate} />
        ) : (
          <div>Student not found</div>
        );
      case 'trainerProfile':
        return profileId ? (
          <TrainerProfileView staffId={profileId} data={mockData} onNavigate={handleNavigate} />
        ) : (
          <div>Trainer not found</div>
        );
      default:
        return <DashboardView data={mockData} />;
    }
  };

  return (
    <div className="d-flex vh-100 bg-body-tertiary">
      <Sidebar
        activeView={activeView}
        setActiveView={handleSidebarNavigation}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <main className="flex-grow-1 p-4 p-md-5 overflow-auto">
        {renderView()}
      </main>
    </div>
  );
};

export default App;