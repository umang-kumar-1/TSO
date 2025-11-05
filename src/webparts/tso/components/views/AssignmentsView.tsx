

import React, { useState, useMemo } from 'react';
import Table, { type TableHeader } from '../common/Table';
import Modal from '../common/Modal';
import ConfirmationModal from '../common/ConfirmationModal';
import { useMockData } from '../../hooks/useMockData';
import { useTable } from '../../hooks/useTable';
import type { Assignment } from '../../types';

// Icons
const EditIcon: React.FC<{className?: string}> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
);
const DeleteIcon: React.FC<{className?: string}> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
);
const DocumentIcon: React.FC<{className?: string}> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
);

// Reusable Form Components
const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div className="mb-3">
        <label className="form-label">{label}</label>
        <input {...props} className="form-control" />
    </div>
);
const FormSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }> = ({ label, children, ...props }) => (
    <div className="mb-3">
        <label className="form-label">{label}</label>
        <select {...props} className="form-select">
            {children}
        </select>
    </div>
);

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

const formatDate = (isoDateString?: string): string => {
  if (!isoDateString) return 'N/A';
  const datePart = isoDateString.split('T')[0];
  const parts = datePart.split('-');
  if (parts.length !== 3) return isoDateString;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

const AssignmentsView: React.FC<{ data: ReturnType<typeof useMockData> }> = ({ data }) => {
    const { assignments, students, courses, staff, addAssignment, updateAssignment, deleteAssignment } = data;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
    const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [courseFilter, setCourseFilter] = useState('all');
    
    const initialFormState: Omit<Assignment, 'id' | 'status'> = {title: '', courseId: '', studentId: '', staffId: '', dueDate: new Date().toISOString().split('T')[0], assignmentFileUrl: '', assignmentFile: null, };
    const [formState, setFormState] = useState(initialFormState);

    const augmentedAssignments = useMemo(() => assignments.map(a => ({
        ...a,
        studentName: students.find(s => s.id === a.studentId)?.name || 'N/A',
        courseName: courses.find(c => c.id === a.courseId)?.name || 'N/A'
    })), [assignments, students, courses]);


    const filteredItems = useMemo(() => {
        return augmentedAssignments.filter(assignment => {
            const statusMatch = statusFilter === 'all' || assignment.status === statusFilter;
            const courseMatch = courseFilter === 'all' || assignment.courseId === courseFilter;
            return statusMatch && courseMatch;
        });
    }, [augmentedAssignments, statusFilter, courseFilter]);


    
    const { sortedItems, requestSort, sortConfig, searchTerm, setSearchTerm } = useTable(
        filteredItems,
        ['title', 'studentName', 'courseName', 'status'],
        'dueDate'
    );

    const headers: TableHeader[] = [
        { key: 'title', label: 'Title', sortable: true },
        { key: 'studentName', label: 'Student', sortable: true },
        { key: 'courseName', label: 'Course', sortable: true },
        { key: 'dueDate', label: 'Due Date', sortable: true },
        { key: 'status', label: 'Status', sortable: true },
        { key: 'file', label: 'File', sortable: false },
        { key: 'actions', label: 'Actions', sortable: false },
    ];
    
    const handleOpenModal = (assignment: Assignment | null = null) => {
        if (assignment) {
            setEditingAssignment(assignment);
            setFormState(assignment);
        } else {
            setEditingAssignment(null);
            setFormState(initialFormState);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingAssignment(null);
        setFormState(initialFormState);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value, ...(name === 'courseId' && { studentId: '', staffId: '' }) }));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const base64 = await toBase64(file);
      setFormState({
        ...formState,
        assignmentFileUrl: base64,
        assignmentFile: file as any,
      });
    }
  };

    const handleSubmit = () => {
        if (formState.title && formState.courseId && formState.studentId && formState.staffId) {
            if (editingAssignment) {
                updateAssignment(formState as Assignment);
            } else {
                addAssignment(formState);
            }
            handleCloseModal();
        } else {
            alert('Please fill all fields.');
        }
    };

    const handleDelete = () => {
        if (assignmentToDelete) {
            deleteAssignment(assignmentToDelete.id);
            setAssignmentToDelete(null);
        }
    };

    const studentsForCourse = useMemo(() => students.filter(s => s.courseIds.includes(formState.courseId)), [students, formState.courseId]);
    const trainersForCourse = useMemo(() => staff.filter(t => t.role === 'Trainer' && t.expertise?.includes(formState.courseId)), [staff, formState.courseId]);


    const filters = (
        <>
            <select
                className="form-select form-select-sm"
                style={{width: 'auto'}}
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                aria-label="Filter by course"
            >
                <option value="all">All Courses</option>
                {courses.map(course => <option key={course.id} value={course.id}>{course.name}</option>)}
            </select>
            <select
                className="form-select form-select-sm"
                style={{width: 'auto'}}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
            >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Submitted">Submitted</option>
            </select>
        </>
    );

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h2">Assignments</h1>
                <button 
                    onClick={() => handleOpenModal()}
                    className="btn btn-primary">
                    Allocate Assignment
                </button>
            </div>
            <Table
                headers={headers}
                itemCount={sortedItems.length}
                totalItemCount={assignments.length}
                itemName="assignment"
                itemNamePlural="assignments"
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                sortConfig={sortConfig}
                requestSort={requestSort}
                filterComponents={filters}
            >
                {sortedItems.map(assignment => (
                    <tr key={assignment.id} className="align-middle">
                        <td className="p-3 fw-semibold">{assignment.title}</td>
                        <td className="p-3">{assignment.studentName}</td>
                        <td className="p-3">{assignment.courseName}</td>
                        <td className="p-3">{formatDate(assignment.dueDate)}</td>
                        <td className="p-3">
                            <span className={`badge rounded-pill ${
                                assignment.status === 'Submitted' 
                                ? 'text-bg-success' 
                                : 'text-bg-secondary'
                            }`}>
                                {assignment.status}
                            </span>
                        </td>
                        <td className="p-3 text-center">
                             {assignment.assignmentFileUrl ? (
                                <a href={assignment.assignmentFileUrl} target="_blank" rel="noopener noreferrer" className="text-primary">
                                    <DocumentIcon />
                                </a>
                            ) : (
                                <span>-</span>
                            )}
                        </td>
                         <td className="p-3">
                            <div className="d-flex gap-2">
                                <button onClick={() => handleOpenModal(assignment)} className="btn btn-sm btn-outline-secondary">
                                    <EditIcon />
                                </button>
                                <button onClick={() => setAssignmentToDelete(assignment)} className="btn btn-sm btn-outline-danger">
                                    <DeleteIcon />
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </Table>

             {assignmentToDelete && (
                <ConfirmationModal
                    title="Delete Assignment"
                    message={`Are you sure you want to delete the assignment "${assignmentToDelete.title}"?`}
                    onConfirm={handleDelete}
                    onCancel={() => setAssignmentToDelete(null)}
                />
            )}

            <Modal show={isModalOpen} title={editingAssignment ? "Edit Assignment" : "Allocate New Assignment"} onClose={handleCloseModal}>
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                    <FormInput label="Assignment Title" name="title" value={formState.title} onChange={handleInputChange} required />
                    <FormSelect label="Course" name="courseId" value={formState.courseId} onChange={handleInputChange} required>
                        <option value="">Select a course</option>
                        {courses.map(course => <option key={course.id} value={course.id}>{course.name}</option>)}
                    </FormSelect>
                    <FormSelect label="Student" name="studentId" value={formState.studentId} onChange={handleInputChange} required disabled={!formState.courseId}>
                        <option value="">Select a student</option>
                        {studentsForCourse.map(student => <option key={student.id} value={student.id}>{student.name}</option>)}
                    </FormSelect>
                    <FormSelect label="Trainer" name="staffId" value={formState.staffId} onChange={handleInputChange} required disabled={!formState.courseId}>
                        <option value="">Select a trainer</option>
                        {trainersForCourse.map(trainer => <option key={trainer.id} value={trainer.id}>{trainer.name}</option>)}
                    </FormSelect>
                    <FormInput label="Due Date" name="dueDate" type="date" value={formState.dueDate} onChange={handleInputChange} required />
                    <FormInput label="Assignment File" name="assignmentFileUrl" type="file" onChange={handleFileChange} />
                    
                    <div className="d-flex justify-content-end pt-3 mt-3 border-top">
                        <button type="button" onClick={handleCloseModal} className="btn btn-secondary me-2">Cancel</button>
                        <button type="submit" className="btn btn-primary">{editingAssignment ? "Save Changes" : "Allocate"}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default AssignmentsView;