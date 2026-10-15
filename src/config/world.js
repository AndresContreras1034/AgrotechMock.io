// 1 unidad de mundo = 1 metro (el ancho de las camas se exagera al dibujar).
export const WORLD = { width: 900, height: 640 };

// Quebrada: línea central que cruza el lote en diagonal.
export const CREEK = {
  points: [[300, 0], [350, 160], [405, 320], [480, 480], [560, 640]],
  bedWidth: 28,
  minWaterWidth: 3,
  maxWaterWidth: 24,
};

export const ROAD = { y: 470, h: 14 };
export const STORE = { x: 80, y: 500, w: 80, h: 55, label: 'Tienda de insumos' };
export const WAREHOUSE = { x: 600, y: 500, w: 70, h: 45, label: 'Bodega' };
export const WATER_SUPPLIER = { x: 190, y: 525, r: 14, label: 'Proveedor de agua' };