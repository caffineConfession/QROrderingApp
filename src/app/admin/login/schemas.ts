
import * as z from "zod";

export const ResetPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  confirmationString: z.string().min(1, { message: "Confirmation string is required." }),
  newPassword: z.string().min(8, { message: "New password must be at least 8 characters long." }),
});
export type ResetPasswordFormData = z.infer<typeof ResetPasswordSchema>;
