import { NextResponse } from 'next/server';
import { downloadAndParseSyscomCsv } from '@/services/syscomCsvSync';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const { products, status } = await downloadAndParseSyscomCsv();
    return NextResponse.json({
      success: status.status === 'success',
      status,
      count: products.length,
      sample: products.slice(0, 3),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Error al ejecutar la sincronización de Syscom',
      },
      { status: 500 }
    );
  }
}
