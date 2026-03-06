import apiClient from './api';
import { Course, CourseDetail, Post } from '../types';

export async function getUserCourses(): Promise<Course[]> {
    // In starter-code, course-group relationships were removed
    // Simply return all courses for now
    // Students will implement course-group filtering later
    const response = await apiClient.get<Course[]>('/api/courses');
    return response.data;
}

export async function getCourseDetail(courseId: number): Promise<CourseDetail> {
    const response = await apiClient.get<CourseDetail>(
        `/api/courses/${courseId}`
    );
    return response.data;
}

export { getModuleDetail } from './modules';

export async function getModulePosts(moduleId: number): Promise<Post[]> {
    try {
        if (__DEV__) {
            console.log(`Fetching posts for module ID: ${moduleId}`);
        }
        const response = await apiClient.get<Post[]>(
            `/api/posts?module_id=${moduleId}`
        );
        if (__DEV__) {
            console.log(
                `Found ${response.data.length} posts for module ${moduleId}`
            );
        }
        return response.data;
    } catch (error) {
        if (__DEV__) {
            if (error instanceof Error) {
                console.error('Error fetching module posts:', error.message);
            } else {
                console.error('Error fetching module posts:', error);
            }
        }
        throw error;
    }
}
