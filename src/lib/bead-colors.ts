// 水雾魔珠常用颜色库
// 参考 Perler Beads / Hama Beads 的标准色板

export interface BeadColor {
  id: string;
  name: string;
  hex: string;
  rgb: [number, number, number];
}

// 常用的魔珠颜色（约40种常用色）
export const BEAD_COLORS: BeadColor[] = [
  // 白色系
  { id: '01', name: '白色', hex: '#FFFFFF', rgb: [255, 255, 255] },
  { id: '02', name: '乳白', hex: '#FFFDD0', rgb: [255, 253, 208] },
  { id: '03', name: '奶油色', hex: '#FFFACD', rgb: [255, 250, 205] },
  
  // 黑色系
  { id: '04', name: '黑色', hex: '#000000', rgb: [0, 0, 0] },
  { id: '05', name: '深灰', hex: '#404040', rgb: [64, 64, 64] },
  { id: '06', name: '灰色', hex: '#808080', rgb: [128, 128, 128] },
  { id: '07', name: '浅灰', hex: '#C0C0C0', rgb: [192, 192, 192] },
  
  // 红色系
  { id: '08', name: '红色', hex: '#E31D42', rgb: [227, 29, 66] },
  { id: '09', name: '深红', hex: '#8B0000', rgb: [139, 0, 0] },
  { id: '10', name: '粉红', hex: '#FF69B4', rgb: [255, 105, 180] },
  { id: '11', name: '浅粉', hex: '#FFB6C1', rgb: [255, 182, 193] },
  { id: '12', name: '玫红', hex: '#FF007F', rgb: [255, 0, 127] },
  { id: '13', name: '珊瑚色', hex: '#FF7F50', rgb: [255, 127, 80] },
  
  // 橙色系
  { id: '14', name: '橙色', hex: '#FF6600', rgb: [255, 102, 0] },
  { id: '15', name: '浅橙', hex: '#FFA500', rgb: [255, 165, 0] },
  { id: '16', name: '杏色', hex: '#FFA07A', rgb: [255, 160, 122] },
  
  // 黄色系
  { id: '17', name: '黄色', hex: '#FFD700', rgb: [255, 215, 0] },
  { id: '18', name: '浅黄', hex: '#FFFF99', rgb: [255, 255, 153] },
  { id: '19', name: '金黄', hex: '#FFC125', rgb: [255, 193, 37] },
  { id: '20', name: '芥末黄', hex: '#FFDB58', rgb: [255, 219, 88] },
  
  // 绿色系
  { id: '21', name: '绿色', hex: '#00A651', rgb: [0, 166, 81] },
  { id: '22', name: '深绿', hex: '#006400', rgb: [0, 100, 0] },
  { id: '23', name: '浅绿', hex: '#90EE90', rgb: [144, 238, 144] },
  { id: '24', name: '荧光绿', hex: '#39FF14', rgb: [57, 255, 20] },
  { id: '25', name: '薄荷绿', hex: '#98FF98', rgb: [152, 255, 152] },
  { id: '26', name: '橄榄绿', hex: '#808000', rgb: [128, 128, 0] },
  { id: '27', name: '青柠色', hex: '#32CD32', rgb: [50, 205, 50] },
  
  // 蓝色系
  { id: '28', name: '蓝色', hex: '#0066CC', rgb: [0, 102, 204] },
  { id: '29', name: '深蓝', hex: '#00008B', rgb: [0, 0, 139] },
  { id: '30', name: '浅蓝', hex: '#ADD8E6', rgb: [173, 216, 230] },
  { id: '31', name: '天蓝', hex: '#87CEEB', rgb: [135, 206, 235] },
  { id: '32', name: '海军蓝', hex: '#000080', rgb: [0, 0, 128] },
  { id: '33', name: '青色', hex: '#00FFFF', rgb: [0, 255, 255] },
  
  // 紫色系
  { id: '34', name: '紫色', hex: '#800080', rgb: [128, 0, 128] },
  { id: '35', name: '深紫', hex: '#4B0082', rgb: [75, 0, 130] },
  { id: '36', name: '浅紫', hex: '#DDA0DD', rgb: [221, 160, 221] },
  { id: '37', name: '薰衣草', hex: '#E6E6FA', rgb: [230, 230, 250] },
  
  // 棕色系
  { id: '38', name: '棕色', hex: '#8B4513', rgb: [139, 69, 19] },
  { id: '39', name: '深棕', hex: '#654321', rgb: [101, 67, 33] },
  { id: '40', name: '浅棕', hex: '#D2691E', rgb: [210, 105, 30] },
  { id: '41', name: '米色', hex: '#F5F5DC', rgb: [245, 245, 220] },
  { id: '42', name: '驼色', hex: '#C19A6B', rgb: [193, 154, 107] },
  
  // 特殊色
  { id: '43', name: '透明', hex: '#F0F0F0', rgb: [240, 240, 240] },
  { id: '44', name: '珠光白', hex: '#F8F8FF', rgb: [248, 248, 255] },
];

// 计算两个颜色之间的距离（欧氏距离）
export function colorDistance(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number
): number {
  return Math.sqrt(
    Math.pow(r1 - r2, 2) +
    Math.pow(g1 - g2, 2) +
    Math.pow(b1 - b2, 2)
  );
}

// 找到最接近的魔珠颜色
export function findClosestBeadColor(r: number, g: number, b: number): BeadColor {
  let closestColor = BEAD_COLORS[0];
  let minDistance = Infinity;

  for (const beadColor of BEAD_COLORS) {
    const distance = colorDistance(r, g, b, ...beadColor.rgb);
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = beadColor;
    }
  }

  return closestColor;
}

// 获取颜色的字符串标识（用于统计）
export function getColorKey(r: number, g: number, b: number): string {
  return `rgb(${r},${g},${b})`;
}
