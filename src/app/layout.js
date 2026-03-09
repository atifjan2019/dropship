import './globals.css';
import Header from '@/components/Header';
import { CartProvider } from '@/context/CartContext';

export const metadata = {
  title: 'Velora — Premium Dropshipping Store',
  description: 'Discover trending products shipped directly to your door across the USA. Fast shipping, quality goods, unbeatable prices.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <Header />
          <main className="page">
            {children}
          </main>
          <footer className="footer">
            <div className="footer-inner">
              <div className="footer-brand">◆ VELORA</div>
              <p className="footer-tagline">Premium products, delivered to your doorstep.</p>
              <div className="footer-links">
                <a href="/products" className="footer-link">All Products</a>
                <a href="/orders" className="footer-link">Track Orders</a>
                <a href="mailto:support@velora.store" className="footer-link">Support</a>
              </div>
              <p className="footer-copy">© 2026 Velora. All rights reserved. Ships to USA 🇺🇸</p>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
