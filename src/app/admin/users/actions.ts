
'use server';

import prisma from '@/lib/prisma';
import { AdminRole } from '@prisma/client';
import * as z from 'zod';
import bcryptjs from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { decryptSession } from '@/lib/session';

const saltRounds = 10;

// Schema for creating a new admin user
export const CreateAdminUserSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long.' }),
  role: z.nativeEnum(AdminRole, { errorMap: () => ({ message: 'Invalid role selected.' }) }),
});
export type CreateAdminUserFormData = z.infer<typeof CreateAdminUserSchema>;

// Schema for updating an admin user
export const UpdateAdminUserSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  role: z.nativeEnum(AdminRole, { errorMap: () => ({ message: 'Invalid role selected.' }) }),
  // Password update is optional and can be handled separately or require a new password field
  // For simplicity, we are not handling password changes directly in this update form
});
export type UpdateAdminUserFormData = z.infer<typeof UpdateAdminUserSchema>;


async function verifyBusinessManager() {
  const sessionCookie = cookies().get('admin_session')?.value;
  const session = await decryptSession(sessionCookie);
  if (!session || session.role !== AdminRole.BUSINESS_MANAGER) {
    throw new Error('Unauthorized: Access restricted to Business Managers.');
  }
  return session;
}

export async function getAdminUsersAction() {
  try {
    await verifyBusinessManager();
    const users = await prisma.adminUser.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, role: true, createdAt: true }, // Don't send password hash to client
    });
    return { success: true, users };
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch admin users.' };
  }
}

export async function getAdminUserByIdAction(userId: string) {
  try {
    await verifyBusinessManager();
    const user = await prisma.adminUser.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });
    if (!user) {
      return { success: false, error: 'User not found.' };
    }
    return { success: true, user };
  } catch (error) {
    console.error(`Error fetching admin user ${userId}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch user.' };
  }
}

export async function createAdminUserAction(data: CreateAdminUserFormData) {
  try {
    await verifyBusinessManager();
    const validation = CreateAdminUserSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: 'Invalid data.', issues: validation.error.issues };
    }

    const { email, password, role } = validation.data;

    const existingUser = await prisma.adminUser.findUnique({ where: { email } });
    if (existingUser) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const hashedPassword = await bcryptjs.hash(password, saltRounds);

    const newUser = await prisma.adminUser.create({
      data: {
        email: email.toLowerCase(),
        passwordHash: hashedPassword,
        role,
      },
    });

    revalidatePath('/admin/users');
    return { success: true, user: { id: newUser.id, email: newUser.email, role: newUser.role } };
  } catch (error) {
    console.error('Error creating admin user:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create user.' };
  }
}

export async function updateAdminUserAction(userId: string, data: UpdateAdminUserFormData) {
  try {
    await verifyBusinessManager();
    const validation = UpdateAdminUserSchema.safeParse(data);
    if (!validation.success) {
      return { success: false, error: 'Invalid data.', issues: validation.error.issues };
    }

    const { email, role } = validation.data;

    const userToUpdate = await prisma.adminUser.findUnique({ where: { id: userId } });
    if (!userToUpdate) {
      return { success: false, error: 'User not found.' };
    }

    // Check if email is being changed and if the new email already exists for another user
    if (email.toLowerCase() !== userToUpdate.email.toLowerCase()) {
      const existingUserWithNewEmail = await prisma.adminUser.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (existingUserWithNewEmail && existingUserWithNewEmail.id !== userId) {
        return { success: false, error: 'This email address is already in use by another account.' };
      }
    }

    const updatedUser = await prisma.adminUser.update({
      where: { id: userId },
      data: {
        email: email.toLowerCase(),
        role,
      },
    });

    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}/edit`);
    return { success: true, user: { id: updatedUser.id, email: updatedUser.email, role: updatedUser.role } };
  } catch (error) {
    console.error(`Error updating admin user ${userId}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update user.' };
  }
}

export async function deleteAdminUserAction(userId: string) {
  try {
    const session = await verifyBusinessManager();

    const userToDelete = await prisma.adminUser.findUnique({ where: { id: userId } });
    if (!userToDelete) {
      return { success: false, error: 'User not found.' };
    }

    // Prevent Business Manager from deleting their own account
    if (userToDelete.email === session.email) {
        return { success: false, error: "You cannot delete your own account." };
    }


    await prisma.adminUser.delete({
      where: { id: userId },
    });

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    console.error(`Error deleting admin user ${userId}:`, error);
    // Check for specific Prisma error related to foreign key constraints if needed in the future
    // For now, a generic error message.
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete user. They might be associated with existing records.' };
  }
}

