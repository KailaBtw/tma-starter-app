/**
 * Type definitions for API responses and requests
 * Based on backend Pydantic schemas
 */

// ============================================================================
// Common Types
// ============================================================================

export interface Role {
    id: number;
    name: string;
    description?: string | null;
}

// ============================================================================
// Auth Types
// ============================================================================

export interface User {
    id: number;
    username: string;
    email: string;
    first_name?: string | null;
    last_name?: string | null;
    child_name?: string | null;
    child_sex_assigned_at_birth?: string | null;
    child_dob?: string | null; // ISO date string
    avatar_url?: string | null;
    role: Role;
    email_verified: boolean;
    is_active: boolean;
    created_at: string; // ISO datetime string
    updated_at: string; // ISO datetime string
}

export interface Token {
    access_token: string;
    token_type: string;
}

export interface UserCreate {
    username: string;
    email: string;
    password: string;
    role?: string;
    first_name?: string | null;
    last_name?: string | null;
    child_name?: string | null;
    child_sex_assigned_at_birth?: string | null;
    child_dob?: string | null;
    avatar_url?: string | null;
}

// ============================================================================
// Course Types
// ============================================================================

export interface Course {
    id: number;
    title: string;
    description?: string | null;
    file_url?: string | null;
    module_count?: number;
    created_at: string;
    updated_at: string;
}

export interface Module {
    id: number;
    title: string;
    description?: string | null;
    color?: string | null;
    ordering: number;
    created_at: string;
    updated_at: string;
    course_id: number;
}

export interface Post {
    id: number;
    title: string;
    description?: string | null;
    color?: string | null;
    content?: string | null;
    post_type: string;
    module_id: number;
    ordering: number;
    created_at: string;
    updated_at: string;
}

export interface CourseDetail extends Course {
    modules?: Module[];
}

export interface ModuleDetail extends Module {
    posts?: Post[];
}


// ============================================================================
// Group Types
// ============================================================================

export interface GroupMember {
    user_id: number;
    username: string;
    email: string;
    first_name?: string | null;
    last_name?: string | null;
    role: Role;
    group_role?: string | null; // "member", "moderator", "owner"
    user_role?: string | null; // User's system role ('admin', 'user', 'manager')
    joined_at: string;
    avatar_url?: string | null;
}

export interface Group {
    id: number;
    name: string;
    description?: string | null;
    created_at: string;
    updated_at: string;
    member_count?: number;
}

export interface GroupDetail extends Group {
    members: GroupMember[];
}

// ============================================================================
// Course Group Types
// ============================================================================

export interface CourseGroup {
    id: number;
    course_id: number;
    group_id: number;
    ordering: number;
    date_assigned: string;
}

// ============================================================================
// Post Types
// ============================================================================
interface PostBase {
    id: number;
    title: string;
    type: 'generic' | 'attachment' | 'video' | 'quiz';
    text: string;
}

export interface PostAttachmentType extends PostBase {
    pdfUrl: string;
    fileName: string;
    fileSize: number;
}

export interface PostGeneric extends PostBase {
    image?: string;
}

export interface PostVideo extends PostBase {
    vimeoId: string;
}

export interface PostQuiz extends PostBase {
    questions: (
        | MultipleChoiceQuestion
        | TrueFalseQuestion
        | SelectAllQuestion
    )[];
}

interface QuestionBase {
    question: string;
    type: string;
}

export interface MultipleChoiceQuestion extends QuestionBase {
    options: string[];
    validAnswers: number[];
}

export interface TrueFalseQuestion extends QuestionBase {
    validAnswers: boolean[];
}

export interface SelectAllQuestion extends QuestionBase {
    options: string[];
    validAnswers: number[];
}
