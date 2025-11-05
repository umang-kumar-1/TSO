import React, { useState, useMemo } from 'react';
import Table, { type TableHeader } from '../common/Table';
import Modal from '../common/Modal';
import ConfirmationModal from '../common/ConfirmationModal';
import { useMockData } from '../../hooks/useMockData';
import { useTable } from '../../hooks/useTable';
import type { FeePayment } from '../../types';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


// Icons for actions
const EditIcon: React.FC<{className?: string}> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
);
const DeleteIcon: React.FC<{className?: string}> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
);
const ReceiptIcon: React.FC<{ className?: string }> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
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

const formatDate = (isoDateString?: string): string => {
  if (!isoDateString) return 'N/A';
  const datePart = isoDateString.split('T')[0];
  const parts = datePart.split('-');
  if (parts.length !== 3) return isoDateString;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};


const FeesView: React.FC<{ data: ReturnType<typeof useMockData> }> = ({ data }) => {
    const { feePayments, students, addFeePayment, updateFeePayment, deleteFeePayment } = data;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState<FeePayment | null>(null);
    const [paymentToDelete, setPaymentToDelete] = useState<FeePayment | null>(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [methodFilter, setMethodFilter] = useState('all');

    const initialFormState: Omit<FeePayment, 'id'> = { studentId: '', amount: 0, date: new Date().toISOString().split('T')[0], status: 'Paid', paymentMethod: 'Cash', comments: '' };
    const [formState, setFormState] = useState(initialFormState);

    const getStudentName = (studentId: string) => {
        return students.find(s => s.id === studentId)?.name || 'Unknown Student';
    };

    const augmentedFeePayments = useMemo(() => feePayments.map(p => ({
        ...p,
        studentName: getStudentName(p.studentId)
    })), [feePayments, students]);


    const paymentMethods = useMemo(() => Array.from(new Set(feePayments.map(p => p.paymentMethod))), [feePayments]);

    const filteredItems = useMemo(() => {
        return augmentedFeePayments.filter(payment => {
            const statusMatch = statusFilter === 'all' || payment.status === statusFilter;
            const methodMatch = methodFilter === 'all' || payment.paymentMethod === methodFilter;
            return statusMatch && methodMatch;
        });
    }, [augmentedFeePayments, statusFilter, methodFilter]);

    const { sortedItems, requestSort, sortConfig, searchTerm, setSearchTerm } = useTable(
        filteredItems,
        ['studentName', 'amount', 'date', 'paymentMethod', 'status'],
        'date'
    );
    
    const headers: TableHeader[] = [
        { key: 'studentName', label: 'Student Details', sortable: true },
        { key: 'amount', label: 'Amount', sortable: true },
        { key: 'date', label: 'Date', sortable: true },
        { key: 'paymentMethod', label: 'Payment Method', sortable: true },
        { key: 'status', label: 'Status', sortable: true },
        { key: 'actions', label: 'Actions', sortable: false },
    ];

    const handleOpenModal = (payment: FeePayment | null = null) => {
        if (payment) {
            setEditingPayment(payment);
            setFormState(payment);
        } else {
            setEditingPayment(null);
            setFormState(initialFormState);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPayment(null);
        setFormState(initialFormState);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormState(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value,
        }));
    };

    const handleSubmit = () => {
        if (formState.studentId && formState.amount > 0) {
            if (editingPayment) {
                updateFeePayment(formState as FeePayment);
            } else {
                addFeePayment(formState);
            }
            handleCloseModal();
        } else {
            alert('Please select a student and enter a valid amount.');
        }
    };

    const handleDelete = () => {
        if (paymentToDelete) {
            deleteFeePayment(paymentToDelete.id);
            setPaymentToDelete(null);
        }
    };

  const generateBillPdf = (payment: any, students: any[]) => {
    const student = students.find((s) => s.id === payment.studentId);
    if (!student) {
      console.error("Student not found for payment:", payment);
      return;
    }

    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Talent Shapers Orbit", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Kirti Tower, Techzone-4 Greater Noida West", 105, 27, {
      align: "center",
    });
    doc.setFontSize(14);
    doc.text("Payment Receipt", 105, 38, { align: "center" });

    // Student info
    doc.setFontSize(10);
    doc.text(`Bill To: ${student.name}`, 20, 55);
    doc.text(`Email: ${student.email}`, 20, 60);

    doc.text(`Transaction ID: ${payment.id}`, 190, 55, { align: "right" });
    doc.text(`Date: ${payment.date}`, 190, 60, { align: "right" });
    doc.text(`Payment Method: ${payment.paymentMethod}`, 190, 65, {
      align: "right",
    });

    // ✅ Correct usage of autoTable
    autoTable(doc, {
      startY: 75,
      head: [["Description", "Amount"]],
      body: [
        ["Course Fee Payment", `Rs. ${payment.amount.toLocaleString("en-IN")}`],
      ],
      foot: [
        [
          {
            content: "Total Paid",
            styles: { halign: "right", fontStyle: "bold" },
          },
          {
            content: `Rs. ${payment.amount.toLocaleString("en-IN")}`,
            styles: { fontStyle: "bold" },
          },
        ],
      ],
      theme: "striped",
      headStyles: { fillColor: [78, 89, 104] },
    });

    // Footer
    const finalY = (doc as any).lastAutoTable?.finalY || 100;
    if (payment.comments) {
      doc.setFont("helvetica", "italic");
      doc.text(`Comments: ${payment.comments}`, 20, finalY + 10);
    }

    doc.setFont("helvetica", "normal");
    doc.text("Thank you for your payment!", 105, finalY + 20, {
      align: "center",
    });

    // Save
    const safeName = student.name.replace(/\s+/g, "_");
    doc.save(`Receipt-${safeName}-${payment.date}.pdf`);
  };

  const filters = (
    <>
        <select
            className="form-select form-select-sm"
            style={{width: 'auto'}}
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            aria-label="Filter by payment method"
        >
            <option value="all">All Methods</option>
            {paymentMethods.map(method => <option key={method} value={method}>{method}</option>)}
        </select>
        <select
            className="form-select form-select-sm"
            style={{width: 'auto'}}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
        >
            <option value="all">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
        </select>
    </>
);

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h2">Fee Collection</h1>
                <button 
                    onClick={() => handleOpenModal()}
                    className="btn btn-primary">
                    Add Payment
                </button>
            </div>
            <Table 
                headers={headers}
                itemCount={sortedItems.length}
                totalItemCount={feePayments.length}
                itemName="payment"
                itemNamePlural="payments"
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                sortConfig={sortConfig}
                requestSort={requestSort}
                filterComponents={filters}
            >
                {sortedItems.map(payment => (
                    <tr key={payment.id} className="align-middle">
                        <td className="p-3">
                             <div className="fw-semibold">{getStudentName(payment.studentId)}</div>
                            {payment.comments && <div className="small text-body-secondary">{payment.comments}</div>}
                        </td>
                        <td className="p-3">₹{payment.amount.toLocaleString()}</td>
                        <td className="p-3">{formatDate(payment.date)}</td>
                        <td className="p-3">{payment.paymentMethod}</td>
                        <td className="p-3">
                            <span className={`badge rounded-pill ${
                                payment.status === 'Paid' 
                                ? 'text-bg-success' 
                                : 'text-bg-warning'
                            }`}>
                                {payment.status}
                            </span>
                        </td>
                        <td className="p-3">
                            <div className="d-flex gap-2">
                                {payment.status === 'Paid' && (
                                    <button 
                                        onClick={() => generateBillPdf(payment, students)} 
                                        className="btn btn-sm btn-outline-success"
                                        title="Download Bill"
                                    >
                                        <ReceiptIcon />
                                    </button>
                                )}
                                <button onClick={() => handleOpenModal(payment)} className="btn btn-sm btn-outline-secondary" title="Edit Payment">
                                    <EditIcon />
                                </button>
                                <button onClick={() => setPaymentToDelete(payment)} className="btn btn-sm btn-outline-danger" title="Delete Payment">
                                    <DeleteIcon />
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </Table>

            {paymentToDelete && (
                <ConfirmationModal
                    title="Delete Payment"
                    message={`Are you sure you want to delete this payment record?`}
                    onConfirm={handleDelete}
                    onCancel={() => setPaymentToDelete(null)}
                />
            )}

            <Modal show={isModalOpen} title={editingPayment ? "Edit Payment" : "Add New Payment"} onClose={handleCloseModal}>
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                    <FormSelect label="Student" name="studentId" value={formState.studentId} onChange={handleInputChange} required>
                        <option value="">Select a student</option>
                        {students.map(student => <option key={student.id} value={student.id}>{student.name}</option>)}
                    </FormSelect>
                    <FormInput label="Amount (₹)" name="amount" type="number" value={formState.amount > 0 ? formState.amount : ''} onChange={handleInputChange} required />
                    <FormInput label="Date" name="date" type="date" value={formState.date} onChange={handleInputChange} required />
                    <div className="row">
                        <div className="col-md-6">
                            <FormSelect label="Payment Method" name="paymentMethod" value={formState.paymentMethod} onChange={handleInputChange} required>
                                <option value="Cash">Cash</option>
                                <option value="Card">Card</option>
                                <option value="Online">Online</option>
                                <option value="UPI">UPI</option>
                                <option value="Other">Other</option>
                            </FormSelect>
                        </div>
                        <div className="col-md-6">
                            <FormSelect label="Status" name="status" value={formState.status} onChange={handleInputChange} required>
                                <option value="Paid">Paid</option>
                                <option value="Pending">Pending</option>
                            </FormSelect>
                        </div>
                    </div>
                    <FormTextArea label="Comments" name="comments" value={formState.comments ?? ''} onChange={handleInputChange} />

                    <div className="d-flex justify-content-end pt-3 mt-3 border-top">
                        <button type="button" onClick={handleCloseModal} className="btn btn-secondary me-2">Cancel</button>
                        <button type="submit" className="btn btn-primary">{editingPayment ? "Save Changes" : "Add Payment"}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default FeesView;