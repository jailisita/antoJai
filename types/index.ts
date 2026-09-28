export type Category = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  extra_info: string | null;
  price: number;
  is_available: boolean;
  stock: number;
  category_id: string | null;
  image_url: string | null;
  image_public_id: string | null;
  sort_order: number;
  created_at: string;
};

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: 'customer' | 'admin';
  created_at: string;
};

export type OrderStatus =
  | 'pendiente_confirmacion'
  | 'pago_reportado'
  | 'confirmado'
  | 'en_preparacion'
  | 'listo'
  | 'entregado'
  | 'rechazado'
  | 'cancelado';

export type PaymentMethod = 'nequi' | 'efectivo';

export type Order = {
  id: string;
  user_id: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  total: number;
  payment_proof_url: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  delivery_note: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
};

export type StoreSettings = {
  id: number;
  qr_image_url: string | null;
  nequi_key: string | null;
  whatsapp_number: string | null;
  address: string | null;
  opening_hours: string | null;
  payment_instructions: string | null;
  accepts_cash: boolean;
  updated_at: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
};
