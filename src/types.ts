export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  hot: boolean;
  stock: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  totalPrice: number;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  createdAt: any; // Firestore Timestamp
}

export interface Customer {
  id?: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface Category {
  id?: string;
  name: string;
  order?: number;
}
