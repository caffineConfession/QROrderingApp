
"use client";
// Note: This page itself doesn't need "use client" if ProductForm handles all client logic.
// However, ProductForm will need it for react-hook-form.
// For simplicity, making this a client component for now.

import ProductForm from "../components/ProductForm";
import { createProductAction, type ProductFormData } from "../actions";

export default function NewProductPage() {
  const handleSubmit = async (data: ProductFormData) => {
    return createProductAction(data);
  };

  return (
    <div>
      <ProductForm onSubmit={handleSubmit} isEditMode={false} />
    </div>
  );
}
