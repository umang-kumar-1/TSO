import { useEffect, useState } from "react";
import type { Student, Course, Staff, Batch, Lead, AttendanceRecord } from "../types";
import { web } from "../PnpUrl";
import { Web } from "sp-pnp-js";

const today = new Date();
const pastDate = new Date();
pastDate.setDate(today.getDate() - 15);
const futureDate = new Date();
futureDate.setDate(today.getDate() + 15);
const veryFutureDate = new Date();
veryFutureDate.setDate(today.getDate() + 45); // For testing upcoming payments > 30 days

export const useMockData = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [feePayments, setFeePayments] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [expenses, setExpenseData] = useState<any[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

    const createNewId = () => crypto.randomUUID();

  const generateUniqueId = (prefix: string, items: { id: string }[]) => {
    const fullPrefix = `TSO-${prefix}-`;
    if (!items.length) {
      return `${fullPrefix}001`;
    }
    const maxIdNum = items
      .map((s) => parseInt(s.id.replace(fullPrefix, ""), 10))
      .filter((num) => !isNaN(num))
      .reduce((max, current) => Math.max(max, current), 0);

    const nextIdNum = maxIdNum + 1;
    return `${fullPrefix}${String(nextIdNum).padStart(3, "0")}`;
  };

  //upload
  const uploadAttachment = async (
    listId: string,
    file: File,
    itemId: number
  ) => {
    const list = web.lists.getById(listId);

    // Delete old attachments first (to overwrite)
    const existingAttachments = await list.items
      .getById(itemId)
      .attachmentFiles.get();
    for (const f of existingAttachments) {
      await list.items
        .getById(itemId)
        .attachmentFiles.getByName(f.FileName)
        .delete();
    }

    // Add new attachment with the provided file name
    const buffer = await file.arrayBuffer();
    const uploaded = await list.items
      .getById(itemId)
      .attachmentFiles.add(file.name, buffer);
    return `${window.location.origin}${uploaded.data.ServerRelativeUrl}`;
  };

  // Batches model

  const batcheListId = "3d055690-e98b-4ebf-899f-7b4ab3b09816";
  const fetchBatches = async (): Promise<any> => {
    try {
      const res = await web.lists
        .getById(batcheListId)
        .items.select(
          "Id,name,courseId/Id,courseId/Title,staffId/Id,staffId/Title,weekdays,time,startDate,status"
        )
        .expand("courseId,staffId")
        .getAll();

      const mappedBatches = res.map((item: any) => ({
        id: item.Id.toString(),
        name: item.name,
        courseId: item.courseId ? item.courseId.Id.toString() : "",
        staffId: item.staffId ? item.staffId.Id.toString() : "",
        weekdays: item.weekdays,
        time: item.time,
        startDate: item.startDate.substring(0, 10),
        status: item.status,
      }));
      setBatches(mappedBatches);
    } catch (error) {
      console.error("Error fetching batches:", error);
    }
  };
  useEffect(() => {
    fetchBatches();
  }, []);

  const addBatch = async (data: Omit<Batch, "id">): Promise<void> => {
    try {
      await web.lists.getById(batcheListId).items.add({
        Title: data.name,
        name: data.name,
        courseIdId: parseInt(data.courseId),
        staffIdId: parseInt(data.staffId),
        weekdays: data.weekdays ? { results: data.weekdays } : { results: [] },
        time: data.time,
        startDate: data.startDate,
        status: data.status,
      });
    } catch (error) {
      console.error("Error adding batch:", error);
    }
    await fetchBatches();
  };

  const updateBatch = async (updatedBatch: Batch): Promise<any> => {
    try {
      await web.lists
        .getById(batcheListId)
        .items.getById(parseInt(updatedBatch.id))
        .update({
          Title: updatedBatch.name,
          name: updatedBatch.name,
          courseIdId: parseInt(updatedBatch.courseId),
          staffIdId: parseInt(updatedBatch.staffId),
          weekdays: updatedBatch.weekdays
            ? { results: updatedBatch.weekdays }
            : { results: [] },
          time: updatedBatch.time,
          startDate: updatedBatch.startDate,
          status: updatedBatch.status,
        });
    } catch (error) {
      console.error("Error updating batch:", error);
    }
    await fetchBatches();
  };
  const deleteBatch = async (batchId: string): Promise<any> => {
    try {
      await web.lists
        .getById(batcheListId)
        .items.getById(parseInt(batchId))
        .delete();
    } catch (error) {
      console.error("Error deleting batch:", error);
    }
    await fetchBatches();
  };

  // fetch staff added
  const fetchStaff = async (): Promise<any> => {
    try {
      const res = await web.lists
        .getById("5ec85e68-1f9d-4416-8547-307a432dd9ef")
        .items.select(
          "Id,Title,staffId,name,email,role,expertise/Id,expertise/Title,phone,address,gender,status,about,joiningDate,employmentType,salary,salaryType,Attachments,AttachmentFiles"
        )
        .expand("expertise,AttachmentFiles")
        .get();

      const mappedStaff: Staff[] = res.map((item: any) => {
        const attachments =
          item.AttachmentFiles && item.AttachmentFiles.length > 0
            ? item.AttachmentFiles.map((att: any) => ({
                fileName: att.FileName,
                serverRelativeUrl: att.ServerRelativeUrl,
                url: `${window.location.origin}${att.ServerRelativeUrl}`,
              }))
            : [];

        const imageUrl =
          attachments.length > 0
            ? attachments[0].url
            : `https://i.pravatar.cc/150?u=staff${item.Id}`;

        return {
          id: item.Id.toString(),
          staffId: item.staffId,
          title: item.Title,
          name: item.name,
          email: item.email,
          role: item.role,
          expertise: item.expertise
            ? item.expertise.map((ex: any) => ex.Id.toString())
            : [],
          phone: item.phone,
          address: item.address,
          gender: item.gender,
          status: item.status,
          about: item.about,
          joiningDate: item.joiningDate.substring(0, 10),
          employmentType: item.employmentType,
          salary: item.salary,
          salaryType: item.salaryType,
          imageUrl,
          attachments,
        };
      });
      setStaff(mappedStaff);
    } catch (error) {
      console.error("Error fetching staff:", error);
    }
  };

  const addStaff = async (data: Omit<Staff, "id">): Promise<any> => {
    try {
      const listId = "5ec85e68-1f9d-4416-8547-307a432dd9ef";
      const res = await web.lists.getById(listId).items.add({
        Title: data.name,
        staffId: generateUniqueId("STF", staff),
        name: data.name,
        email: data.email,
        role: data.role,
        expertiseId: Array.isArray(data.expertise)
          ? { results: data.expertise.map(Number) }
          : { results: [] },
        phone: data.phone,
        address: data.address,
        gender: data.gender,
        status: data.status,
        about: data.about,
        joiningDate: data.joiningDate,
        employmentType: data.employmentType,
        salary: Number(data.salary) || 0,
        salaryType: data.salaryType,
      });

      const file: File | undefined = (data as any).imageFile;
      if (file) {
        await uploadAttachment(listId, file, res.data.Id);
      }

      await fetchStaff();
    } catch (error) {
      console.error("Error adding staff:", error);
    }
  };

  const updateStaff = async (updatedStaff: Staff): Promise<any> => {
    const listId = "5ec85e68-1f9d-4416-8547-307a432dd9ef";
    const mappedStaff = {
      Title: updatedStaff.name,
      name: updatedStaff.name,
      email: updatedStaff.email,
      role: updatedStaff.role,
      expertiseId: Array.isArray(updatedStaff.expertise)
        ? { results: updatedStaff.expertise.map(Number) }
        : { results: [] },
      phone: updatedStaff.phone,
      address: updatedStaff.address,
      gender: updatedStaff.gender,
      status: updatedStaff.status,
      about: updatedStaff.about,
      joiningDate: updatedStaff.joiningDate,
      employmentType: updatedStaff.employmentType,
      salary: Number(updatedStaff.salary) || 0,
      salaryType: updatedStaff.salaryType,
    };
    await web.lists
      .getById(listId)
      .items.getById(parseInt(updatedStaff.id))
      .update(mappedStaff);
    const file: File | undefined = (updatedStaff as any).imageFile;
    if (file) {
      await uploadAttachment(listId, file, parseInt(updatedStaff.id));
    }
    await fetchStaff();
  };

  const deleteStaff = async (staffId: string): Promise<any> => {
    try {
      await web.lists
        .getById("5ec85e68-1f9d-4416-8547-307a432dd9ef")
        .items.getById(parseInt(staffId))
        .delete();
    } catch (error) {
      console.error("Error deleting staff:", error);
    }
    await fetchStaff();
  };


  const fetchExpenses = async () => {
    try {
      const res = await web.lists
        .getById("7dc4e19a-3157-4093-9672-6e28e73434b2")
        .items.select(
          "Id,Title,Description,Category,Amount,Date,Comments,Attachments"
        )
        .expand("AttachmentFiles") // ensures attachment files are fetched
        .getAll();

      const mappedExpenses = res.map( (item: any) => {
          const attachments =
          item.AttachmentFiles && item.AttachmentFiles.length > 0
            ? item.AttachmentFiles.map((att: any) => ({
                fileName: att.FileName,
                serverRelativeUrl: att.ServerRelativeUrl,
                url: `${window.location.origin}${att.ServerRelativeUrl}`,
              }))
            : [];

        const billUrl =
          attachments.length > 0
            ? attachments[0].url
            : `https://i.pravatar.cc/150?u=staff${item.Id}`;

          return {
            id: (item.Id).toString(),
            title: item.Title,
            description: item.Description || item.Title,
            category: item.Category,
            amount: item.Amount,
            date: new Date(item.Date).toISOString().split("T")[0],
            comments: item.Comments,
            billUrl,
            attachments,
          };
        })
      setExpenseData(mappedExpenses);
    } catch (error: any) {
      console.error("Error fetching expenses:", error);
    }
  };

  const addExpense = async (item: any) => {
    const listId = "7dc4e19a-3157-4093-9672-6e28e73434b2";
    try {
      const newItem = {
        Title: item.description,
        Description: item.description,
        Category: item.category,
        Amount: Number(item.amount),
        Date: new Date(item.date).toISOString().split("T")[0],
        Comments: item.comments,
      };

      const res = await web.lists
        .getById("7dc4e19a-3157-4093-9672-6e28e73434b2")
        .items.add(newItem);

      if (item.expenseFile && item.expenseFile instanceof File) {
        await uploadAttachment(listId, item.expenseFile, res.data.Id);
      }

      await fetchExpenses();
    } catch (err: any) {
      console.error("Error adding expense:", err);
    }
  };

  const updateExpense = async (item: any) => {
    const listId = "7dc4e19a-3157-4093-9672-6e28e73434b2";
    try {
      const updateData = {
        Title: item.description,
        Description: item.description,
        Category: item.category,
        Amount: Number(item.amount),
        Date: new Date(item.date).toISOString().split("T")[0],
        Comments: item.comments,
      };

      await web.lists
        .getById("7dc4e19a-3157-4093-9672-6e28e73434b2")
        .items.getById(item.id)
        .update(updateData);

      if (item.expenseFile && item.expenseFile instanceof File) {
        await uploadAttachment(listId, item.expenseFile, item.id);
      }

      await fetchExpenses();
    } catch (err: any) {
      console.error("Error updating expense:", err);
    }
  };

  const deleteExpense = async (item: any) => {
    try {
      await web.lists
        .getById("7dc4e19a-3157-4093-9672-6e28e73434b2")
        .items.getById(item)
        .delete();

      setExpenseData((prev) => prev.filter((e) => e.id !== item));
    } catch (err: any) {
      console.error("Error deleting expense:", err);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchStaff();
    fetchLeads();
  }, []);

  // assignment

  // 🔹 CREATE
  const addAssignment = async (assignment: any) => {
    try {
      const listId = "1d5452dc-7b1d-430b-b316-0680492ffd48";
      const addRes = await web.lists.getById(listId).items.add({
        Title: assignment.title,
        CourseId: assignment.courseId ? parseInt(assignment.courseId) : null,
        StudentId: assignment.studentId ? parseInt(assignment.studentId) : null,
        TrainerId: assignment.staffId ? parseInt(assignment.staffId) : null,
        DueDate: assignment.dueDate,
        Status: assignment.status || "Pending",
      });

      // // 2️⃣ Upload file as attachment if present
      // if (assignment.assignmentFile) {
      //   await uploadAttachment(
      //     listId,
      //     assignment.assignmentFile,
      //     addRes.data.Id
      //   );
      // }

      const file: File | undefined = (assignment as any).assignmentFile;
      if (file) {
        await uploadAttachment(listId, file, addRes.data.Id);
      }

      await getAssignments();
    } catch (err) {
      console.error("Error adding assignment:", err);
    }
  };

  // 🔹 READ
  const getAssignments = async () => {
    try {
      const listId = "1d5452dc-7b1d-430b-b316-0680492ffd48";
      const items = await web.lists
        .getById(listId)
        .items.select(
          "Id,Title,Course/Id,Course/Title,Student/Id,Student/Title,Trainer/Id,Trainer/Title,DueDate,Status,Attachments"
        )
        .expand("Course,Student,Trainer")
        .getAll();

      const mappedData = await Promise.all(
        items.map(async (item: any) => {
          // Get attachments
          const attachments = item.Attachments
            ? await web.lists
                .getById(listId)
                .items.getById(item.Id)
                .attachmentFiles.get()
            : [];

          return {
            id: item.Id.toString(),
            title: item.Title,
            courseId: item.Course?.Id?.toString() || "",
            studentId: item.Student?.Id?.toString() || "",
            staffId: item.Trainer?.Id?.toString() || "",
            dueDate: item.DueDate.substring(0, 10) || "",
            status: item.Status || "Pending",
            attachmentFiles: attachments, // array of attachments
            assignmentFileUrl:
              attachments.length > 0
                ? `${window.location.origin}${attachments[0].ServerRelativeUrl}`
                : "",
          };
        })
      );
      setAssignments(mappedData);
    } catch (err) {
      console.error("Error fetching assignments:", err);
      throw err;
    }
  };

  // 🔹 UPDATE
  const updateAssignment = async (assignment: any) => {
    try {
      const listId = "1d5452dc-7b1d-430b-b316-0680492ffd48";

      // Update item fields first
      await web.lists
        .getById(listId)
        .items.getById(parseInt(assignment.id))
        .update({
          Title: assignment.title,
          CourseId: assignment.courseId ? parseInt(assignment.courseId) : null,
          StudentId: assignment.studentId
            ? parseInt(assignment.studentId)
            : null,
          TrainerId: assignment.staffId ? parseInt(assignment.staffId) : null,
          DueDate: assignment.dueDate,
          Status: assignment.status || "Pending",
        });

      // Upload new attachment if provided (overwrites old)
      if (assignment.assignmentFile) {
        await uploadAttachment(
          listId,
          assignment.assignmentFile,
          parseInt(assignment.id)
        );
      }

      await getAssignments();
    } catch (err) {
      console.error("Error updating assignment:", err);
      throw err;
    }
  };

  // 🔹 DELETE
  const deleteAssignment = async (id: string) => {
    try {
      const listId = "1d5452dc-7b1d-430b-b316-0680492ffd48";
      await web.lists.getById(listId).items.getById(parseInt(id)).delete();
      await getAssignments();
    } catch (err) {
      console.error("Error deleting assignment:", err);
      throw err;
    }
  };

  // 🔹 Call getAssignments on mount
  useEffect(() => {
    getAssignments();
  }, []);

  // payment module

  // Fetch fee payments with student lookup
  const fetchFeePayments = async () => {
    try {
      const items = await web.lists
        .getById("29c80eac-d776-4043-819a-dab43a982585")
        .items.select(
          "Id,Title,Student/ID,Student/Title,Amount,Date,Status,PaymentMethod,comments"
        )
        .expand("Student")
        .getAll();

      const mapped = items.map((item: any) => ({
        id: item.Id.toString(),
        studentId: item.Student.ID.toString() || "",
        amount: Number(item.Amount),
        date: item.Date ? item.Date.split("T")[0] : "",
        status: item.Status,
        paymentMethod: item.PaymentMethod,
        studentName: item.StudentId?.Title || "",
        comments: item.comments || "",
      }));
      setFeePayments(mapped);
    } catch (err) {
      console.error("Error fetching fee payments:", err);
    }
  };

  useEffect(() => {
    fetchFeePayments();
  }, []);

  // Add Fee Payment
  const addFeePayment = async (data: any) => {
    try {
      await web.lists
        .getById("29c80eac-d776-4043-819a-dab43a982585")
        .items.add({
          Title: "Fee Payment",
          StudentId: parseInt(data.studentId),
          Amount: data.amount,
          Date: data.date,
          Status: data.status,
          PaymentMethod: data.paymentMethod,
          comments: data.comments || "",
        });
      await fetchFeePayments();
    } catch (err) {
      console.error("Error adding fee payment:", err);
    }
  };

  // Update Fee Payment
  const updateFeePayment = async (updatedPayment: any) => {
    try {
      await web.lists
        .getById("29c80eac-d776-4043-819a-dab43a982585")
        .items.getById(parseInt(updatedPayment.id))
        .update({
          StudentId: parseInt(updatedPayment.studentId),
          Amount: updatedPayment.amount,
          Date: updatedPayment.date,
          Status: updatedPayment.status,
          PaymentMethod: updatedPayment.paymentMethod,
          comments: updatedPayment.comments,
        });

      await fetchFeePayments();
    } catch (err) {
      console.error("Error updating fee payment:", err);
    }
  };

  // Delete Fee Payment
  const deleteFeePayment = async (paymentId: string) => {
    try {
      await web.lists
        .getById("29c80eac-d776-4043-819a-dab43a982585")
        .items.getById(parseInt(paymentId))
        .delete();
      setFeePayments((prev) => prev.filter((p) => p.id !== paymentId));
    } catch (err) {
      console.error("Error deleting fee payment:", err);
    }
  };

  /// gajendra  data

  const sanitizeUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    if (url.startsWith("https//")) return url.replace("https//", "https://");
    return `${window.location.origin}${url}`;
  };

  const fetchCourses = async (): Promise<void> => {
    try {
      const web = new Web("https://smalsusinfolabs.sharepoint.com/sites/TSO");
      const res = await web.lists
        .getById("023e9425-6982-4e89-87d9-b1dd8534bf96")
        .items.getAll();
      const mappedCourses: Course[] = res.map((item) => ({
        id: String(item.Id),
        name: item.Title,
        category: item.category || "",
        level: item.level || "",
        duration: item.duration || "",
        totalFee: item.totalFee || 0,
      }));
      setCourses(mappedCourses);
    } catch (error) {
      console.error("fetchCourses error ::", error);
    }
  };

  const fetchAPIStudent = async (): Promise<Student[]> => {
    try {
      const web = new Web("https://smalsusinfolabs.sharepoint.com/sites/TSO");

      const res = await web.lists
        .getById("25a7c502-9910-498e-898b-a0b37888a15e")
        .items.select(
          "Id",
          "Title",
          "emailAddress",
          "phoneNumber",
          "gender",
          "address",
          "status",
          "joinDate",
          "courses/Id",
          "courses/Title",
          "batches/Id",
          "admissionDate",
          "studentId"
        )
        .expand("courses", "batches")
        .getAll();
      // 🧠 map function ko async banaya hai
      const mappedStudents: any = await Promise.all(
        res.map(async (item) => {
          let imageUrl = "";
          try {
            // Fetch attachment files for this item
            const attachments = await web.lists
              .getById("25a7c502-9910-498e-898b-a0b37888a15e")
              .items.getById(item.Id)
              .attachmentFiles.get();

            if (attachments && attachments.length > 0) {
              imageUrl = sanitizeUrl(
                attachments[0].ServerRelativeUrl ||
                  attachments[0].ServerRelativePath ||
                  ""
              );
            } else {
              imageUrl = `https://i.pravatar.cc/150?u=student${item.Id}`;
            }
          } catch (err) {
            console.warn("Could not fetch attachments for item", item.Id, err);
            imageUrl = `https://i.pravatar.cc/150?u=student${item.Id}`;
          }

          return {
            id: String(item.Id),
            name: item.Title || "",
            email: item.emailAddress || "",
            phone: String(item.phoneNumber || ""),
            gender: item.gender || "",
            address: item.address || "",
            status: item.status || "Active",
            // joinDate: item.joinDate ? new Date(item.joinDate).toISOString().split("T")[0] : "",
            admissionDate: item.admissionDate
              ? new Date(item.admissionDate).toISOString().split("T")[0]
              : "",
            imageUrl,
            courseIds: item.courses
              ? item.courses.map((c: { Id: number }) => String(c.Id))
              : [],
            courseNames: item.courses
              ? item.courses.map((c: { Title: string }) => c.Title)
              : [],
            batchIds: item.batches
              ? item.batches.map((b: { Id: number }) => String(b.Id))
              : [],
            studentId: item.studentId || "",
          };
        })
      );
      setStudents(mappedStudents);
      return mappedStudents;
    } catch (error) {
      console.error("fetchStudents error ::", error);
      return [];
    }
  };

  useEffect(() => {
    fetchCourses().catch(console.error);
    fetchAPIStudent().catch(console.error);
  }, []);

  const addStudent = async (
    data: any & { imageFile?: File; imageUrl?: string }
  ): Promise<any> => {
    try {
      const web = new Web("https://smalsusinfolabs.sharepoint.com/sites/TSO");

      const studentData: any = {
        Title: data.name,
        emailAddress: data.email,
        phoneNumber: data.phone,
        gender: data.gender,
        address: data.address,
        status: data.status || "Active",
        // joinDate: data.joinDate || new Date().toISOString().split("T")[0],
        coursesId: {
          results: data.courseIds?.map((id: any) => Number(id)) || [],
        },
        studentId: generateUniqueId("STU", students),
        admissionDate:
          data.admissionDate || new Date().toISOString().split("T")[0],
        batchesId: {
          results: data.batchIds?.map((id: any) => Number(id)) || [],
        },
      };

      const result = await web.lists
        .getById("25a7c502-9910-498e-898b-a0b37888a15e")
        .items.add(studentData);

      if (data.expenseFile && data.expenseFile instanceof File) {
        await uploadAttachment("25a7c502-9910-498e-898b-a0b37888a15e", data.expenseFile, result.data.Id);
      }
      await fetchAPIStudent();

      return { success: true, data: result };
    } catch (error) {
      console.error("addStudent (attachments) error ::", error);
      return { success: false, error: error };
    }
  };
  const updateStudent = async (
    updatedStudent: any & { imageFile?: File; imageUrl?: string }
  ): Promise<{ success: boolean; error?: unknown }> => {
    try {
      const web = new Web("https://smalsusinfolabs.sharepoint.com/sites/TSO");

      const updateData: any = {
        Title: updatedStudent.name,
        emailAddress: updatedStudent.email,
        phoneNumber: updatedStudent.phone,
        gender: updatedStudent.gender,
        address: updatedStudent.address,
        status: updatedStudent.status,
        // joinDate: updatedStudent.joinDate,
        coursesId: {
          results: updatedStudent.courseIds?.map((id: any) => Number(id)) || [],
        },
        admissionDate: updatedStudent.admissionDate,
        batchesId: {
          results: updatedStudent.batchIds?.map((id: any) => Number(id)) || [],
        },
      };

      // 1) Update list item fields (no attachment yet)
      await web.lists
        .getById("25a7c502-9910-498e-898b-a0b37888a15e")
        .items.getById(Number(updatedStudent.id))
        .update(updateData);

      const file: File | undefined = (updatedStudent as any).imageFile;
      if (file) {
        await uploadAttachment(
          "25a7c502-9910-498e-898b-a0b37888a15e",
          file,
          parseInt(updatedStudent.id)
        );
      }

      // Refresh local data after update
      await fetchAPIStudent();

      return { success: true };
    } catch (error) {
      return { success: false, error: error };
    }
  };

  const deleteStudent = async (
    studentId: string
  ): Promise<{ success: boolean; error?: unknown }> => {
    try {
      const web = new Web("https://smalsusinfolabs.sharepoint.com/sites/TSO");

      await web.lists
        .getById("25a7c502-9910-498e-898b-a0b37888a15e")
        .items.getById(Number(studentId))
        .delete();

      await fetchAPIStudent();

      return { success: true };
    } catch (error) {
      console.error("deleteStudent error ::", error);
      return { success: false, error: error };
    }
  };

  const addCourse = async (data: Omit<Course, "id">): Promise<void> => {
    try {
      const web = new Web("https://smalsusinfolabs.sharepoint.com/sites/TSO");

      const res = await web.lists
        .getById("023e9425-6982-4e89-87d9-b1dd8534bf96")
        .items.add({
          Title: data.name,
          category: data.category,
          level: data.level,
          duration: data.duration,
          totalFee: data.totalFee,
        });

      // State update karne ke liye new object banao
      const newCourse: Course = {
        id: String(res.data.Id),
        name: data.name,
        category: data.category,
        level: data.level,
        duration: data.duration,
        totalFee: data.totalFee,
      };

      setCourses((prev) => [...prev, newCourse]);
    } catch (error) {
      console.error("addCourse error ::", error);
    }
  };

  const updateCourse = async (updatedCourse: Course): Promise<void> => {
    try {
      const web = new Web("https://smalsusinfolabs.sharepoint.com/sites/TSO");
      const list = web.lists.getById("023e9425-6982-4e89-87d9-b1dd8534bf96");
      await list.items.getById(Number(updatedCourse.id)).update({
        Title: updatedCourse.name, // Title column update
        category: updatedCourse.category,
        level: updatedCourse.level,
        duration: updatedCourse.duration,
        totalFee: updatedCourse.totalFee,
      });
      setCourses((prev) =>
        prev.map((c) => (c.id === updatedCourse.id ? updatedCourse : c))
      );
    } catch (error) {
      console.error("updateCourse error ::", error);
    }
  };

  const deleteCourse = async (courseId: string): Promise<void> => {
    try {
      const web = new Web("https://smalsusinfolabs.sharepoint.com/sites/TSO");

      await web.lists
        .getById("023e9425-6982-4e89-87d9-b1dd8534bf96")
        .items.getById(Number(courseId))
        .delete();

      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    } catch (error) {
      console.error("deleteCourse error ::", error);
    }
  };
  function sortByDateDesc(arr:any, key:any) {
    return [...arr].sort((a, b) => {
      const dateA = new Date(a[key]).getTime();
      const dateB = new Date(b[key]).getTime();
      return dateB - dateA; // descending (newest first)
    });
  }
  const fetchLeads = async (): Promise<void> => {
    try {
      const web = new Web("https://smalsusinfolabs.sharepoint.com/sites/TSO");

      const res = await web.lists
        .getById("8359e17b-d79e-465d-92c4-2e746ca8a99a")
        .items.select(
          "Id,Title,email,phone,interestedCourse/Id,source,status,enquiryDate,nextFollowup,assignedTo/Id,assignedTo/Title,comments"
        )
        .expand("assignedTo", "interestedCourse")
        .getAll();


      const mappedLeads: Lead[] = res.map((item: any) => {
        const lead = {
          id: item.Id.toString(),
          name: item.Title,
          email: item.email || "",
          phone: item.phone || "",
          interestedCourseId: String(item.interestedCourse?.Id) || "", //interestedCourseId
          source: item.source || "",
          status:
            item.status === "Follow-Up"
              ? "Follow-up"
              : item.status === "Not Interested"
              ? "Lost"
              : item.status,
          comments: item.comments ? JSON.parse(item.comments) : [], // comment column is multi line of text with JSON data
          enquiryDate: item.enquiryDate
            ? item.enquiryDate.substring(0, 10)
            : "",
          nextFollowUpDate: item.nextFollowup // ✅ Correct internal name
            ? item.nextFollowup.substring(0, 10)
            : "",
          assignedTo: item.assignedTo ? String(item.assignedTo.Id) : "", // ✅ Lookup ID
          assignedToName: item.assignedTo ? item.assignedTo.Title : "", // Display name
        };
        return lead;
      });

      setLeads(sortByDateDesc(mappedLeads, "enquiryDate"));
    } catch (error) {
      console.error("Error fetching leads:", error);
    }
  };

  const addLead = async (newLead: any): Promise<void> => {
    try {
      const web = new Web("https://smalsusinfolabs.sharepoint.com/sites/TSO");

      // Add item to SharePoint list
      await web.lists
        .getById("8359e17b-d79e-465d-92c4-2e746ca8a99a")
        .items.add({
          Title: newLead.name, // Title field
          email: newLead.email, // Email
          phone: newLead.phone, // Phone
          source: newLead.source, // Source
          status: newLead.status, // Status
          enquiryDate: newLead.enquiryDate || new Date().toISOString().split("T")[0], // Enquiry Date
          nextFollowup: newLead.nextFollowUpDate || new Date().toISOString().split("T")[0], // Next Followup Date (correct internal name)
          assignedToId: parseInt(newLead.assignedTo), // ✅ Lookup ID for assignedTo
          interestedCourseId: parseInt(newLead.interestedCourseId), // Lookup ID for Course
          comments: Array.isArray(newLead.comments)
            ? JSON.stringify(newLead.comments)
            : newLead.comments || "", // Optional comments
        });

      await fetchLeads(); // refresh list
    } catch (error) {
      console.error("❌ Error adding lead:", error);
    }
  };

  const updateLead = async (updatedLead: any): Promise<void> => {
    try {
      const web = new Web("https://smalsusinfolabs.sharepoint.com/sites/TSO");

      await web.lists
        .getById("8359e17b-d79e-465d-92c4-2e746ca8a99a")
        .items.getById(parseInt(updatedLead.id))
        .update({
          Title: updatedLead.name,
          email: updatedLead.email,
          phone: updatedLead.phone,
          source: updatedLead.source,
          status: updatedLead.status,
          enquiryDate: updatedLead.enquiryDate,
          nextFollowup: updatedLead.nextFollowUpDate,
          assignedToId: parseInt(updatedLead.assignedTo), // Lookup ID
          interestedCourseId: parseInt(updatedLead.interestedCourseId), // Lookup ID
          comments: JSON.stringify(updatedLead.comments || []),
        });

      // Refresh leads
      await fetchLeads();
    } catch (error) {
      console.error("❌ Error updating lead:", error);
    }
  };

  const deleteLead = async (leadId: string): Promise<void> => {
    try {
      const web = new Web("https://smalsusinfolabs.sharepoint.com/sites/TSO");

      await web.lists
        .getById("8359e17b-d79e-465d-92c4-2e746ca8a99a")
        .items.getById(parseInt(leadId))
        .delete();

      // Refresh leads
      await fetchLeads();
    } catch (error) {
      console.error("❌ Error deleting lead:", error);
    }
  };

  const createId = (prefix: string) => `${prefix}${Date.now()}`;
  const addCommentToLead = async (leadId: string, commentData: any) => {
    try {
      const newComment = {
        id: createId("com"),
        text: commentData.text,
        authorId: commentData.authorId,
        timestamp: new Date().toISOString(),
      };

      // 🔹 Find current lead in state
      const currentLead = leads.find((l: any) => l.id === leadId);

      // 🔹 Ensure comments is an array (handle string or empty)
      let existingComments: any[] = [];
      if (typeof currentLead?.comments === "string") {
        try {
          existingComments = JSON.parse(currentLead.comments);
        } catch {
          existingComments = [];
        }
      } else if (Array.isArray(currentLead?.comments)) {
        existingComments = currentLead.comments;
      }

      // 🔹 Append new comment
      const updatedComments = [...existingComments, newComment];

      // 🔹 Update SharePoint (multi-line text column)
      await web.lists
        .getById("8359e17b-d79e-465d-92c4-2e746ca8a99a")
        .items.getById(Number(leadId))
        .update({
          comments: JSON.stringify(updatedComments),
        });

      // 🔹 Update local React state
      setLeads((prev: any[]) =>
        prev.map((lead) =>
          lead.id === leadId ? { ...lead, comments: updatedComments } : lead
        )
      );
    } catch (error) {
      console.error("❌ Error adding comment:", error);
    }
  };

  // attendance
    const addOrUpdateAttendance = (date: string, personType: 'student' | 'staff', dailyRecords: Map<string, number>) => {
        setAttendance(prev => {
            // Filter out any existing records for the given date and person type, as they will be replaced.
            const otherAttendance = prev.filter(a => !(a.date === date && a.personType === personType));

            const newOrUpdatedRecordsForDay: AttendanceRecord[] = [];
            dailyRecords.forEach((hours, personId) => {
                // We only store records where hours are greater than 0
                if (hours > 0) {
                    const existingRecord = prev.find(a => a.date === date && a.personType === personType && a.personId === personId);
                    if (existingRecord) {
                        // Update existing record
                        ;(
                          async () =>{
                          await web.lists.getById("beeb8dc5-4b55-461b-9bf5-e2b8e172f7d1")
                          .items.getById(parseInt(existingRecord.personId))
                          .update
                        })()
                        newOrUpdatedRecordsForDay.push({ ...existingRecord, hoursPresent: hours });
                    } else {
                      ;(
                          async () =>{
                          await web.lists.getById("beeb8dc5-4b55-461b-9bf5-e2b8e172f7d1")
                          .items.add({
                            Title: "Attendance",
                            personId: personId,
                            personType: personType,
                            date: new Date(date).toISOString().split("T")[0],
                            hoursPresent: Number(hours),
                          });
                        }
                      )()
                        // Create new record
                        newOrUpdatedRecordsForDay.push({
                            id: createNewId(),
                            personId,
                            personType,
                            date,
                            hoursPresent: hours,
                        });
                    }
                }
            });

            return [...otherAttendance, ...newOrUpdatedRecordsForDay];
        });
    };

    const prevAttendance = async () => {
        const res = await web.lists
          .getById("beeb8dc5-4b55-461b-9bf5-e2b8e172f7d1") 
          .items.getAll();
        const mappedAttendance: AttendanceRecord[] = res.map((item: any) => ({
          id: String(item.Id),
          personId: String(item.personId),
          personType: item.personType,
          date: item.date.substring(0,10),
          hoursPresent: Number(item.hoursPresent),
        }));
        return mappedAttendance;  
      }

      useEffect(() => {
        const fetchData = async () => {
          const data = await prevAttendance();
          setAttendance(data);
        };
        fetchData();
      }, []);
  return {
    getAssignments,
    expenses,
    staff,
    batches,
    leads,
    addStaff,
    updateStaff,
    deleteStaff,
    addLead,
    updateLead,
    addCommentToLead,
    deleteLead,
    addBatch,
    updateBatch,
    deleteBatch,
    addExpense,
    updateExpense,
    deleteExpense,
    courses,
    students,
    feePayments,
    assignments,
    addStudent,
    updateStudent,
    deleteStudent,
    addCourse,
    updateCourse,
    deleteCourse,
    addFeePayment,
    updateFeePayment,
    deleteFeePayment,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    attendance, 
    addOrUpdateAttendance
  };
};
