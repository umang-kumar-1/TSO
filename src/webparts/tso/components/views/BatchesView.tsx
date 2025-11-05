import React, { useState, useMemo } from 'react';
import Table, { type TableHeader } from '../common/Table';
import Modal from '../common/Modal';
import ConfirmationModal from '../common/ConfirmationModal';
import { useMockData } from '../../hooks/useMockData';
import { useTable } from '../../hooks/useTable';
import type { Batch } from '../../types';

// Icons
const EditIcon: React.FC<{className?: string}> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
);
const DeleteIcon: React.FC<{className?: string}> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
);

// Form Components
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

type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
const allWeekdays: Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const BatchesView: React.FC<{ data: ReturnType<typeof useMockData> }> = ({ data }) => {
    const { batches, courses, staff, students, addBatch, updateBatch, deleteBatch } = data;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
    const [batchToDelete, setBatchToDelete] = useState<Batch | null>(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [courseFilter, setCourseFilter] = useState('all');
    const [trainerFilter, setTrainerFilter] = useState('all');


    const initialFormState: Omit<Batch, 'id'> = { name: '', courseId: '', staffId: '', weekdays: [], time: '', startDate: new Date().toISOString().split('T')[0], status: 'Upcoming' };
    const [formState, setFormState] = useState(initialFormState);

    const augmentedBatches = useMemo(() => batches.map(b => ({
        ...b,
        courseName: courses.find(c => c.id === b.courseId)?.name || 'N/A',
        trainerName: staff.find(t => t.id === b.staffId)?.name || 'N/A',
        studentCount: students.filter(s => s.batchIds?.includes(b.id)).length
    })), [batches, courses, staff, students]);


    const filteredItems = useMemo(() => {
        return augmentedBatches.filter(batch => {
            const statusMatch = statusFilter === 'all' || batch.status === statusFilter;
            const courseMatch = courseFilter === 'all' || batch.courseId === courseFilter;
            const trainerMatch = trainerFilter === 'all' || batch.staffId === trainerFilter;
            return statusMatch && courseMatch && trainerMatch;
        });
    }, [augmentedBatches, statusFilter, courseFilter, trainerFilter]);

    const { sortedItems, requestSort, sortConfig, searchTerm, setSearchTerm } = useTable(
        filteredItems,
        ['name', 'courseName', 'trainerName'],
        'name'
    );
    
    const headers: TableHeader[] = [
        { key: 'name', label: 'Batch Name', sortable: true },
        { key: 'schedule', label: 'Schedule', sortable: false },
        { key: 'trainerName', label: 'Trainer', sortable: true },
        { key: 'studentCount', label: 'Students', sortable: true },
        { key: 'status', label: 'Status', sortable: true },
        { key: 'actions', label: 'Actions', sortable: false },
    ];

    const handleOpenModal = (batch: Batch | null = null) => {
        if (batch) {
            setEditingBatch(batch);
            setFormState(batch);
        } else {
            setEditingBatch(null);
            setFormState(initialFormState);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => setIsModalOpen(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value, ...(name === 'courseId' && { staffId: '' }) }));
    };

    const handleWeekdayChange = (day: Weekday) => {
        const newWeekdays = formState.weekdays.includes(day)
            ? formState.weekdays.filter(d => d !== day)
            : [...formState.weekdays, day];
        setFormState({ ...formState, weekdays: newWeekdays });
    };

    const handleSubmit = () => {
        if (formState.name && formState.courseId && formState.staffId && formState.time) {
            if (editingBatch) {
                updateBatch(formState as Batch);
            } else {
                addBatch(formState);
            }
            handleCloseModal();
        } else {
            alert('Please fill all required fields: Name, Course, Trainer, and Time.');
        }
    };

    const handleDelete = () => {
        if (batchToDelete) {
            deleteBatch(batchToDelete.id);
            setBatchToDelete(null);
        }
    };

    const trainersForCourse = useMemo(() => staff.filter(t => t.role === 'Trainer' && t.expertise?.includes(formState.courseId)), [staff, formState.courseId]);

    const trainers = useMemo(() => staff.filter(s => s.role === 'Trainer'), [staff]);

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
                value={trainerFilter}
                onChange={(e) => setTrainerFilter(e.target.value)}
                aria-label="Filter by trainer"
            >
                <option value="all">All Trainers</option>
                {trainers.map(trainer => <option key={trainer.id} value={trainer.id}>{trainer.name}</option>)}
            </select>
            <select
                className="form-select form-select-sm"
                style={{width: 'auto'}}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
            >
                <option value="all">All Statuses</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
            </select>
        </>
    );

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h2">Batches</h1>
                <button onClick={() => handleOpenModal()} className="btn btn-primary">
                    Add New Batch
                </button>
            </div>
            <Table
                headers={headers}
                itemCount={sortedItems.length}
                totalItemCount={batches.length}
                itemName="batch"
                itemNamePlural="batches"
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                sortConfig={sortConfig}
                requestSort={requestSort}
                filterComponents={filters}
            >
                {sortedItems.map(batch => (
                    <tr key={batch.id}>
                        <td className="p-3">
                            <div className="fw-semibold">{batch.name}</div>
                            <div className="small text-body-secondary">{batch.courseName}</div>
                        </td>
                        <td className="p-3">
                            <div>{batch.weekdays.join(', ')}</div>
                            <div className="small text-body-secondary">{batch.time}</div>
                        </td>
                        <td className="p-3">{batch.trainerName}</td>
                        <td className="p-3">{batch.studentCount}</td>
                        <td className="p-3">
                             <span className={`badge rounded-pill ${
                                batch.status === 'Ongoing' ? 'text-bg-success' : 
                                batch.status === 'Upcoming' ? 'text-bg-warning' : 'text-bg-secondary'
                            }`}>{batch.status}</span>
                        </td>
                        <td className="p-3">
                            <div className="d-flex gap-2">
                                <button onClick={() => handleOpenModal(batch)} className="btn btn-sm btn-outline-secondary"><EditIcon /></button>
                                <button onClick={() => setBatchToDelete(batch)} className="btn btn-sm btn-outline-danger"><DeleteIcon /></button>
                            </div>
                        </td>
                    </tr>
                ))}
            </Table>

            {batchToDelete && (
                <ConfirmationModal
                    title="Delete Batch"
                    message={`Are you sure you want to delete "${batchToDelete.name}"? This will also un-enroll all students from this batch.`}
                    onConfirm={handleDelete}
                    onCancel={() => setBatchToDelete(null)}
                />
            )}

            <Modal show={isModalOpen} title={editingBatch ? 'Edit Batch' : 'Add New Batch'} onClose={handleCloseModal}>
                <form onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
                    <FormInput label="Batch Name" name="name" value={formState.name} onChange={handleInputChange} required />
                    <div className="row">
                        <div className="col-md-6">
                            <FormSelect label="Course" name="courseId" value={formState.courseId} onChange={handleInputChange} required>
                                <option value="">Select a course</option>
                                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </FormSelect>
                        </div>
                        <div className="col-md-6">
                             <FormSelect label="Trainer" name="staffId" value={formState.staffId} onChange={handleInputChange} required disabled={!formState.courseId}>
                                <option value="">Select a trainer</option>
                                {trainersForCourse.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </FormSelect>
                        </div>
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Weekdays</label>
                        <div className="d-flex flex-wrap gap-2">
                            {allWeekdays.map(day => (
                                <div key={day} className="form-check form-check-inline">
                                    <input className="form-check-input" type="checkbox" id={`weekday-${day}`} value={day} checked={formState.weekdays.includes(day)} onChange={() => handleWeekdayChange(day)} />
                                    <label className="form-check-label" htmlFor={`weekday-${day}`}>{day}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                     <div className="row">
                        <div className="col-md-6"><FormInput label="Time (e.g., 08:00 - 10:00)" name="time" value={formState.time} onChange={handleInputChange} required /></div>
                        <div className="col-md-6"><FormInput label="Start Date" name="startDate" type="date" value={formState.startDate} onChange={handleInputChange} required /></div>
                    </div>
                    <FormSelect label="Status" name="status" value={formState.status} onChange={handleInputChange}>
                        <option>Upcoming</option><option>Ongoing</option><option>Completed</option>
                    </FormSelect>

                    <div className="d-flex justify-content-end pt-3 mt-3 border-top">
                        <button type="button" onClick={handleCloseModal} className="btn btn-secondary me-2">Cancel</button>
                        <button type="submit" className="btn btn-primary">{editingBatch ? 'Save Changes' : 'Add Batch'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default BatchesView;
