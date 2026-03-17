// 水雾魔珠官方颜色库（48色）
// 分类：普通款24色（默认）、夜光款12色、水晶珠12色

export interface BeadColor {
  id: string;
  name: string;
  hex: string;
  rgb: [number, number, number];
  category: 'normal' | 'glow' | 'crystal';
}

// ==================== 24色糖果珠（普通款）====================
export const NORMAL_COLORS: BeadColor[] = [
  { id: 'N01', name: '深玫红色', hex: '#C41E3A', rgb: [196, 30, 58], category: 'normal' },
  { id: 'N02', name: '浅肉粉色', hex: '#FFC0CB', rgb: [255, 192, 203], category: 'normal' },
  { id: 'N03', name: '浅米黄色', hex: '#F5DEB3', rgb: [245, 222, 179], category: 'normal' },
  { id: 'N04', name: '亮柠檬黄色', hex: '#FFF44F', rgb: [255, 244, 79], category: 'normal' },
  { id: 'N05', name: '天蓝色', hex: '#87CEEB', rgb: [135, 206, 235], category: 'normal' },
  { id: 'N06', name: '湖蓝色', hex: '#00CED1', rgb: [0, 206, 209], category: 'normal' },
  { id: 'N07', name: '宝蓝色', hex: '#4169E1', rgb: [65, 105, 225], category: 'normal' },
  { id: 'N08', name: '纯黑色', hex: '#000000', rgb: [0, 0, 0], category: 'normal' },
  { id: 'N09', name: '奶白色', hex: '#FFFAF0', rgb: [255, 250, 240], category: 'normal' },
  { id: 'N10', name: '银灰混色', hex: '#C0C0C0', rgb: [192, 192, 192], category: 'normal' },
  { id: 'N11', name: '咖灰混色', hex: '#A0826D', rgb: [160, 130, 109], category: 'normal' },
  { id: 'N12', name: '土黄咖色', hex: '#D2B48C', rgb: [210, 180, 140], category: 'normal' },
  { id: 'N13', name: '蒂芙尼蓝', hex: '#40E0D0', rgb: [64, 224, 208], category: 'normal' },
  { id: 'N14', name: '浅果绿色', hex: '#90EE90', rgb: [144, 238, 144], category: 'normal' },
  { id: 'N15', name: '嫩草绿色', hex: '#7CFC00', rgb: [124, 252, 0], category: 'normal' },
  { id: 'N16', name: '深墨绿色', hex: '#006400', rgb: [0, 100, 0], category: 'normal' },
  { id: 'N17', name: '浅粉紫色', hex: '#DDA0DD', rgb: [221, 160, 221], category: 'normal' },
  { id: 'N18', name: '深葡萄紫色', hex: '#4A0E4E', rgb: [74, 14, 78], category: 'normal' },
  { id: 'N19', name: '淡粉紫色', hex: '#E6E6FA', rgb: [230, 230, 250], category: 'normal' },
  { id: 'N20', name: '深棕红色', hex: '#8B4513', rgb: [139, 69, 19], category: 'normal' },
  { id: 'N21', name: '亮橘黄色', hex: '#FF8C00', rgb: [255, 140, 0], category: 'normal' },
  { id: 'N22', name: '鲜橙黄色', hex: '#FFA500', rgb: [255, 165, 0], category: 'normal' },
  { id: 'N23', name: '暖橘黄色', hex: '#E67300', rgb: [230, 115, 0], category: 'normal' },
  { id: 'N24', name: '亮橙红色', hex: '#FF4500', rgb: [255, 69, 0], category: 'normal' },
];

