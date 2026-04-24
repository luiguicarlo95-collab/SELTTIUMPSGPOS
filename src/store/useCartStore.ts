import { create } from 'zustand';
import { Product, Customer } from '../types';
import { roundTo2Decimals } from '../lib/utils';

interface CartItem extends Product {
  quantity: number;
  selectedSerials?: string[];
  is_uncommon?: boolean;
}

interface Payment {
  method: string;
  amount: number;
}

interface CartState {
  cart: CartItem[];
  payments: Payment[];
  selectedCustomer: Customer | null;
  warranty: string;
  pointsRedeemed: number;
  
  // Actions
  addToCart: (product: Product, serials?: string[]) => void;
  updateQuantity: (id: number, delta: number) => void;
  setQuantity: (id: number, quantity: number) => void;
  removeFromCart: (id: number) => void;
  updatePrice: (id: number, newPrice: number) => void;
  updateName: (id: number, newName: string) => void;
  addCustomProduct: (data: { name: string, price: number }) => void;
  clearCart: () => void;
  
  // Checkout actions
  setPayments: (payments: Payment[]) => void;
  setSelectedCustomer: (customer: Customer | null) => void;
  setWarranty: (warranty: string) => void;
  setPointsRedeemed: (points: number) => void;
  
  // Computed values (as functions to ensure freshness or use selectors)
  getTotals: (pointsRedeemValue?: number) => {
    subtotal: number;
    pointsDiscount: number;
    cardSurcharge: number;
    tax: number;
    total: number;
    totalPaid: number;
    pendingAmount: number;
    change: number;
  };
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: [],
  payments: [],
  selectedCustomer: null,
  warranty: '',
  pointsRedeemed: 0,

  addToCart: (product, serials) => {
    const { cart } = get();
    // Ensure we handle ID as number for internal comparison if it's numeric
    const productId = typeof product.id === 'string' ? parseInt(product.id) : product.id;
    const currentStock = Number(product.stock);
    
    if (currentStock <= 0) {
      alert('Producto sin stock disponible');
      return;
    }

    const existing = cart.find(item => {
      const itemId = typeof item.id === 'string' ? parseInt(item.id) : item.id;
      return itemId === productId;
    });

    if (product.has_serials) {
      if (!serials || serials.length === 0) return;

      if (existing) {
        const currentSerials = existing.selectedSerials || [];
        // Merge and avoid duplicates
        const mergedSerials = Array.from(new Set([...currentSerials, ...serials]));
        
        if (mergedSerials.length > currentStock) {
          alert(`No hay suficiente stock disponible. Stock máximo: ${currentStock}`);
          return;
        }

        set({
          cart: cart.map(item => {
            const itemId = typeof item.id === 'string' ? parseInt(item.id) : item.id;
            return itemId === productId ? { 
              ...item, 
              quantity: mergedSerials.length,
              selectedSerials: mergedSerials
            } : item;
          })
        });
      } else {
        if (serials.length > currentStock) {
          alert(`No hay suficiente stock disponible. Stock máximo: ${currentStock}`);
          return;
        }
        set({ cart: [...cart, { ...product, id: productId, quantity: serials.length, selectedSerials: serials }] });
      }
      return;
    }

    if (existing) {
      if (existing.quantity >= currentStock) {
        alert('No hay más stock disponible');
        return;
      }
      set({
        cart: cart.map(item => {
          const itemId = typeof item.id === 'string' ? parseInt(item.id) : item.id;
          return itemId === productId ? { ...item, quantity: item.quantity + 1 } : item;
        })
      });
    } else {
      set({ cart: [...cart, { ...product, id: productId, quantity: 1 }] });
    }
  },

