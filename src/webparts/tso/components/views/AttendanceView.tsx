import React, { useState, useMemo, useEffect } from 'react';
import { useMockData } from '../../hooks/useMockData';
import type { Student, Staff } from '../../types';

type ActiveTab = 'students' | 'staff';

const AttendanceView: React.FC<{ data: ReturnType<typeof useMockData> }> = ({ data }) => {
    const { students, staff, attendance, addOrUpdateAttendance } = data;
    
    const [activeTab, setActiveTab] = useState<ActiveTab>('students');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [dailyRecords, setDailyRecords] = useState<Map<string, string>>(new Map());

    const activeStudents = useMemo(() => students.filter(s => s.status === 'Active'), [students]);
    const activeStaff = useMemo(() => staff.filter(s => s.status === 'Active'), [staff]);

    // Effect to load existing attendance records when date or tab changes
    useEffect(() => {
        const personType = activeTab === 'students' ? 'student' : 'staff';
        const existingRecords = attendance.filter((a:any) => a.date === selectedDate && a.personType === personType);
        
        const newRecords = new Map<string, string>();
        existingRecords.forEach((record:any) => {
            newRecords.set(record.personId, record.hoursPresent.toString());
        });

        setDailyRecords(newRecords);
    }, [selectedDate, activeTab, attendance]);

    const handleHoursChange = (personId: string, hours: string) => {
        const newRecords = new Map(dailyRecords);
        newRecords.set(personId, hours);
        setDailyRecords(newRecords);
    };

    const handleSave = () => {
        const personType = activeTab === 'students' ? 'student' : 'staff';
        const recordsToSave = new Map<string, number>();

        dailyRecords.forEach((hoursStr, personId) => {
            const hours = parseFloat(hoursStr);
            if (!isNaN(hours) && hours >= 0) {
                 // We save records with 0 hours too, to allow clearing an entry
                recordsToSave.set(personId, hours);
            }
        });

        addOrUpdateAttendance(selectedDate, personType, recordsToSave);
        alert(`Attendance for ${selectedDate} saved successfully!`);
    };

    const currentList: (Student | Staff)[] = activeTab === 'students' ? activeStudents : activeStaff;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                 <h1 className="h2">Daily Attendance</h1>
            </div>
           
            <div className="card shadow-sm">
                 <div className="card-header">
                    <div className="d-flex justify-content-between align-items-center flex-wrap">
                        <ul className="nav nav-tabs card-header-tabs">
                            <li className="nav-item">
                                <button className={`nav-link ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>Students</button>
                            </li>
                            <li className="nav-item">
                                <button className={`nav-link ${activeTab === 'staff' ? 'active' : ''}`} onClick={() => setActiveTab('staff')}>Staff</button>
                            </li>
                        </ul>
                        <div className="d-flex align-items-center gap-2 mt-2 mt-md-0">
                            <label htmlFor="date-select" className="form-label mb-0 small">Date:</label>
                            <input 
                                id="date-select"
                                type="date" 
                                className="form-control"
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="table table-hover mb-0">
                        <thead>
                            <tr>
                                <th className="p-3" style={{width: '60%'}}>{activeTab === 'students' ? 'Student' : 'Staff'} Name</th>
                                <th className="p-3 text-center">Hours Present</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentList.length > 0 ? currentList.map(person => {
                                const hours = dailyRecords.get(person.id) ?? '';
                                return (
                                    <tr key={person.id} className="align-middle">
                                        <td className="p-3">
                                            <div className="d-flex align-items-center">
                                                <img src={person.imageUrl || `https://ui-avatars.com/api/?name=${person.name.replace(' ', '+')}&background=random`} alt={person.name} className="rounded-circle me-3 object-fit-cover" width="40" height="40" />
                                                <div>
                                                    <div className="fw-semibold">{person.name}</div>
                                                    <div className="small text-body-secondary">{person.email}</div>
                                                </div>
                                           </div>
                                        </td>
                                        <td className="p-3 text-center">
                                            <input
                                                type="number"
                                                className="form-control mx-auto"
                                                style={{maxWidth: '120px'}}
                                                value={hours}
                                                onChange={(e) => handleHoursChange(person.id, e.target.value)}
                                                min="0"
                                                step="0.5"
                                                placeholder="e.g., 8"
                                            />
                                        </td>
                                    </tr>
                                )
                            }) : (
                                <tr>
                                    <td colSpan={2} className="text-center p-4 text-body-secondary">
                                        No active {activeTab} found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {currentList.length > 0 && (
                    <div className="card-footer text-end">
                        <button className="btn btn-primary" onClick={handleSave}>
                            Save Attendance
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttendanceView;
