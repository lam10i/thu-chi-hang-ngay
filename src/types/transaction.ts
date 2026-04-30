export interface Transaction {
  id: string;
  amount: number;
  category: string;
  note?: string;
  date: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color?: string;
}

export interface FixedCost {
  id: string;
  name: string;
  amount: number;
  category?: string;
  note?: string;
  createdAt: string;
}
