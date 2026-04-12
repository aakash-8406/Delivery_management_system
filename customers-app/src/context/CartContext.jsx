import { createContext, useContext, useReducer } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(i => i.id === action.payload.id);
      if (existing) return { ...state, items: state.items.map(i => i.id === action.payload.id ? { ...i, qty: i.qty + 1 } : i) };
      return { ...state, items: [...state.items, { ...action.payload, qty: 1 }] };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.id !== action.payload) };
    case 'DECREMENT_ITEM': {
      const item = state.items.find(i => i.id === action.payload);
      if (!item) return state;
      if (item.qty === 1) return { ...state, items: state.items.filter(i => i.id !== action.payload) };
      return { ...state, items: state.items.map(i => i.id === action.payload ? { ...i, qty: i.qty - 1 } : i) };
    }
    case 'SET_RESTAURANT':
      return { ...state, restaurantId: action.payload };
    case 'CLEAR_CART':
      return { items: [], restaurantId: null };
    default: return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [], restaurantId: null });

  const addItem = (item) => dispatch({ type: 'ADD_ITEM', payload: item });
  const removeItem = (id) => dispatch({ type: 'REMOVE_ITEM', payload: id });
  const decrementItem = (id) => dispatch({ type: 'DECREMENT_ITEM', payload: id });
  const clearCart = () => dispatch({ type: 'CLEAR_CART' });
  const setRestaurantId = (id) => dispatch({ type: 'SET_RESTAURANT', payload: id });

  const totalItems = state.items.reduce((s, i) => s + i.qty, 0);
  const totalPrice = state.items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <CartContext.Provider value={{
      items: state.items,
      restaurantId: state.restaurantId,
      addItem, removeItem, decrementItem, clearCart, setRestaurantId,
      totalItems, totalPrice,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
