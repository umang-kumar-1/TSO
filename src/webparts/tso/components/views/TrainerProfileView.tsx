import React, { useMemo } from 'react';

// interface TrainerProfileViewProps {
//   staffId: string;
//   data: ReturnType<typeof useMockData>;
//   onNavigate: (view: View) => void;
// }

const formatDate = (isoDateString?: string): string => {
  if (!isoDateString) return 'N/A';
  const datePart = isoDateString.split('T')[0];
  const parts = datePart.split('-');
  if (parts.length !== 3) return isoDateString;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

const TrainerProfileView: React.FC<any> = ({ staffId, data, onNavigate }) => {
  const { staff, courses, batches, students, attendance } = data;

  const staffMember = useMemo(() => staff.find((s:any) => s.id === staffId), [staff, staffId]);

  if (!staffMember) {
    return (
      <div>
        <h1 className="h2 mb-4">Staff Profile Not Found</h1>
        <button onClick={() => onNavigate('trainers')} className="btn btn-primary">Back to Staff List</button>
      </div>
    );
  }

  const staffCourses = courses.filter((c:any) => staffMember.expertise?.includes(c.id));
  const staffBatches = batches.filter((b:any) => b.staffId === staffMember.id);
  const staffAttendance = useMemo(() => {
    return attendance
      .filter((a:any) => a.personId === staffMember.id && a.personType === 'staff')
      .sort((a:any, b:any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendance, staffMember.id]);

  const attendanceLast30Days = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return staffAttendance.filter((a:any) => new Date(a.date) >= thirtyDaysAgo);
  }, [staffAttendance]);

  const totalHoursLast30Days = attendanceLast30Days.reduce((sum:any, a:any) => sum + a.hoursPresent, 0);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2">Staff Profile</h1>
        <button onClick={() => onNavigate('trainers')} className="btn btn-outline-secondary">
            &larr; Back to Staff
        </button>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex align-items-center">
            <img
              src={staffMember.imageUrl || `https://ui-avatars.com/api/?name=${staffMember.name.replace(' ', '+')}&background=random&size=128`}
              alt={staffMember.name}
              className="rounded-circle me-4 object-fit-cover"
              width="100"
              height="100"
            />
            <div>
              <h2 className="h3 mb-0">{staffMember.name}</h2>
              <p className="text-body-secondary mb-1">{staffMember.role}</p>
              <span className={`badge rounded-pill ${staffMember.status === 'Active' ? 'text-bg-success' : 'text-bg-secondary'}`}>
                {staffMember.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column */}
        <div className="col-lg-4">
            <div className="card shadow-sm mb-4">
                <div className="card-header"><h3 className="h5 mb-0">Contact & Personal Info</h3></div>
                <div className="card-body">
                    <p><strong>Email:</strong> {staffMember.email}</p>
                    <p><strong>Phone:</strong> {staffMember.phone}</p>
                    <p><strong>Gender:</strong> {staffMember.gender}</p>
                    <p className="mb-0"><strong>About:</strong> {staffMember.about || 'N/A'}</p>
                </div>
            </div>

            <div className="card shadow-sm">
                <div className="card-header"><h3 className="h5 mb-0">Employment Details</h3></div>
                <div className="card-body">
                    <p><strong>Joining Date:</strong> {formatDate(staffMember.joiningDate)}</p>
                    <p><strong>Type:</strong> {staffMember.employmentType}</p>
                    <p className="mb-0"><strong>Salary:</strong> ₹{staffMember.salary.toLocaleString()} ({staffMember.salaryType})</p>
                </div>
            </div>
        </div>

        {/* Right Column */}
        <div className="col-lg-8">
            <div className="card shadow-sm mb-4">
                <div className="card-header"><h3 className="h5 mb-0">Attendance History</h3></div>
                <div className="card-body text-center">
                    <h6 className="text-body-secondary text-uppercase small">Total Hours (Last 30 Days)</h6>
                    <p className="h4 mb-0">{totalHoursLast30Days} <span className="small text-body-secondary">hrs</span></p>
                </div>
                 <div className="table-responsive" style={{maxHeight: '200px'}}>
                    <table className="table table-hover mb-0">
                        <thead><tr><th>Date</th><th>Hours Present</th></tr></thead>
                        <tbody>
                            {staffAttendance.slice(0, 10).map((a:any) => (
                                <tr key={a.id}>
                                    <td>{formatDate(a.date)}</td>
                                    <td>{a.hoursPresent} hrs</td>
                                </tr>
                            ))}
                            {staffAttendance.length === 0 && (
                                <tr><td colSpan={2} className="text-center text-body-secondary p-3">No attendance records found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {staffMember.role === 'Trainer' && (
                <div className="card shadow-sm mb-4">
                    <div className="card-header"><h3 className="h5 mb-0">Expertise & Batches</h3></div>
                    <ul className="list-group list-group-flush">
                        <li className="list-group-item">
                            <h6 className="mb-1">Courses Taught</h6>
                            {staffCourses.length > 0 ? staffCourses.map((c:any) => <span key={c.id} className="badge bg-primary-subtle text-primary-emphasis me-1">{c.name}</span>) : 'None assigned'}
                        </li>
                        <li className="list-group-item">
                            <h6 className="mb-2">Assigned Batches</h6>
                            {staffBatches.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-sm mb-0">
                                        <thead>
                                            <tr><th>Batch Name</th><th>Course</th><th>Students</th><th>Status</th></tr>
                                        </thead>
                                        <tbody>
                                            {staffBatches.map((b:any) => {
                                                const studentCount = students.filter((s:any) => s.batchIds?.includes(b.id)).length;
                                                const courseName = courses.find((c:any) => c.id === b.courseId)?.name || 'N/A';
                                                return (
                                                    <tr key={b.id}>
                                                        <td>{b.name}</td>
                                                        <td>{courseName}</td>
                                                        <td>{studentCount}</td>
                                                        <td><span className={`badge ${b.status === 'Ongoing' ? 'text-bg-success' : b.status === 'Upcoming' ? 'text-bg-warning' : 'text-bg-secondary'}`}>{b.status}</span></td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : 'No batches assigned'}
                        </li>
                    </ul>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TrainerProfileView;
