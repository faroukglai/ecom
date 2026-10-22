export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  categoryId: string | null;
  brand: string;
  price: number;
  oldPrice?: number;
  image: string;
  gallery: string[];
  color: string;
  material: string;
  description: string;
  isNew?: boolean;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentId: string | null;
  visible: boolean;
  sortOrder: number;
};

export type Catalog = {
  products: Product[];
  categories: Category[];
};

export type OrderStatus = "new" | "confirmed" | "shipped" | "delivered" | "cancelled";

export type StoreOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  location: string;
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  createdAt: string;
  items: {
    id: string;
    productId: string | null;
    productName: string;
    productImage: string;
    quantity: number;
    unitPrice: number;
  }[];
};

export const ADMIN_EMAIL = "faroukglai2002@gmail.com";
