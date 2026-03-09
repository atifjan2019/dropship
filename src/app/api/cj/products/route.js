import { searchProducts } from '@/lib/cj-api';
import { NextResponse } from 'next/server';

/**
 * Normalize a product from V2 list format to a consistent shape.
 * V2 uses: id, nameEn, bigImage
 * Detail uses: pid, productNameEn, productImage
 * We normalize everything to the detail format for frontend consistency.
 */
function normalizeProduct(p) {
    return {
        ...p,
        pid: p.pid || p.id,
        productNameEn: p.productNameEn || p.nameEn || '',
        productImage: p.productImage || p.bigImage || '',
        sellPrice: p.sellPrice || p.nowPrice || 0,
        categoryName: p.categoryName || p.threeCategoryName || p.oneCategoryName || '',
    };
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const keyword = searchParams.get('keyword') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const size = parseInt(searchParams.get('size') || '20');
        const categoryId = searchParams.get('categoryId') || '';

        const data = await searchProducts({ keyword, page, size, categoryId, countryCode: 'US' });

        // V2 response structure: data.content[].productList[]
        let products = [];
        let total = 0;

        if (data.data) {
            if (data.data.content && Array.isArray(data.data.content)) {
                // V2 format — products are nested
                for (const group of data.data.content) {
                    if (group.productList && Array.isArray(group.productList)) {
                        products.push(...group.productList.map(normalizeProduct));
                    }
                }
                total = data.data.totalRecords || products.length;
            } else if (Array.isArray(data.data)) {
                // Fallback: flat array
                products = data.data.map(normalizeProduct);
                total = products.length;
            } else if (data.data.list && Array.isArray(data.data.list)) {
                // Alternative format
                products = data.data.list.map(normalizeProduct);
                total = data.data.total || products.length;
            }
        }

        return NextResponse.json({
            code: data.code,
            result: data.result,
            message: data.message,
            data: {
                list: products,
                total,
                page: data.data?.pageNumber || page,
                totalPages: data.data?.totalPages || Math.ceil(total / size),
            },
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
