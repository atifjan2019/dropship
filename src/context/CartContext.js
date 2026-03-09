'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
    const [items, setItems] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem('velora-cart');
            if (saved) setItems(JSON.parse(saved));
        } catch { }
        setIsLoaded(true);
    }, []);

    // Persist to localStorage
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('velora-cart', JSON.stringify(items));
        }
    }, [items, isLoaded]);

    const addItem = useCallback((product) => {
        setItems(prev => {
            const key = `${product.pid}-${product.vid || 'default'}`;
            const existing = prev.find(i => `${i.pid}-${i.vid || 'default'}` === key);
            if (existing) {
                return prev.map(i =>
                    `${i.pid}-${i.vid || 'default'}` === key
                        ? { ...i, quantity: i.quantity + (product.quantity || 1) }
                        : i
                );
            }
            return [...prev, { ...product, quantity: product.quantity || 1 }];
        });
    }, []);

    const removeItem = useCallback((pid, vid) => {
        setItems(prev => prev.filter(i => !(i.pid === pid && (i.vid || 'default') === (vid || 'default'))));
    }, []);

    const updateQuantity = useCallback((pid, vid, quantity) => {
        if (quantity < 1) return;
        setItems(prev =>
            prev.map(i =>
                i.pid === pid && (i.vid || 'default') === (vid || 'default')
                    ? { ...i, quantity }
                    : i
            )
        );
    }, []);

    const clearCart = useCallback(() => setItems([]), []);

    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = items.reduce((sum, i) => sum + (i.sellPrice || 0) * i.quantity, 0);

    return (
        <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, subtotal, isLoaded }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within CartProvider');
    return ctx;
}
