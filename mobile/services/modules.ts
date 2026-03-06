import apiClient from './api';
import { Module } from '../types';

export async function getModuleDetail(moduleId: number): Promise<Module> {
    try {
        if (__DEV__) {
            console.log(`Fetching module detail for module ID: ${moduleId}`);
        }
        const response = await apiClient.get<Module>(
            `/api/modules/${moduleId}`
        );
        if (__DEV__) {
            console.log('Module detail response:', response.data);
        }
        return response.data;
    } catch (error) {
        if (__DEV__) {
            if (error instanceof Error) {
                console.error('Error fetching module detail:', error.message);
            } else {
                console.error('Error fetching module detail:', error);
            }
        }
        throw error;
    }
}
