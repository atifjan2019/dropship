import Link from 'next/link';

export default function CheckoutSuccess() {
    return (
        <div className="success-page fade-in">
            <div className="success-icon">✓</div>
            <h1>Order Placed Successfully!</h1>
            <p>
                Your order has been submitted and is being processed. You'll receive tracking
                information once your order ships. Estimated delivery to the USA is 7–15 business days.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/orders" className="btn btn-primary">Track Your Orders</Link>
                <Link href="/products" className="btn btn-secondary">Continue Shopping</Link>
            </div>
        </div>
    );
}
