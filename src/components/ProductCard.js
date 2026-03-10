import Link from 'next/link';

export default function ProductCard({ product }) {
    const { pid, productNameEn, productImage, sellPrice, categoryName } = product;
    const imgSrc = productImage || '/placeholder.png';
    const price = sellPrice ? `$${Number(sellPrice).toFixed(2)}` : 'N/A';

    return (
        <Link href={`/products/${pid}`} className="product-card" id={`product-${pid}`}>
            <div className="product-card-img-wrap">
                <img
                    src={imgSrc}
                    alt={productNameEn || 'Product'}
                    className="product-card-img"
                    loading="lazy"
                />
                {categoryName && <span className="product-card-badge">{categoryName.split('>').pop().trim()}</span>}
            </div>
            <div className="product-card-body">
                <h3 className="product-card-title">{productNameEn || 'Unnamed Product'}</h3>
                <div className="product-card-footer">
                    <span className="product-card-price">{price}</span>
                    <span className="product-card-action">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                        </svg>
                    </span>
                </div>
            </div>
        </Link>
    );
}