  updateQuantity: (id, delta) => {
    const { cart } = get();
    const targetId = typeof id === 'string' ? parseInt(id) : id;
    set({
      cart: cart.map(item => {
        const itemId = typeof item.id === 'string' ? parseInt(item.id) : item.id;
        if (itemId === targetId) {
          const newQty = Math.max(0, item.quantity + delta);
          const currentStock = Number(item.stock);
          if (newQty > currentStock) {
            alert(`No hay suficiente stock disponible para "${item.name}". Stock máximo: ${currentStock}`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(item => item.quantity > 0)
    });
  },

  setQuantity: (id, quantity) => {
    const { cart } = get();
    const targetId = typeof id === 'string' ? parseInt(id) : id;
    set({
      cart: cart.map(item => {
        const itemId = typeof item.id === 'string' ? parseInt(item.id) : item.id;
        if (itemId === targetId) {
          const currentStock = Number(item.stock);
          if (quantity > currentStock) {
            alert(`No hay suficiente stock disponible para "${item.name}". Stock máximo: ${currentStock}`);
            return item;
          }
          return { ...item, quantity: Math.max(1, quantity) };
        }
        return item;
      })
    });
  },

  removeFromCart: (id) => {
    const targetId = typeof id === 'string' ? parseInt(id) : id;
    set(state => ({ 
      cart: state.cart.filter(item => {
        const itemId = typeof item.id === 'string' ? parseInt(item.id) : item.id;
        return itemId !== targetId;
      }) 
    }));
  },

  updatePrice: (id, newPrice) => {
    const targetId = typeof id === 'string' ? parseInt(id) : id;
    set(state => ({
      cart: state.cart.map(item => {
        const itemId = typeof item.id === 'string' ? parseInt(item.id) : item.id;
        return itemId === targetId ? { ...item, sale_price: newPrice } : item;
      })
    }));
  },

  updateName: (id, newName) => {
    const targetId = typeof id === 'string' ? parseInt(id) : id;
    set(state => ({
      cart: state.cart.map(item => {
        const itemId = typeof item.id === 'string' ? parseInt(item.id) : item.id;
        return itemId === targetId ? { ...item, name: newName } : item;
      })
    }));
  },

  addCustomProduct: ({ name, price }) => {
    const id = Date.now();
    const uncommonProduct: CartItem = {
      id,
      name: name || 'Producto Especial',
      sale_price: roundTo2Decimals(price || 0),
      purchase_price: 0,
      quantity: 1,
      image: 'https://picsum.photos/seed/uncommon/100/100',
      category_id: 0,
      stock: 999999,
      min_stock: 0,
      unit: 'Unid',
      status: 'active',
      code: 'UNCOMMON',
      has_serials: false,
      is_uncommon: true,
      created_at: new Date().toISOString()
    };
    set(state => ({ cart: [...state.cart, uncommonProduct] }));
  },

  clearCart: () => {
    set({ cart: [], payments: [], selectedCustomer: null, warranty: '', pointsRedeemed: 0 });
  },
 
  setPayments: (payments) => set({ payments }),
  setSelectedCustomer: (customer) => set({ selectedCustomer: customer, pointsRedeemed: 0 }),
  setWarranty: (warranty) => set({ warranty }),
  setPointsRedeemed: (points) => set({ pointsRedeemed: points }),
 
  getTotals: (pointsRedeemValue = 0) => {
    const { cart, payments, pointsRedeemed } = get();
    const subtotal = roundTo2Decimals(cart.reduce((acc, item) => acc + (item.sale_price * item.quantity), 0));
    
    const pointsDiscount = roundTo2Decimals(pointsRedeemed * pointsRedeemValue);
    
    // Subtotal after points discount before surcharge
    const subtotalAfterPoints = Math.max(0, subtotal - pointsDiscount);

    const cardSurcharge = roundTo2Decimals(payments
      .filter(p => p.method === 'card')
      .reduce((acc, p) => acc + (p.amount - (p.amount / 1.05)), 0));
    
    const total = roundTo2Decimals(subtotalAfterPoints + cardSurcharge);
    const totalPaid = roundTo2Decimals(payments.reduce((acc, p) => acc + p.amount, 0));
    const pendingAmount = roundTo2Decimals(Math.max(0, total - totalPaid));
    const change = roundTo2Decimals(totalPaid > total ? totalPaid - total : 0);
 
    return {
      subtotal,
      pointsDiscount,
      cardSurcharge,
      tax: 0, // Not implemented in current logic
      total,
      totalPaid,
      pendingAmount,
      change
    };
  }
}));
