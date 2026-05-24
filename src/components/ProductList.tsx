import React from 'react';

interface WarehouseAvailability {
  warehouseId: string;
  warehouseName: string;
  available: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  warehouses: WarehouseAvailability[];
}

interface ProductListProps {
  products: Product[];
  onReserve: (productId: string, warehouseId: string) => void;
}

export const ProductList: React.FC<ProductListProps> = ({ products, onReserve }) => (
  <div className="space-y-6">
    {products.map((product) => (
      <div key={product.id} className="border rounded-lg p-4 shadow-sm">
        <div className="font-bold text-lg mb-2">{product.name}</div>
        <div className="text-sm text-gray-500 mb-2">SKU: {product.sku}</div>
        <div className="space-y-1">
          {product.warehouses.map((wh) => (
            <div key={wh.warehouseId} className="flex items-center justify-between">
              <span>{wh.warehouseName} → <span className="font-mono">{wh.available}</span> available</span>
              <button
                className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
                disabled={wh.available <= 0}
                onClick={() => onReserve(product.id, wh.warehouseId)}
              >
                Reserve
              </button>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);
