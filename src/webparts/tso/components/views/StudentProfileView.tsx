import React, { useMemo } from 'react';
const formatDate = (isoDateString?: string): string => {
  if (!isoDateString) return 'N/A';
  const datePart = isoDateString.split('T')[0];
  const parts = datePart.split('-');
  if (parts.length !== 3) return isoDateString;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

const StudentProfileView: React.FC<any> = ({ studentId, data, onNavigate }) => {
  const { students, courses, batches, feePayments, assignments, attendance } = data;

  const student = useMemo(() => students.find((s:any) => s.id === studentId), [students, studentId]);

  if (!student) {
    return (
      <div>
        <h1 className="h2 mb-4">Student Profile Not Found</h1>
        <button onClick={() => onNavigate('students')} className="btn btn-primary">Back to Students List</button>
      </div>
    );
  }

  const studentCourses = courses.filter((c:any) => student.courseIds.includes(c.id));
  const studentBatches = batches.filter((b:any) => student.batchIds?.includes(b.id));
  const studentPayments = feePayments.filter((p:any) => p.studentId === student.id).sort((a:any,b:any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const studentAssignments = assignments.filter((a:any) => a.studentId === student.id).sort((a:any,b:any) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  const studentAttendance = useMemo(() => {
    return attendance
      .filter((a:any) => a.personId === student.id && a.personType === 'student')
      .sort((a:any, b:any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendance, student.id]);

  const totalFee = studentCourses.reduce((sum:any, course:any) => sum + course.totalFee, 0);
  const totalPaid = studentPayments.filter((p:any) => p.status === 'Paid').reduce((sum:any, p:any) => sum + p.amount, 0);
  const dueAmount = totalFee - totalPaid;

  const attendanceLast30Days = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return studentAttendance.filter((a:any) => new Date(a.date) >= thirtyDaysAgo);
  }, [studentAttendance]);

  const totalHoursLast30Days = attendanceLast30Days.reduce((sum:any, a:any) => sum + a.hoursPresent, 0);

  return (
    <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="h2">Student Profile</h1>
            <button onClick={() => onNavigate('students')} className="btn btn-outline-secondary">
                &larr; Back to Students
            </button>
        </div>
      
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex align-items-center">
            <img 
              src={student.imageUrl || `https://ui-avatars.com/api/?name=${student.name.replace(' ', '+')}&background=random&size=128`} 
              alt={student.name} 
              className="rounded-circle me-4 object-fit-cover" 
              width="100" 
              height="100" 
            />
            <div>
              <h2 className="h3 mb-0">{student.name}</h2>
              <p className="text-body-secondary mb-1">{student.email}</p>
              <span className={`badge rounded-pill ${student.status === 'Active' ? 'text-bg-success' : 'text-bg-secondary'}`}>
                {student.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column */}
        <div className="col-lg-4">
          <div className="card shadow-sm mb-4">
            <div className="card-header"><h3 className="h5 mb-0">Personal Details</h3></div>
            <div className="card-body">
                <p><strong>Phone:</strong> {student.phone}</p>
                <p><strong>Gender:</strong> {student.gender}</p>
                <p><strong>Admission Date:</strong> {formatDate(student.admissionDate)}</p>
                <p className="mb-0"><strong>Address:</strong> {student.address}</p>
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-header"><h3 className="h5 mb-0">Courses & Batches</h3></div>
            <ul className="list-group list-group-flush">
              <li className="list-group-item">
                <h6 className="mb-1">Enrolled Courses</h6>
                {studentCourses.length > 0 ? studentCourses.map((c:any) => <span key={c.id} className="badge bg-primary-subtle text-primary-emphasis me-1">{c.name}</span>) : 'None'}
              </li>
              <li className="list-group-item">
                <h6 className="mb-1">Assigned Batches</h6>
                {studentBatches.length > 0 ? studentBatches.map((b:any) => <span key={b.id} className="badge bg-success-subtle text-success-emphasis me-1">{b.name}</span>) : 'None'}
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-lg-8">
            <div className="card shadow-sm mb-4">
                <div className="card-header"><h3 className="h5 mb-0">Fee Details</h3></div>
                <div className="card-body">
                    <div className="row text-center">
                        <div className="col-4">
                            <h6 className="text-body-secondary text-uppercase small">Total Fee</h6>
                            <p className="h4 mb-0">₹{totalFee.toLocaleString()}</p>
                        </div>
                        <div className="col-4">
                            <h6 className="text-body-secondary text-uppercase small">Total Paid</h6>
                            <p className="h4 mb-0 text-success">₹{totalPaid.toLocaleString()}</p>
                        </div>
                        <div className="col-4">
                            <h6 className="text-body-secondary text-uppercase small">Balance Due</h6>
                            <p className={`h4 mb-0 ${dueAmount > 0 ? 'text-danger' : 'text-body-secondary'}`}>₹{dueAmount.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover mb-0">
                        <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Status</th></tr></thead>
                        <tbody>
                            {studentPayments.map((p:any) => (
                                <tr key={p.id}>
                                    <td>{formatDate(p.date)}</td>
                                    <td>₹{p.amount.toLocaleString()}</td>
                                    <td>{p.paymentMethod}</td>
                                    <td><span className={`badge ${p.status === 'Paid' ? 'text-bg-success' : 'text-bg-warning'}`}>{p.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

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
                            {studentAttendance.slice(0, 10).map((a:any) => (
                                <tr key={a.id}>
                                    <td>{formatDate(a.date)}</td>
                                    <td>{a.hoursPresent} hrs</td>
                                </tr>
                            ))}
                             {studentAttendance.length === 0 && (
                                <tr><td colSpan={2} className="text-center text-body-secondary p-3">No attendance records found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card shadow-sm">
                 <div className="card-header"><h3 className="h5 mb-0">Assignments</h3></div>
                 <div className="table-responsive">
                    <table className="table table-hover mb-0">
                        <thead><tr><th>Title</th><th>Course</th><th>Due Date</th><th>Status</th></tr></thead>
                        <tbody>
                            {studentAssignments.map((a:any) => (
                                <tr key={a.id}>
                                    <td>{a.title}</td>
                                    <td>{courses.find((c:any) => c.id === a.courseId)?.name || 'N/A'}</td>
                                    <td>{formatDate(a.dueDate)}</td>
                                    <td><span className={`badge ${a.status === 'Submitted' ? 'text-bg-success' : 'text-bg-secondary'}`}>{a.status}</span></td>
                                </tr>
                            ))}
                             {studentAssignments.length === 0 && (
                                <tr><td colSpan={4} className="text-center text-body-secondary p-3">No assignments found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileView;
