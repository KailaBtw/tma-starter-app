import { PostAttachmentType, PostGeneric, PostQuiz, PostVideo } from '../types';

export const dummyPosts: (
    | PostGeneric
    | PostAttachmentType
    | PostVideo
    | PostQuiz
)[] = [
    {
        id: 1,
        title: 'Introduction to React Native',
        type: 'generic',
        text: 'React Native is a framework for building mobile apps...',
        image: 'https://example.com/image.jpg', // optional
    },
    {
        id: 2,
        title: 'Course Syllabus PDF',
        type: 'attachment',
        text: 'Download the course syllabus here.',
        pdfUrl: 'https://example.com/syllabus.pdf',
        fileName: 'syllabus.pdf',
        fileSize: 1024000,
    },
    {
        id: 3,
        title: 'React Native Tutorial Video',
        type: 'video',
        text: 'Watch this video to learn React Native basics.',
        vimeoId: '123456789', // or vimeoUrl
    },
    {
        id: 4,
        title: 'Week 1 Quiz',
        type: 'quiz',
        text: 'Test your knowledge with this quiz.',
        questions: [
            {
                question: 'What is React Native?',
                type: 'multiple_choice',
                options: [
                    'A web framework',
                    'A mobile framework',
                    'A database',
                ],
                validAnswers: [1], // index of correct answer
            },
            {
                question: 'React Native uses JavaScript.',
                type: 'true_false',
                validAnswers: [true],
            },
            {
                question: 'Which are React Native features?',
                type: 'select_all',
                options: ['Cross-platform', 'Hot reload', 'Native performance'],
                validAnswers: [0, 1, 2], // all are correct
            },
        ],
    },
];
