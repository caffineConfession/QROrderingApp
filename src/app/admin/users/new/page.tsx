
"use client"; 

import UserForm from "../components/UserForm";
import { createAdminUserAction, type CreateAdminUserFormData } from "../actions";

export default function NewAdminUserPage() {
  
  // Type assertion needed because UserForm expects UserFormData which is a union
  const handleSubmit = async (data: CreateAdminUserFormData) => {
    return createAdminUserAction(data);
  };

  return (
    <UserForm
      onSubmitAction={handleSubmit as any} // Use 'as any' or ensure UserForm can handle specific action types
      isEditMode={false}
    />
  );
}
