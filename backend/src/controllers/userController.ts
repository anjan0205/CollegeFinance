import { Response } from 'express';
import { getSeedUsers, getSeedDepartments } from '../utils/seedData';
import { AuthenticatedRequest } from '../middleware/auth';
import { UserRole } from '../types';

export async function getUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const users = getSeedUsers();
    return res.json({ success: true, data: users });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
}

export async function createUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, email, role, departmentId } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, and role are required.' });
    }

    const users = getSeedUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists.' });
    }

    const departments = getSeedDepartments();
    const deptObj = departments.find(d => d.id === parseInt(departmentId, 10));

    const newUser = {
      id: users.length + 1,
      name,
      email,
      role: role as UserRole,
      departmentId: deptObj ? deptObj.id : null,
      departmentCode: deptObj ? deptObj.code : null,
      departmentName: deptObj ? deptObj.name : null
    };

    users.push(newUser);

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      user: newUser
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to create user.' });
  }
}

export async function updateUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10);
    const { role, departmentId, name } = req.body;

    const users = getSeedUsers();
    const user = users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (name) user.name = name;
    if (role) user.role = role as UserRole;

    if (departmentId) {
      const departments = getSeedDepartments();
      const deptObj = departments.find(d => d.id === parseInt(departmentId, 10));
      if (deptObj) {
        user.departmentId = deptObj.id;
        user.departmentCode = deptObj.code;
        user.departmentName = deptObj.name;
      }
    }

    return res.json({
      success: true,
      message: 'User updated successfully.',
      user
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
}
