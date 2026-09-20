import { z } from "zod";

export const checkoutSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name"),
  phone: z
    .string()
    .trim()
    .min(10, "Enter a valid phone number")
    .max(15, "Enter a valid phone number"),
  whatsapp_number: z.string().trim().optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  delivery_address: z.string().trim().min(5, "Enter your delivery address"),
  city: z.string().trim().min(2, "Enter your city"),
  state: z.string().trim().min(2, "Enter your state"),
  delivery_instructions: z.string().trim().optional().or(z.literal("")),
  payment_method: z.enum(["card", "bank_transfer"]),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export const cartItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const createOrderInputSchema = z.object({
  customer: checkoutSchema,
  items: z.array(cartItemSchema).min(1, "Your cart is empty"),
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;
