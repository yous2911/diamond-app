import apiClient from './api';

// I am assuming the shape of the data returned by the API.
// In a real project, these types would be defined in `types/student.ts` or similar.

export interface Student {
    id: string;
    name: string;
    level: string;
    totalXp: number;
    exercisesCompleted: number;
}

export interface Progress {
    xp: number;
    level: number;
    // other progress data...
}

export const getStudent = async (id: string): Promise<Student> => {
    const response = await apiClient.get(`/students/${id}`);
    return response.data;
};

export const getStudentProgress = async (studentId: string): Promise<Progress> => {
    const response = await apiClient.get(`/progress/${studentId}`);
    return response.data;
};
