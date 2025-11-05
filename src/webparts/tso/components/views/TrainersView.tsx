

import React, { useState, useMemo } from 'react';
import Table, { type TableHeader } from '../common/Table';
import Modal from '../common/Modal';
import ConfirmationModal from '../common/ConfirmationModal';
import { useMockData } from '../../hooks/useMockData';
import { useTable } from '../../hooks/useTable';
import type { Staff } from '../../types';

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
const FormTextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, ...props }) => (
    <div className="mb-3">
        <label className="form-label">{label}</label>
        <textarea {...props} rows={2} className="form-control" />
    </div>
);

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

interface StaffViewProps {
    data: ReturnType<typeof useMockData>;
    onViewProfile: (staffId: string) => void;
}

const StaffView: React.FC<StaffViewProps> = ({ data, onViewProfile }) => {
    const { staff, courses, addStaff, updateStaff, deleteStaff } = data;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
    const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');

    const initialFormState: Omit<Staff, 'id'> = { name: '', email: '', role: 'Trainer', expertise: [], phone: '', address: '', imageUrl: '', gender: 'Male', status: 'Active', about: '', joiningDate: new Date().toISOString().split('T')[0], employmentType: 'Full-time', salary: 0, salaryType: 'Monthly', imageFile: null, };
    const [formState, setFormState] = useState(initialFormState);

    const staffRoles = useMemo(() => Array.from(new Set(staff.map(s => s.role))), [staff]);

    const filteredItems = useMemo(() => {
        return staff.filter(staffMember => {
            const statusMatch = statusFilter === 'all' || staffMember.status === statusFilter;
            const roleMatch = roleFilter === 'all' || staffMember.role === roleFilter;
            return statusMatch && roleMatch;
        });
    }, [staff, statusFilter, roleFilter]);

    const { sortedItems, requestSort, sortConfig, searchTerm, setSearchTerm } = useTable(
        filteredItems,
        ['name', 'email', 'phone', 'role'],
        'name'
    );
    
    const headers: TableHeader[] = [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'role', label: 'Role', sortable: true },
        { key: 'contact', label: 'Contact', sortable: false },
        { key: 'status', label: 'Status', sortable: true },
        { key: 'actions', label: 'Actions', sortable: false },
    ];
    const handleOpenModal = (staffMember: Staff | null = null) => {
        if (staffMember) {
            setEditingStaff(staffMember);
            setFormState(staffMember);
        } else {
            setEditingStaff(null);
            setFormState(initialFormState);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingStaff(null);
        setFormState(initialFormState);
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormState(prev => {
           const newState = {
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value,
           };
           if (name === 'role' && value !== 'Trainer') {
               newState.expertise = [];
           }
            // If employment type is changed to anything other than Part-time, force salary type to Monthly
           if (name === 'employmentType' && value !== 'Part-time') {
               newState.salaryType = 'Monthly';
           }
           return newState;
        });
    };

    const handleExpertiseChange = (courseId: string) => {
        const newExpertise = formState.expertise?.includes(courseId)
            ? formState.expertise.filter(id => id !== courseId)
            : [...(formState.expertise ?? []), courseId];
        setFormState({ ...formState, expertise: newExpertise });
    };
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const base64 = await toBase64(file);
          setFormState({ ...formState, imageUrl: base64, imageFile: file as any });
        }
      };

    const handleSubmit = () => {
        if (formState.name && formState.email && formState.salary > 0) {
            if (editingStaff) {
                updateStaff(formState as Staff);
            } else {
                addStaff(formState);
            }
            handleCloseModal();
        } else {
            alert('Please fill Name, Email, and provide a valid Salary.');
        }
    };

    const handleDelete = () => {
        if (staffToDelete) {
            deleteStaff(staffToDelete.id);
            setStaffToDelete(null);
        }
    };

    const filters = (
        <>
            <select
                className="form-select form-select-sm"
                style={{width: 'auto'}}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                aria-label="Filter by role"
            >
                <option value="all">All Roles</option>
                {staffRoles.map(role => <option key={role} value={role}>{role}</option>)}
            </select>
            <select
                className="form-select form-select-sm"
                style={{width: 'auto'}}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
            >
                <option value="all">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Discontinued">Discontinued</option>
            </select>
        </>
    );

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h2">Staff</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="btn btn-primary">
                    Add Staff Member
                </button>
            </div>
            <Table 
                headers={headers}
                itemCount={sortedItems.length}
                totalItemCount={staff.length}
                itemName="staff member"
                itemNamePlural="staff"
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                sortConfig={sortConfig}
                requestSort={requestSort}
                filterComponents={filters}
            >
                {sortedItems.map(staffMember => (
                    <tr key={staffMember.id} className={`align-middle ${staffMember.status === 'Discontinued' ? 'opacity-50' : ''}`}>
                        <td className="p-3">
                            <div className="d-flex align-items-center">
                                <img src={staffMember.imageUrl || `https://ui-avatars.com/api/?name=${staffMember.name.replace(' ', '+')}&background=random`} alt={staffMember.name} className="rounded-circle me-3 object-fit-cover" width="40" height="40" />
                                <button onClick={() => onViewProfile(staffMember.id)} className="btn btn-link p-0 text-start text-decoration-none fw-semibold">
                                    {staffMember.name}
                                </button>
                            </div>
                        </td>
                        <td className="p-3">{staffMember.role}</td>
                        <td className="p-3">
                            <div>{staffMember.email}</div>
                            <div className="small text-body-secondary">{staffMember.phone}</div>
                        </td>
                        <td className="p-3">
                            <span className={`badge rounded-pill ${
                                staffMember.status === 'Active' 
                                ? 'text-bg-success' 
                                : 'text-bg-secondary'
                            }`}>
                                {staffMember.status}
                            </span>
                        </td>
                        <td className="p-3">
                            <div className="d-flex gap-2">
                                <button onClick={() => handleOpenModal(staffMember)} className="btn btn-sm btn-outline-secondary">
                                    <EditIcon />
                                </button>
                                <button onClick={() => setStaffToDelete(staffMember)} className="btn btn-sm btn-outline-danger">
                                    <DeleteIcon />
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </Table>

            {staffToDelete && (
                <ConfirmationModal
                    title="Delete Staff Member"
                    message={`Are you sure you want to delete ${staffToDelete.name}?`}
                    onConfirm={handleDelete}
                    onCancel={() => setStaffToDelete(null)}
                />
            )}

            <Modal show={isModalOpen} title={editingStaff ? "Edit Staff Member" : "Add New Staff Member"} onClose={handleCloseModal}>
                 <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                    <div className="row">
                        <div className="col-md-4">
                            <FormInput label="Full Name" name="name" value={formState.name} onChange={handleInputChange} required />
                        </div>
                        <div className="col-md-4">
                            <FormInput label="Email Address" name="email" type="email" value={formState.email} onChange={handleInputChange} required />
                        </div>
                        <div className="col-md-4">
                            <FormInput label="Phone Number" name="phone" type="tel" value={formState.phone} onChange={handleInputChange} />
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-4">
                            <FormSelect label="Role" name="role" value={formState.role} onChange={handleInputChange} required>
                                <option value="Trainer">Trainer</option>
                                <option value="Counsellor">Counsellor</option>
                                <option value="Front Desk">Front Desk</option>
                                <option value="Sales">Sales</option>
                                <option value="Other">Other</option>
                            </FormSelect>
                        </div>
                        <div className="col-md-4">
                            <FormSelect label="Gender" name="gender" value={formState.gender} onChange={handleInputChange} required>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </FormSelect>
                        </div>
                        <div className="col-md-4">
                           <FormSelect label="Status" name="status" value={formState.status} onChange={handleInputChange} required>
                                <option value="Active">Active</option>
                                <option value="Discontinued">Discontinued</option>
                            </FormSelect>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-4">
                            <FormInput label="Joining Date" name="joiningDate" type="date" value={formState.joiningDate} onChange={handleInputChange} required />
                        </div>
                        <div className="col-md-4">
                            <FormSelect label="Employment Type" name="employmentType" value={formState.employmentType} onChange={handleInputChange} required>
                                <option value="Full-time">Full-time</option>
                                <option value="Part-time">Part-time</option>
                                <option value="Contract">Contract</option>
                            </FormSelect>
                        </div>
                        <div className="col-md-4">
                            <FormInput 
                                label={`Salary (${formState.salaryType === 'Hourly' ? '₹ / hour' : '₹ / month'})`} 
                                name="salary" 
                                type="number" 
                                value={formState.salary > 0 ? formState.salary : ''} 
                                onChange={handleInputChange} 
                                required 
                            />
                        </div>
                    </div>
                    {formState.employmentType === 'Part-time' && (
                        <div className="row">
                            <div className="col-md-4">
                                <FormSelect label="Salary Type" name="salaryType" value={formState.salaryType} onChange={handleInputChange}>
                                    <option value="Monthly">Monthly</option>
                                    <option value="Hourly">Hourly</option>
                                </FormSelect>
                            </div>
                        </div>
                    )}
                    <div className="row">
                        <div className="col-md-6">
                            <FormTextArea label="Address" name="address" value={formState.address ?? ''} onChange={handleInputChange} />
                        </div>
                        <div className="col-md-6">
                            <FormTextArea label="About" name="about" value={formState.about ?? ''} onChange={handleInputChange} />
                        </div>
                    </div>
                    <FormInput label="Profile Picture" name="imageUrl" type="file" accept="image/*" onChange={handleFileChange} />
                    {formState.role === 'Trainer' && (
                        <div className="mb-3">
                            <label className="form-label">Expertise</label>
                            <div className="border rounded p-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                <div className="row">
                                    {courses.map(course => (
                                        <div key={course.id} className="col-12 col-md-6">
                                            <div className="form-check">
                                                <input
                                                    type="checkbox"
                                                    id={`expertise-${course.id}`}
                                                    className="form-check-input"
                                                    checked={formState.expertise?.includes(course.id)}
                                                    onChange={() => handleExpertiseChange(course.id)}
                                                />
                                                <label className="form-check-label" htmlFor={`expertise-${course.id}`}>{course.name}</label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="d-flex justify-content-end pt-3 mt-3 border-top">
                        <button type="button" onClick={handleCloseModal} className="btn btn-secondary me-2">Cancel</button>
                        <button type="submit" className="btn btn-primary">{editingStaff ? "Save Changes" : "Add Staff"}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default StaffView;
