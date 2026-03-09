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
                {categoryName && <span className="product-card-badge">{categoryName}</span>}
            </div>
            <div className="product-card-body">
                <h3 className="product-card-title">{productNameEn || 'Unnamed Product'}</h3>
                <div className="product-card-footer">
                    <span className="product-card-price">{price}</span>
                    <span className="product-card-action">View →</span>
                </div>
            </div>
        </Link>
    );
}
