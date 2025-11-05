import axios from 'axios';

interface StudentPayload {
  studentId: string;
  name: string;
  parentPhone: string;
  embedding: number[];
  classId?: string;
}

export const enrollStudent = async (
  apiBase: string,
  payload: StudentPayload
) => {
  // ensure it always uses the full URL passed from App.tsx
  return axios.post(`${apiBase}/students/enroll`, payload);
};

export const fetchClassStudents = async (
  apiBase: string,
  classId: string
) => {
  return axios.get(`${apiBase}/students/class/${classId}`);
};
