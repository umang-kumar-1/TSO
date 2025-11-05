import React, { useState, useRef, useEffect, useMemo } from 'react';
import Table, { type TableHeader } from '../common/Table';
import Modal from '../common/Modal';
import ConfirmationModal from '../common/ConfirmationModal';
import { useMockData } from '../../hooks/useMockData';
import { useTable } from '../../hooks/useTable';
import type { Lead } from '../../types';

// Icons
const EditIcon: React.FC<{className?: string}> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
);
const DeleteIcon: React.FC<{className?: string}> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
);
const UploadIcon: React.FC<{className?: string}> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);
const DownloadIcon: React.FC<{className?: string}> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);
const CommentIcon: React.FC<{className?: string}> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
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
const FormTextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, ...props }) => (
    <div className="mb-3">
        <label className="form-label">{label}</label>
        <textarea {...props} rows={2} className="form-control" />
    </div>
);

const statusColors: { [key in Lead['status']]: string } = {
    'New': 'text-bg-primary',
    'Contacted': 'text-bg-info',
    'Follow-up': 'text-bg-warning',
    'Converted': 'text-bg-success',
    'Lost': 'text-bg-danger',
};

const formatDate = (isoDateString?: string): string => {
  if (!isoDateString) return 'N/A';
  const datePart = isoDateString.split('T')[0];
  const parts = datePart.split('-');
  if (parts.length !== 3) return isoDateString;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

const formatDateTime = (isoDateString?: string): string => {
    if (!isoDateString) return 'N/A';
    try {
        const date = new Date(isoDateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        const strHours = String(hours).padStart(2, '0');
        return `${day}/${month}/${year} ${strHours}:${minutes} ${ampm}`;
    } catch(e) {
        return isoDateString;
    }
};

const LeadsView: React.FC<{ data: ReturnType<typeof useMockData> }> = ({ data }) => {
    const { leads, courses, staff, addLead, updateLead, deleteLead, addCommentToLead } = data;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
    const [editingLead, setEditingLead] = useState<Lead | null>(null);
    const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
    const [viewingCommentsForLead, setViewingCommentsForLead] = useState<Lead | null>(null);
    const [newComment, setNewComment] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [statusFilter, setStatusFilter] = useState('all');
    const [sourceFilter, setSourceFilter] = useState('all');

    const initialFormState: Omit<Lead, 'id' | 'comments'> & { initialComment?: string } = { name: '', email: '', phone: '', interestedCourseId: '', source: 'Walk-in', status: 'New', enquiryDate: new Date().toISOString().split('T')[0], nextFollowUpDate: '', assignedTo: '', initialComment: '' };
    const [formState, setFormState] = useState(initialFormState);
    const leadSources = useMemo(() => Array.from(new Set(leads.map(l => l.source))), [leads]);
    

    const augmentedLeads = useMemo(() => leads.map(lead => ({
        ...lead,
        courseName: courses.find(c => c.id === lead.interestedCourseId)?.name || 'N/A'
    })), [leads, courses]);


    const filteredItems = useMemo(() => {
        return augmentedLeads.filter(lead => {
            const statusMatch = statusFilter === 'all' || lead.status === statusFilter;
            const sourceMatch = sourceFilter === 'all' || lead.source === sourceFilter;
            return statusMatch && sourceMatch;
        });
    }, [augmentedLeads, statusFilter, sourceFilter]);

        const { sortedItems, requestSort, sortConfig, searchTerm, setSearchTerm } = useTable(
        filteredItems,
        ['name', 'email', 'phone', 'courseName', 'source', 'status', 'enquiryDate'],
        'enquiryDate',
        'descending'
    );
    
    const headers: TableHeader[] = [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'courseName', label: 'Interested Course', sortable: true },
        { key: 'source', label: 'Source', sortable: true },
        { key: 'enquiryDate', label: 'Enquiry Date', sortable: true },
        { key: 'nextFollowUpDate', label: 'Follow-up Date', sortable: true },
        { key: 'status', label: 'Status', sortable: true },
        { key: 'comments', label: 'Comments', sortable: false },
        { key: 'actions', label: 'Actions', sortable: false },
    ];

    useEffect(() => {
        if (viewingCommentsForLead) {
            const updatedLeadInList = leads.find(l => l.id === viewingCommentsForLead.id);
            if (updatedLeadInList) {
                setViewingCommentsForLead(updatedLeadInList);
            }
        }
    }, [leads, viewingCommentsForLead]);

    const getStaffName = (staffId: string) => staff.find(s => s.id === staffId)?.name || 'System';

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !viewingCommentsForLead) return;
        
        const authorId = viewingCommentsForLead.assignedTo || staff.find(s => s.role === 'Counsellor')?.id || staff[0].id;
        
        addCommentToLead(viewingCommentsForLead.id, {
            text: newComment,
            authorId,
            timestamp: new Date().toISOString(),
        });
        
        setNewComment('');
    };

    const handleOpenModal = (lead: Lead | null = null) => {
        if (lead) {
            setEditingLead(lead);
            setFormState({...lead, initialComment: ''});
        } else {
            setEditingLead(null);
            setFormState(initialFormState);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => setIsModalOpen(false);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormState({ ...formState, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        if (formState.name && formState.phone && formState.interestedCourseId) {
            if (editingLead) {
                const { initialComment, ...leadToUpdate } = formState;
                updateLead(leadToUpdate as Lead);
            } else {
                const { initialComment, ...leadData } = formState;
                const newLead: Omit<Lead, 'id'> = { ...leadData, comments: [] };

                if (initialComment && initialComment.trim()) {
                    const authorId = formState.assignedTo || staff.find(s => s.role === 'Counsellor')?.id || staff[0].id;
                    newLead.comments = [{
                        id: `com${Date.now()}`,
                        text: initialComment,
                        authorId,
                        timestamp: new Date().toISOString()
                    }];
                }
                addLead(newLead);
            }
            handleCloseModal();
        } else {
            alert('Please fill Name, Phone, and Interested Course.');
        }
    };

    const handleDelete = () => {
        if (leadToDelete) {
            deleteLead(leadToDelete.id);
            setLeadToDelete(null);
        }
    };
    
    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const dataBuffer = e.target?.result;
                // @ts-ignore
                const workbook = XLSX.read(dataBuffer, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                // @ts-ignore
                const json: any[] = XLSX.utils.sheet_to_json(worksheet);

                let successCount = 0;
                let errorCount = 0;
                let errors: string[] = [];

                json.forEach((row, index) => {
                    const { name, email, phone, interestedCourse, source, status, enquiryDate, comments } = row;

                    if (!name || !phone || !interestedCourse) {
                        errorCount++;
                        errors.push(`Row ${index + 2}: Missing required fields (name, phone, interestedCourse).`);
                        return;
                    }

                    const course = courses.find(c => c.name.toLowerCase() === String(interestedCourse).toLowerCase());
                    if (!course) {
                        errorCount++;
                        errors.push(`Row ${index + 2}: Course "${interestedCourse}" not found.`);
                        return;
                    }

                    let finalEnquiryDate = new Date().toISOString().split('T')[0];

                    if (enquiryDate) {
                        const dateStr = String(enquiryDate).trim();
                        const parts = dateStr.split('/');
                        if (parts.length === 3) {
                            const [day, month, year] = parts.map(p => parseInt(p, 10));
                            if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year > 1900 && year < 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                                const date = new Date(Date.UTC(year, month - 1, day));
                                if (date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day) {
                                    finalEnquiryDate = date.toISOString().split('T')[0];
                                } else {
                                    errorCount++;
                                    errors.push(`Row ${index + 2}: Invalid date value for "${enquiryDate}".`);
                                    return;
                                }
                            } else {
                                errorCount++;
                                errors.push(`Row ${index + 2}: Could not parse date parts for "${enquiryDate}".`);
                                return;
                            }
                        } else {
                            errorCount++;
                            errors.push(`Row ${index + 2}: Invalid date format for "${enquiryDate}". Expected dd/mm/yyyy.`);
                            return;
                        }
                    }

                    const newLead: Omit<Lead, 'id'> = {
                        name,
                        email: email || '',
                        phone: String(phone),
                        interestedCourseId: course.id,
                        source: source || 'Other',
                        status: status || 'New',
                        enquiryDate: finalEnquiryDate,
                        comments: [],
                    };

                    if (comments) {
                        newLead.comments = [{
                            id: `com-import-${Date.now()}`,
                            text: comments,
                            authorId: staff.find(s => s.role === 'Counsellor')?.id || staff[0]?.id || 'system',
                            timestamp: new Date().toISOString()
                        }];
                    }

                    addLead(newLead);
                    successCount++;
                });

                let alertMessage = `${successCount} leads imported successfully.`;
                if (errorCount > 0) {
                    alertMessage += `\n${errorCount} leads failed to import.\n\nErrors:\n${errors.slice(0, 5).join('\n')}`;
                    if(errors.length > 5) alertMessage += `\n...and ${errors.length - 5} more errors.`;
                }
                alert(alertMessage);

            } catch (error) {
                console.error("Error parsing Excel file:", error);
                alert("Failed to parse the Excel file. Please ensure it's a valid .xlsx or .xls file.");
            }
        };
        reader.onerror = (error) => {
             console.error("Error reading file:", error);
             alert("Failed to read the file.");
        };
        reader.readAsBinaryString(file);
        
        event.target.value = ''; // Reset file input
    };

    const handleDownloadSample = () => {
        const sampleData = [{
            name: 'John Smith',
            email: 'john.smith@example.com',
            phone: '1234567890',
            interestedCourse: courses[0]?.name || 'Sample Course Name',
            source: 'Website',
            status: 'New',
            enquiryDate: '25/07/2024',
            comments: 'Called to ask about timings.'
        }];
        
        // @ts-ignore
        const worksheet = XLSX.utils.json_to_sheet(sampleData);
        // @ts-ignore
        const workbook = XLSX.utils.book_new();
        // @ts-ignore
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
        // @ts-ignore
        XLSX.writeFile(workbook, 'talent_shapers_leads_template.xlsx');
    };


    const filters = (
        <>
            <select
                className="form-select form-select-sm"
                style={{width: 'auto'}}
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                aria-label="Filter by source"
            >
                <option value="all">All Sources</option>
                {leadSources.map(source => <option key={source} value={source}>{source}</option>)}
            </select>
            <select
                className="form-select form-select-sm"
                style={{width: 'auto'}}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
            >
                <option value="all">All Statuses</option>
                {Object.keys(statusColors).map(status => <option key={status} value={status}>{status}</option>)}
            </select>
        </>
    );


    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h2">Leads & Enquiries</h1>
                 <div className="d-flex align-items-center">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        accept=".xlsx, .xls"
                    />
                    <div className="btn-group">
                        <button onClick={handleImportClick} className="btn btn-outline-secondary d-flex align-items-center">
                            <UploadIcon className="me-1" />
                            Import
                        </button>
                        <button onClick={() => setIsFormatModalOpen(true)} className="btn btn-outline-secondary" title="View Excel format info">
                           ?
                        </button>
                    </div>
                    <button onClick={() => handleOpenModal()} className="btn btn-primary ms-2">
                        Add New Lead
                    </button>
                </div>
            </div>
            <Table 
                headers={headers}
                itemCount={sortedItems.length}
                totalItemCount={leads.length}
                itemName="lead"
                itemNamePlural="leads"
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                sortConfig={sortConfig}
                requestSort={requestSort}
                filterComponents={filters}
            >
                {sortedItems.map(lead => (
                    <tr key={lead.id} className="align-middle">
                        <td className="p-3">
                            <div className="fw-semibold">{lead.name}</div>
                            <div className="small text-body-secondary">{lead.email} &bull; {lead.phone}</div>
                        </td>
                        <td className="p-3">{lead.courseName}</td>
                        <td className="p-3">{lead.source}</td>
                        <td className="p-3">{formatDate(lead.enquiryDate)}</td>
                        <td className="p-3">{formatDate(lead.nextFollowUpDate)}</td>
                        <td className="p-3">
                            <span className={`badge rounded-pill ${statusColors[lead.status]}`}>
                                {lead.status}
                            </span>
                        </td>
                        <td className="p-3 text-center">
                            <button
                                className="btn btn-sm btn-outline-secondary d-flex align-items-center"
                                onClick={() => {
                                    setViewingCommentsForLead(lead);
                                    setNewComment('');
                                }}
                            >
                                <CommentIcon className="me-1" />
                                <span>{lead.comments?.length || 0}</span>
                            </button>
                        </td>
                        <td className="p-3">
                            <div className="d-flex gap-2">
                                <button onClick={() => handleOpenModal(lead)} className="btn btn-sm btn-outline-secondary"><EditIcon /></button>
                                <button onClick={() => setLeadToDelete(lead)} className="btn btn-sm btn-outline-danger"><DeleteIcon /></button>
                            </div>
                        </td>
                    </tr>
                ))}
            </Table>

            <Modal show={isFormatModalOpen} title="Excel Import Format Guide" onClose={() => setIsFormatModalOpen(false)}>
                <div>
                    <p className="text-body-secondary">
                        Please prepare your Excel file with the following columns. The column headers in the first row must match the "Header" name exactly.
                    </p>
                    <div className="alert alert-info small">
                        <strong>Important:</strong> The value in the <code>interestedCourse</code> column must be the <strong>full name</strong> of a course that already exists in the system (e.g., "Web Development Bootcamp"). The match is case-insensitive.
                    </div>
                    <table className="table table-bordered table-sm small">
                        <thead className="table-light">
                            <tr>
                                <th>Header</th>
                                <th>Required?</th>
                                <th>Description</th>
                                <th>Example</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>name</td><td>Yes</td><td>Full name of the lead.</td><td><code>Jane Doe</code></td></tr>
                            <tr><td>email</td><td>No</td><td>Email address.</td><td><code>jane.doe@example.com</code></td></tr>
                            <tr><td>phone</td><td>Yes</td><td>Contact phone number.</td><td><code>9876543210</code></td></tr>
                            <tr><td>interestedCourse</td><td>Yes</td><td>The exact name of the course.</td><td><code>Fundamentals of Spoken English</code></td></tr>
                            <tr><td>source</td><td>No</td><td>Lead source (e.g., Website, Walk-in). Defaults to 'Other'.</td><td><code>Website</code></td></tr>
                            <tr><td>status</td><td>No</td><td>Status (e.g., New, Contacted). Defaults to 'New'.</td><td><code>New</code></td></tr>
                            <tr><td>enquiryDate</td><td>No</td><td>Date of enquiry (dd/mm/yyyy). Defaults to today.</td><td><code>25/07/2024</code></td></tr>
                            <tr><td>comments</td><td>No</td><td>Any additional comments (will be the first comment).</td><td><code>Interested in weekend classes.</code></td></tr>
                        </tbody>
                    </table>
                </div>
                <div className="d-flex justify-content-end pt-3 mt-3 border-top">
                    <button type="button" onClick={() => setIsFormatModalOpen(false)} className="btn btn-secondary me-2">Close</button>
                    <button type="button" onClick={handleDownloadSample} className="btn btn-primary d-flex align-items-center">
                        <DownloadIcon className="me-1" />
                        Download Sample
                    </button>
                </div>
            </Modal>
            
            {leadToDelete && (
                <ConfirmationModal
                    title="Delete Lead"
                    message={`Are you sure you want to delete the lead for ${leadToDelete.name}?`}
                    onConfirm={handleDelete}
                    onCancel={() => setLeadToDelete(null)}
                />
            )}
            
            {viewingCommentsForLead && (
                <Modal
                    title={`Comments for ${viewingCommentsForLead.name}`}
                    onClose={() => setViewingCommentsForLead(null)}
                    show={!!viewingCommentsForLead}
                >
                    <div className="d-flex flex-column" style={{minHeight: '400px'}}>
                        <div className="flex-grow-1 mb-3 border rounded p-2 bg-body-tertiary" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {Array.isArray(viewingCommentsForLead.comments) && viewingCommentsForLead.comments.length > 0 ? (
                                viewingCommentsForLead.comments.slice().reverse().map(comment => (
                                    <div key={comment.id} className="mb-3">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="fw-semibold small">{getStaffName(comment.authorId)}</span>
                                            <span className="text-body-secondary small">{formatDateTime(comment.timestamp)}</span>
                                        </div>
                                        <div className="p-2 mt-1 bg-body rounded" style={{whiteSpace: "pre-wrap"}}>
                                            {comment.text}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="d-flex h-100 align-items-center justify-content-center">
                                    <p className="text-body-secondary">No comments yet.</p>
                                </div>
                            )}
                        </div>
                        
                        <form onSubmit={handleCommentSubmit}>
                            <FormTextArea
                                label="Add a New Comment"
                                name="newComment"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Type your comment here..."
                                required
                            />
                            <div className="d-flex justify-content-end pt-3 mt-3 border-top">
                                <button type="button" onClick={() => setViewingCommentsForLead(null)} className="btn btn-secondary me-2">Close</button>
                                <button type="submit" className="btn btn-primary">Add Comment</button>
                            </div>
                        </form>
                    </div>
                </Modal>
            )}

            <Modal show={isModalOpen} title={editingLead ? 'Edit Lead' : 'Add New Lead'} onClose={handleCloseModal}>
                <form onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
                    <FormInput label="Full Name" name="name" value={formState.name} onChange={handleInputChange} required />
                    <div className="row">
                        <div className="col-md-6"><FormInput label="Email" name="email" type="email" value={formState.email ?? ''} onChange={handleInputChange} /></div>
                        <div className="col-md-6"><FormInput label="Phone" name="phone" type="tel" value={formState.phone} onChange={handleInputChange} required /></div>
                    </div>
                    <FormSelect label="Interested Course" name="interestedCourseId" value={formState.interestedCourseId} onChange={handleInputChange} required>
                        <option value="">Select a course</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </FormSelect>
                    <div className="row">
                        <div className="col-md-6">
                            <FormSelect label="Source" name="source" value={formState.source} onChange={handleInputChange}>
                                <option>Walk-in</option><option>Website</option><option>Referral</option><option>Social Media</option><option>Other</option>
                            </FormSelect>
                        </div>
                         <div className="col-md-6">
                            <FormSelect label="Status" name="status" value={formState.status} onChange={handleInputChange}>
                                <option>New</option><option>Contacted</option><option>Follow-up</option><option>Converted</option><option>Lost</option>
                            </FormSelect>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-6"><FormInput label="Enquiry Date" name="enquiryDate" type="date" value={formState.enquiryDate} onChange={handleInputChange} /></div>
                        <div className="col-md-6"><FormInput label="Next Follow-up" name="nextFollowUpDate" type="date" value={formState.nextFollowUpDate ?? ''} onChange={handleInputChange} /></div>
                    </div>
                    <FormSelect label="Assigned To" name="assignedTo" value={formState.assignedTo ?? ''} onChange={handleInputChange}>
                        <option value="">Assign to staff...</option>
                        {staff.filter(s => s.role === 'Counsellor' || s.role === 'Sales').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </FormSelect>
                    <FormTextArea
                        label="Initial Comment"
                        name="initialComment"
                        value={formState.initialComment ?? ''}
                        onChange={handleInputChange}
                        placeholder={editingLead ? "Add/view comments via the comment icon" : "Add an initial note..."}
                        disabled={!!editingLead}
                    />
                    <div className="d-flex justify-content-end pt-3 mt-3 border-top">
                        <button type="button" onClick={handleCloseModal} className="btn btn-secondary me-2">Cancel</button>
                        <button type="submit" className="btn btn-primary">{editingLead ? 'Save Changes' : 'Add Lead'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default LeadsView;