// ==================== 12色夜光珠 ====================
export const GLOW_COLORS: BeadColor[] = [
  { id: 'G01', name: '深紫夜光色', hex: '#6A0DAD', rgb: [106, 13, 173], category: 'glow' },
  { id: 'G02', name: '浅紫夜光色', hex: '#BF80FF', rgb: [191, 128, 255], category: 'glow' },
  { id: 'G03', name: '浅粉夜光色', hex: '#FFB6C1', rgb: [255, 182, 193], category: 'glow' },
  { id: 'G04', name: '橙黄夜光色', hex: '#FFD700', rgb: [255, 215, 0], category: 'glow' },
  { id: 'G05', name: '米白夜光色', hex: '#FFFACD', rgb: [255, 250, 205], category: 'glow' },
  { id: 'G06', name: '浅绿夜光色', hex: '#7FFF00', rgb: [127, 255, 0], category: 'glow' },
  { id: 'G07', name: '暖黄夜光色', hex: '#FFE4B5', rgb: [255, 228, 181], category: 'glow' },
  { id: 'G08', name: '橙红夜光色', hex: '#FF6347', rgb: [255, 99, 71], category: 'glow' },
  { id: 'G09', name: '果绿夜光色', hex: '#32CD32', rgb: [50, 205, 50], category: 'glow' },
  { id: 'G10', name: '浅湖蓝夜光色', hex: '#7FFFD4', rgb: [127, 255, 212], category: 'glow' },
  { id: 'G11', name: '天青蓝夜光色', hex: '#48D1CC', rgb: [72, 209, 204], category: 'glow' },
  { id: 'G12', name: '宝蓝夜光色', hex: '#6495ED', rgb: [100, 149, 237], category: 'glow' },
];

// ==================== 12色水晶珠 ====================
export const CRYSTAL_COLORS: BeadColor[] = [
  { id: 'C01', name: '玫红水晶色', hex: '#FF007F', rgb: [255, 0, 127], category: 'crystal' },
  { id: 'C02', name: '浅紫水晶色', hex: '#DA70D6', rgb: [218, 112, 214], category: 'crystal' },
  { id: 'C03', name: '酒红水晶色', hex: '#722F37', rgb: [114, 47, 55], category: 'crystal' },
  { id: 'C04', name: '纯黑水晶色', hex: '#1C1C1C', rgb: [28, 28, 28], category: 'crystal' },
  { id: 'C05', name: '浅黄水晶色', hex: '#FFFACD', rgb: [255, 250, 205], category: 'crystal' },
  { id: 'C06', name: '橙黄水晶色', hex: '#FFCC00', rgb: [255, 204, 0], category: 'crystal' },
  { id: 'C07', name: '橙棕水晶色', hex: '#CC7722', rgb: [204, 119, 34], category: 'crystal' },
  { id: 'C08', name: '浅橙水晶色', hex: '#FFB07C', rgb: [255, 176, 124], category: 'crystal' },
  { id: 'C09', name: '浅绿水晶色', hex: '#98FB98', rgb: [152, 251, 152], category: 'crystal' },
  { id: 'C10', name: '湖蓝水晶色', hex: '#20B2AA', rgb: [32, 178, 170], category: 'crystal' },
  { id: 'C11', name: '浅蓝水晶色', hex: '#ADD8E6', rgb: [173, 216, 230], category: 'crystal' },
  { id: 'C12', name: '宝蓝水晶色', hex: '#4169E1', rgb: [65, 105, 225], category: 'crystal' },
];

// ==================== 全部颜色 ====================
export const ALL_COLORS: BeadColor[] = [
  ...NORMAL_COLORS,
  ...GLOW_COLORS,
  ...CRYSTAL_COLORS,
];

// 默认使用的颜色（普通款24色）
export const DEFAULT_COLORS = NORMAL_COLORS;

// 向后兼容
export const BEAD_COLORS = DEFAULT_COLORS;

// 颜色类型
export type ColorCategory = 'normal' | 'glow' | 'crystal';

// 获取指定类别的颜色
export function getColorsByCategory(category: ColorCategory): BeadColor[] {
  switch (category) {
    case 'normal':
      return NORMAL_COLORS;
    case 'glow':
      return GLOW_COLORS;
    case 'crystal':
      return CRYSTAL_COLORS;
    default:
      return NORMAL_COLORS;
  }
}

// 获取多个类别的颜色
export function getColorsByCategories(categories: ColorCategory[]): BeadColor[] {
  const colors: BeadColor[] = [];
  for (const cat of categories) {
    colors.push(...getColorsByCategory(cat));
  }
  return colors;
}

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

// 在指定颜色集中找到最接近的魔珠颜色
export function findClosestBeadColor(
  r: number, 
  g: number, 
  b: number, 
  colors: BeadColor[] = DEFAULT_COLORS
): BeadColor {
  let closestColor = colors[0];
  let minDistance = Infinity;

  for (const beadColor of colors) {
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
