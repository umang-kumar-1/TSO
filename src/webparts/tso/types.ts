
export interface Student {
  batchIds: string[];  
  id: string;
  name: string;
  email: string;
  phone: string;
  courseIds: string[];
  admissionDate?: string;
  imageUrl?: string;
  address?: string;
  gender: 'Male' | 'Female' | 'Other';
  status: 'Active' | 'Discontinued';
  batchNames?: string[]; 
  imageFile: null 
}


export interface Trainer {
  id: string;
  name: string;
  email: string;
  expertise: string[]; // Array of course IDs
  imageUrl?: string;
  phone?: string;
  address?: string;
  gender: 'Male' | 'Female' | 'Other';
}

export interface Course {
  id: string;
  name: string;
  category: 'Spoken English' | 'Computer';
  level: 'Basic' | 'Advanced';
  duration: string; // e.g., "3 Months"
  totalFee: number;
}
export interface Batch {
  id: string;
  name: string;
  courseId: string;
  staffId: string; // Trainer ID
  weekdays: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun')[];
  time: string; // e.g., "08:00 - 10:00"
  startDate: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed';
}

export interface Lead {
    id: string;
    name: string;
    email: string;
    phone: string;
    interestedCourseId: string;
    source: 'Walk-in' | 'Website' | 'Referral' | 'Social Media' | 'Other';
    status: 'New' | 'Contacted' | 'Follow-up' | 'Converted' | 'Lost';
    enquiryDate: string;
    nextFollowUpDate?: string;
    assignedTo?: string; // staffId
    comments?: any[]; // Array of comment objects { id, authorId, text, date
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: 'Trainer' | 'Counsellor' | 'Front Desk' | 'Sales' | 'Other';
  expertise?: string[]; // Array of course IDs, mainly for trainers
  imageUrl?: string;
  phone?: string;
  address?: string;
  gender: 'Male' | 'Female' | 'Other';
  about?: string;
  status: 'Active' | 'Discontinued';
  joiningDate: string;
  employmentType: 'Full-time' | 'Part-time' | 'Contract';
  salary: number;
  salaryType: 'Monthly' | 'Hourly';
  imageFile: null;
}

export interface FeePayment {
  id: string;
  studentId: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Pending';
  paymentMethod: 'Cash' | 'Card' | 'Online' | 'Other';
  comments?: string;
}

export interface Expense {
  id: string;
  description: string;
  category: 'Salary' | 'Utilities' | 'Marketing' | 'Rent' | 'Other';
  amount: number;
  date: string;
  billUrl?: string;
  comments?: string;
  staffId?: string; 
  expenseFile: null
}

export interface Assignment {
  id:string;
  title: string;
  courseId: string;
  studentId: string;
  dueDate: string;
  status: 'Pending' | 'Submitted';
  assignmentFileUrl?: string;
  staffId?: string;
  assignmentFile: null,
}
export interface AttendanceRecord {
    id: string;
    personId: string; // studentId or staffId
    personType: 'student' | 'staff';
    date: string; // YYYY-MM-DD
    hoursPresent: number;
}