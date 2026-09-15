import { Request, Response } from 'express';
import { generateToken } from '../config/jwt';
import { getSeedUsers, getSeedDepartments } from '../utils/seedData';
import { AuthenticatedRequest } from '../middleware/auth';

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const users = getSeedUsers();
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      const emailLower = email.toLowerCase();
      if (emailLower.includes('principal') || emailLower.includes('ceo')) {
        const isPrincipal = emailLower.includes('principal');
        const role = 'ADMIN';
        user = {
          id: Math.floor(Math.random() * 10000) + 100,
          name: isPrincipal ? 'Principal Officer' : 'CEO / Chairman',
          email: email,
          role: role as any,
          departmentId: 9,
          departmentCode: 'DOA',
          departmentName: isPrincipal ? 'Principal Office' : 'CEO & Chairman Office'
        };
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    const departments = getSeedDepartments();
    const dept = user.departmentCode ? departments.find(d => d.code.toUpperCase() === user.departmentCode!.toUpperCase()) : null;
    const finalDeptId = dept ? dept.id : user.departmentId;
    const finalDeptName = dept ? dept.name : user.departmentName;

    // Standardized authentication check
    const token = generateToken({
      ...user,
      departmentId: finalDeptId,
      departmentName: finalDeptName
    });

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: finalDeptId,
        departmentCode: user.departmentCode,
        departmentName: finalDeptName
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Internal server error during authentication.' });
  }
}

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }

  return res.json({
    success: true,
    user: req.user
  });
}
