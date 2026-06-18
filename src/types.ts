export interface TrackedProduct {
  id: string;
  ticker: string;        // Cafe Short Code e.g. "MATCHA", "CCINO"
  name: string;          // Cute menu name e.g. "Cozy Matcha Latte Foam"
  sku: string;           // Barcode/SKU e.g. "725272730201"
  quantity: number;      // Ingredients or baked portions remaining
  unitCost: number;      // Ingredient acquisition cost per unit e.g. 1.25
  price: number;         // Current dynamic price in kiosk menu e.g. 5.50
  category: string;      // Category e.g. 'Coffee & Tea', 'Sweet Pastries', 'Desserts', 'Merchandise'
  alertType: 'above' | 'below' | 'low-stock' | 'none';
  alertThreshold: number; // Price threshold or stock count limit
  lastTriggeredAt: string | null;
  isActive: boolean;
  notes?: string;        // Cute barista notes e.g. "Sprinkle with cocoa paws!"
}

export interface AlertLog {
  id: string;
  productId: string;
  productName: string;
  ticker: string;
  triggeredValue: number;
  thresholdValue: number;
  triggerType: 'above' | 'below' | 'low-stock';
  timestamp: string;
  read: boolean;
}

export interface CafeItemTrend {
  ticker: string;
  name: string;
  currentPrice: number;
  prevPrice: number;
  change: number;
  changePercent: number;
  history: number[];     // Last 30 hours of price trends representing custom/surge dynamics
  sparkline: number[];   // Last 15 rapid order signals
  popularityScore: number; // 0 to 100 cute score based on hourly kiosk clicks OR purchases
  lastUpdated: string;
}

export interface KioskOrder {
  id: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  totalPrice: number;
  timestamp: string;
  customerName: string;
  status: 'brewing' | 'ready' | 'enjoyed';
}
