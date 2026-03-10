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
            <div className="footer-main">
              <div className="footer-brand-section">
                <div className="footer-brand">◆ Velora</div>
                <p className="footer-tagline">
                  Premium products, delivered to your doorstep. Shop the latest trends at unbeatable prices with fast US shipping.
                </p>
                <div className="footer-social">
                  <a href="#" aria-label="Facebook">f</a>
                  <a href="#" aria-label="Twitter">𝕏</a>
                  <a href="#" aria-label="Instagram">◎</a>
                </div>
              </div>
              <div className="footer-column">
                <h4>Information</h4>
                <div className="footer-links">
                  <a href="/about" className="footer-link">About Us</a>
                  <a href="/products" className="footer-link">All Products</a>
                  <a href="/shipping" className="footer-link">Shipping & Returns</a>
                  <a href="/faq" className="footer-link">FAQ</a>
                </div>
              </div>
              <div className="footer-column">
                <h4>My Account</h4>
                <div className="footer-links">
                  <a href="/cart" className="footer-link">Shopping Cart</a>
                  <a href="/orders" className="footer-link">Order History</a>
                  <a href="/track" className="footer-link">Track Order</a>
                  <a href="/checkout" className="footer-link">Checkout</a>
                </div>
              </div>
              <div className="footer-column">
                <h4>Customer Service</h4>
                <div className="footer-links">
                  <a href="/contact" className="footer-link">Contact Us</a>
                  <a href="/faq" className="footer-link">FAQ</a>
                  <a href="mailto:support@velora.store" className="footer-link">Email Support</a>
                </div>
              </div>
            </div>
            <div className="footer-bottom">
              <div className="footer-bottom-inner">
                <p className="footer-copy">© 2026 Velora. All Rights Reserved.</p>
                <div className="footer-payments">
                  <span>VISA</span>
                  <span>MASTERCARD</span>
                  <span>PAYPAL</span>
                  <span>AMEX</span>
                </div>
              </div>
            </div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
