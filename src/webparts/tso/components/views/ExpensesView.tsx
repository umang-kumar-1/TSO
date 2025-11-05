import React, { useState, useMemo } from 'react';
import Table, { type TableHeader } from '../common/Table';
import Modal from '../common/Modal';
import ConfirmationModal from '../common/ConfirmationModal';
import { useMockData } from '../../hooks/useMockData';
import { useTable } from '../../hooks/useTable';
import type { Expense } from '../../types';

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
const FormTextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, ...props }) => (
    <div className="mb-3">
        <label className="form-label">{label}</label>
        <textarea {...props} rows={3} className="form-control" />
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

const ExpensesView: React.FC<{ data: ReturnType<typeof useMockData> }> = ({ data }) => {
    const { expenses, staff, addExpense, updateExpense, deleteExpense } = data;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
    const [categoryFilter, setCategoryFilter] = useState('all');

    const initialFormState: Omit<Expense, 'id'> = { description: '', category: 'Other', amount: 0, date: new Date().toISOString().split('T')[0], billUrl: '', comments: '', expenseFile: null };
    const [formState, setFormState] = useState(initialFormState);
    
    const expenseCategories = useMemo(() => Array.from(new Set(expenses.map(e => e.category))), [expenses]);

    const augmentedExpenses = useMemo(() => expenses.map(e => ({
        ...e,
        staffName: staff.find(t => t.id === e.staffId)?.name || ''
    })), [expenses, staff]);


    const filteredItems = useMemo(() => {
        return augmentedExpenses.filter(expense => {
            return categoryFilter === 'all' || expense.category === categoryFilter;
        });
    }, [augmentedExpenses, categoryFilter]);

    const { sortedItems, requestSort, sortConfig, searchTerm, setSearchTerm } = useTable(
        filteredItems,
        ['description', 'category', 'amount', 'date', 'staffName'],
        'date'
    );

    const headers: TableHeader[] = [
        { key: 'description', label: 'Description', sortable: true },
        { key: 'category', label: 'Category', sortable: true },
        { key: 'amount', label: 'Amount', sortable: true },
        { key: 'date', label: 'Date', sortable: true },
        { key: 'bill', label: 'Bill', sortable: false },
        { key: 'actions', label: 'Actions', sortable: false },
    ];

    const handleOpenModal = (expense: Expense | null = null) => {
        if (expense) {
            setEditingExpense(expense);
            setFormState(expense);
        } else {
            setEditingExpense(null);
            setFormState(initialFormState);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingExpense(null);
        setFormState(initialFormState);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormState(prev => {
            const newState = {
                ...prev,
                [name]: type === 'number' ? parseFloat(value) || 0 : value,
            };
            if (name === 'category' && value !== 'Salary') {
                newState.staffId = '';
            }
            return newState;
        });
    };

     const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const base64 = await toBase64(e.target.files[0]);
            setFormState({ ...formState, billUrl: base64, expenseFile: file as any });
        }
    };

    const handleSubmit = () => {
        if (formState.description && formState.amount > 0) {
            if (formState.category === 'Salary' && !formState.staffId) {
                alert('Please select a staff member for the salary expense.');
                return;
            }
            if (editingExpense) {
                updateExpense(formState as Expense);
            } else {
                addExpense(formState);
            }
            handleCloseModal();
        } else {
            alert('Please fill description and a valid amount.');
        }
    };

    const handleDelete = () => {
        if (expenseToDelete) {
            deleteExpense(expenseToDelete.id);
            setExpenseToDelete(null);
        }
    };


    const filters = (
        <>
            <select
                className="form-select form-select-sm"
                style={{width: 'auto'}}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filter by category"
            >
                <option value="all">All Categories</option>
                {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
        </>
    );

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h2">Expenses</h1>
                <button 
                    onClick={() => handleOpenModal()}
                    className="btn btn-primary">
                    Add Expense
                </button>
            </div>
            <Table 
                headers={headers}
                itemCount={sortedItems.length}
                totalItemCount={expenses.length}
                itemName="expense"
                itemNamePlural="expenses"
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                sortConfig={sortConfig}
                requestSort={requestSort}
                filterComponents={filters}
            >
                {sortedItems.map(expense => (
                    <tr key={expense.id} className="align-middle">
                        <td className="p-3">
                            <div className="fw-semibold">{expense.description}</div>
                             {expense.category === 'Salary' && expense.staffId && (
                                <div className="small text-body-secondary">
                                    For: {staff.find(t => t.id === expense.staffId)?.name || 'Unknown Staff'}
                                </div>
                            )}
                            {expense.comments && <div className="small text-body-secondary">{expense.comments}</div>}
                        </td>
                        <td className="p-3">{expense.category}</td>
                        <td className="p-3 text-danger fw-semibold">-₹{expense.amount.toLocaleString()}</td>
                        <td className="p-3">{formatDate(expense.date)}</td>
                        <td className="p-3 text-center">
                            {expense.billUrl ? (
                                <a href={expense.billUrl} target="_blank" rel="noopener noreferrer" className="text-primary">
                                    <DocumentIcon />
                                </a>
                            ) : (
                                <span>-</span>
                            )}
                        </td>
                        <td className="p-3">
                            <div className="d-flex gap-2">
                                <button onClick={() => handleOpenModal(expense)} className="btn btn-sm btn-outline-secondary">
                                    <EditIcon />
                                </button>
                                <button onClick={() => setExpenseToDelete(expense)} className="btn btn-sm btn-outline-danger">
                                    <DeleteIcon />
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </Table>

            {expenseToDelete && (
                <ConfirmationModal
                    title="Delete Expense"
                    message={`Are you sure you want to delete the expense "${expenseToDelete.description}"?`}
                    onConfirm={handleDelete}
                    onCancel={() => setExpenseToDelete(null)}
                />
            )}

            <Modal show={isModalOpen} title={editingExpense ? "Edit Expense" : "Add New Expense"} onClose={handleCloseModal}>
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                    <FormInput label="Description" name="description" value={formState.description} onChange={handleInputChange} required />
                    <div className="row">
                        <div className="col-md-6">
                            <FormSelect label="Category" name="category" value={formState.category} onChange={handleInputChange} required>
                                <option value="Salary">Salary</option>
                                <option value="Utilities">Utilities</option>
                                <option value="Marketing">Marketing</option>
                                <option value="Rent">Rent</option>
                                <option value="Other">Other</option>
                            </FormSelect>
                        </div>
                        <div className="col-md-6">
                            <FormInput label="Amount (₹)" name="amount" type="number" value={formState.amount > 0 ? formState.amount : ''} onChange={handleInputChange} required />
                        </div>
                    </div>
                    {formState.category === 'Salary' && (
                        <FormSelect label="Staff Member" name="staffId" value={formState.staffId ?? ''} onChange={handleInputChange} required>
                            <option value="">Select a staff member</option>
                            {staff.map(staffMember => (
                                <option key={staffMember.id} value={staffMember.id}>{staffMember.name}</option>
                            ))}
                        </FormSelect>
                    )}
                    <FormInput label="Date" name="date" type="date" value={formState.date} onChange={handleInputChange} required />
                    <FormTextArea label="Comments" name="comments" value={formState.comments ?? ''} onChange={handleInputChange} />
                    <FormInput label="Bill/Receipt" name="billUrl" type="file" onChange={handleFileChange} />

                    <div className="d-flex justify-content-end pt-3 mt-3 border-top">
                        <button type="button" onClick={handleCloseModal} className="btn btn-secondary me-2">Cancel</button>
                        <button type="submit" className="btn btn-primary">{editingExpense ? "Save Changes" : "Add Expense"}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ExpensesView;