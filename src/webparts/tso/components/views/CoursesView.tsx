import React, { useState } from 'react';
import { useMockData } from '../../hooks/useMockData';
import type { Course } from '../../types';
import Modal from '../common/Modal';
import ConfirmationModal from '../common/ConfirmationModal';

// Icons for actions
const EditIcon: React.FC<{className?: string}> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
);
const DeleteIcon: React.FC<{className?: string}> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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


const CourseCard: React.FC<{ course: Course; onEdit: () => void; onDelete: () => void; }> = ({ course, onEdit, onDelete }) => {
    const isEnglish = course.category === 'Spoken English';
    return (
        <div className="card shadow-sm h-100">
            <div className="card-body d-flex flex-column">
                <div>
                    <div className="d-flex align-items-center mb-3">
                        <span className={`badge rounded-pill me-2 ${isEnglish ? 'text-bg-primary' : 'text-bg-success'}`}>
                            {course.category}
                        </span>
                        <span className="badge rounded-pill text-bg-light">
                            {course.level}
                        </span>
                    </div>
                    <h3 className="card-title h5">{course.name}</h3>
                    <p className="card-text text-body-secondary">Duration: {course.duration}</p>
                </div>
            </div>
             <div className="card-footer d-flex justify-content-between align-items-center">
                <span className="h5 mb-0 text-primary fw-bold">₹{course.totalFee.toLocaleString()}</span>
                <div className="d-flex gap-2">
                    <button onClick={onEdit} className="btn btn-sm btn-outline-secondary">
                        <EditIcon />
                    </button>
                    <button onClick={onDelete} className="btn btn-sm btn-outline-danger">
                        <DeleteIcon />
                    </button>
                </div>
            </div>
        </div>
    );
};

const CoursesView: React.FC<{ data: ReturnType<typeof useMockData> }> = ({ data }) => {
    const { courses, addCourse, updateCourse, deleteCourse } = data;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

    const initialFormState: Omit<Course, 'id'> = { name: '', category: 'Spoken English', level: 'Basic', duration: '', totalFee: 0 };
    const [formState, setFormState] = useState(initialFormState);
    
    const handleOpenModal = (course: Course | null = null) => {
        if (course) {
            setEditingCourse(course);
            setFormState(course);
        } else {
            setEditingCourse(null);
            setFormState(initialFormState);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCourse(null);
        setFormState(initialFormState);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormState(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value,
        }));
    };

    const handleSubmit = () => {
        if (formState.name && formState.duration && formState.totalFee > 0) {
            if (editingCourse) {
                updateCourse(formState as Course);
            } else {
                addCourse(formState);
            }
            handleCloseModal();
        } else {
            alert('Please fill all fields and provide a valid total fee.');
        }
    };

    const handleDelete = () => {
        if (courseToDelete) {
            deleteCourse(courseToDelete.id);
            setCourseToDelete(null);
        }
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h2">Courses</h1>
                <button 
                    onClick={() => handleOpenModal()}
                    className="btn btn-primary">
                    Add Course
                </button>
            </div>
            <div className="row g-4">
                {courses.map(course => (
                    <div className="col-12 col-md-6 col-lg-4" key={course.id}>
                        <CourseCard course={course} onEdit={() => handleOpenModal(course)} onDelete={() => setCourseToDelete(course)} />
                    </div>
                ))}
            </div>

            {courseToDelete && (
                 <ConfirmationModal
                    title="Delete Course"
                    message={`Are you sure you want to delete the course "${courseToDelete.name}"?`}
                    onConfirm={handleDelete}
                    onCancel={() => setCourseToDelete(null)}
                />
            )}

            <Modal show={isModalOpen} title={editingCourse ? "Edit Course" : "Add New Course"} onClose={handleCloseModal}>
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                    <FormInput label="Course Name" name="name" value={formState.name} onChange={handleInputChange} required />
                    <FormSelect label="Category" name="category" value={formState.category} onChange={handleInputChange} required>
                        <option value="Spoken English">Spoken English</option>
                        <option value="Computer">Computer</option>
                    </FormSelect>
                    <FormSelect label="Level" name="level" value={formState.level} onChange={handleInputChange} required>
                        <option value="Basic">Basic</option>
                        <option value="Advanced">Advanced</option>
                    </FormSelect>
                    <FormInput label="Duration (e.g., '3 Months')" name="duration" value={formState.duration} onChange={handleInputChange} required />
                    <FormInput label="Total Fee (₹)" name="totalFee" type="number" value={formState.totalFee > 0 ? formState.totalFee : ''} onChange={handleInputChange} required />

                    <div className="d-flex justify-content-end pt-3 mt-3 border-top">
                        <button type="button" onClick={handleCloseModal} className="btn btn-secondary me-2">Cancel</button>
                        <button type="submit" className="btn btn-primary">{editingCourse ? "Save Changes" : "Add Course"}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default CoursesView;