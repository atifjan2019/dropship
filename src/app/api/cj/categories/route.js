import { getCategories } from '@/lib/cj-api';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const data = await getCategories();

        // CJ categories are deeply nested:
        // data[].categoryFirstName, categoryFirstList[].categorySecondName, categorySecondList[].{ categoryId, categoryName }
        // Flatten into a simple list for the frontend
        let categories = [];

        if (data.data && Array.isArray(data.data)) {
            for (const first of data.data) {
                if (first.categoryFirstList && Array.isArray(first.categoryFirstList)) {
                    for (const second of first.categoryFirstList) {
                        if (second.categorySecondList && Array.isArray(second.categorySecondList)) {
                            for (const cat of second.categorySecondList) {
                                categories.push({
                                    categoryId: cat.categoryId,
                                    categoryName: cat.categoryName,
                                    parentName: second.categorySecondName || first.categoryFirstName,
                                });
                            }
                        }
                        // Also include second-level if it has an ID
                        if (second.categoryId) {
                            categories.push({
                                categoryId: second.categoryId,
                                categoryName: second.categorySecondName,
                                parentName: first.categoryFirstName,
                            });
                        }
                    }
                }
                // Include first-level if it has an ID
                if (first.categoryId) {
                    categories.push({
                        categoryId: first.categoryId,
                        categoryName: first.categoryFirstName,
                    });
                }
            }
        }

        return NextResponse.json({
            code: data.code,
            result: data.result,
            data: categories,
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
