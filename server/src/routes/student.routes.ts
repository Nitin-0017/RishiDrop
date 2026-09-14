import { Router } from 'express';
import { searchStudents, getAllStudents, getStudentById } from '../controllers/student.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { searchStudentSchema } from '../validators';
import { Role } from '@prisma/client';

const router = Router();

// Guards and Admins can search students
router.get('/search', authenticate, authorize(Role.GUARD, Role.ADMIN), validate(searchStudentSchema), searchStudents);
// Admins can list all students with pagination
router.get('/', authenticate, authorize(Role.ADMIN), getAllStudents);
router.get('/:id', authenticate, getStudentById);

export default router;
