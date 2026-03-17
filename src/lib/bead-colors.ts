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

// 计算两个颜色之间的距离（加权欧氏距离 - 考虑人眼感知）
// 人眼对绿色最敏感，红色次之，蓝色最不敏感
export function colorDistance(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number
): number {
  // 使用加权欧氏距离，权重基于人眼对不同颜色的敏感度
  const rMean = (r1 + r2) / 2;
  const weightR = 2 + rMean / 256;
  const weightG = 4;
  const weightB = 2 + (255 - rMean) / 256;
  
  return Math.sqrt(
    weightR * Math.pow(r1 - r2, 2) +
    weightG * Math.pow(g1 - g2, 2) +
    weightB * Math.pow(b1 - b2, 2)
  );
}

// RGB转Lab颜色空间（更接近人眼感知）
export function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  // RGB to XYZ
  let rr = r / 255;
  let gg = g / 255;
  let bb = b / 255;
  
  rr = rr > 0.04045 ? Math.pow((rr + 0.055) / 1.055, 2.4) : rr / 12.92;
  gg = gg > 0.04045 ? Math.pow((gg + 0.055) / 1.055, 2.4) : gg / 12.92;
  bb = bb > 0.04045 ? Math.pow((bb + 0.055) / 1.055, 2.4) : bb / 12.92;
  
  rr *= 100;
  gg *= 100;
  bb *= 100;
  
  const x = rr * 0.4124 + gg * 0.3576 + bb * 0.1805;
  const y = rr * 0.2126 + gg * 0.7152 + bb * 0.0722;
  const z = rr * 0.0193 + gg * 0.1192 + bb * 0.9505;
  
  // XYZ to Lab
  const refX = 95.047;
  const refY = 100.000;
  const refZ = 108.883;
  
  let xx = x / refX;
  let yy = y / refY;
  let zz = z / refZ;
  
  xx = xx > 0.008856 ? Math.pow(xx, 1/3) : (7.787 * xx) + 16/116;
  yy = yy > 0.008856 ? Math.pow(yy, 1/3) : (7.787 * yy) + 16/116;
  zz = zz > 0.008856 ? Math.pow(zz, 1/3) : (7.787 * zz) + 16/116;
  
  const L = (116 * yy) - 16;
  const a = 500 * (xx - yy);
  const bLab = 200 * (yy - zz);  // 重命名避免与参数b冲突
  
  return [L, a, bLab];
}

// 计算Lab颜色空间的距离（更准确的颜色感知差异）
export function labDistance(lab1: [number, number, number], lab2: [number, number, number]): number {
  const [L1, a1, b1] = lab1;
  const [L2, a2, b2] = lab2;
  
  // CIE76 色差公式
  return Math.sqrt(
    Math.pow(L1 - L2, 2) +
    Math.pow(a1 - a2, 2) +
    Math.pow(b1 - b2, 2)
  );
}

// CIEDE2000 色差公式（最精确的人眼感知色差）
export function ciede2000(lab1: [number, number, number], lab2: [number, number, number]): number {
  const [L1, a1, b1] = lab1;
  const [L2, a2, b2] = lab2;
  
  const kL = 1, kC = 1, kH = 1;
  
  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const Cmean = (C1 + C2) / 2;
  
  const G = 0.5 * (1 - Math.sqrt(Math.pow(Cmean, 7) / (Math.pow(Cmean, 7) + Math.pow(25, 7))));
  
  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);
  
  const C1p = Math.sqrt(a1p * a1p + b1 * b1);
  const C2p = Math.sqrt(a2p * a2p + b2 * b2);
  
  let h1p = Math.atan2(b1, a1p) * 180 / Math.PI;
  if (h1p < 0) h1p += 360;
  
  let h2p = Math.atan2(b2, a2p) * 180 / Math.PI;
  if (h2p < 0) h2p += 360;
  
  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  
  let dhp: number;
  if (C1p * C2p === 0) {
    dhp = 0;
  } else if (Math.abs(h2p - h1p) <= 180) {
    dhp = h2p - h1p;
  } else if (h2p - h1p > 180) {
    dhp = h2p - h1p - 360;
  } else {
    dhp = h2p - h1p + 360;
  }
  
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(dhp * Math.PI / 360);
  
  const Lpm = (L1 + L2) / 2;
  const Cpm = (C1p + C2p) / 2;
  
  let Hpm: number;
  if (C1p * C2p === 0) {
    Hpm = h1p + h2p;
  } else if (Math.abs(h1p - h2p) <= 180) {
    Hpm = (h1p + h2p) / 2;
  } else if (h1p + h2p < 360) {
    Hpm = (h1p + h2p + 360) / 2;
  } else {
    Hpm = (h1p + h2p - 360) / 2;
  }
  
  const T = 1 - 0.17 * Math.cos((Hpm - 30) * Math.PI / 180)
          + 0.24 * Math.cos(2 * Hpm * Math.PI / 180)
          + 0.32 * Math.cos((3 * Hpm + 6) * Math.PI / 180)
          - 0.20 * Math.cos((4 * Hpm - 63) * Math.PI / 180);
  
  const SL = 1 + 0.015 * Math.pow(Lpm - 50, 2) / Math.sqrt(20 + Math.pow(Lpm - 50, 2));
  const SC = 1 + 0.045 * Cpm;
  const SH = 1 + 0.015 * Cpm * T;
  
  const dTheta = 30 * Math.exp(-Math.pow((Hpm - 275) / 25, 2));
  const RC = 2 * Math.sqrt(Math.pow(Cpm, 7) / (Math.pow(Cpm, 7) + Math.pow(25, 7)));
  const RT = -RC * Math.sin(2 * dTheta * Math.PI / 180);
  
  const dE = Math.sqrt(
    Math.pow(dLp / (kL * SL), 2) +
    Math.pow(dCp / (kC * SC), 2) +
    Math.pow(dHp / (kH * SH), 2) +
    RT * (dCp / (kC * SC)) * (dHp / (kH * SH))
  );
  
  return dE;
}

// 在指定颜色集中找到最接近的魔珠颜色（使用CIEDE2000）
export function findClosestBeadColor(
  r: number, 
  g: number, 
  b: number, 
  colors: BeadColor[] = DEFAULT_COLORS
): BeadColor {
  let closestColor = colors[0];
  let minDistance = Infinity;

  // 将目标颜色转换为Lab
  const targetLab = rgbToLab(r, g, b);
  
  // 判断目标颜色的主要特征
  const brightness = (r + g + b) / 3;
  const maxChannel = Math.max(r, g, b);
  const minChannel = Math.min(r, g, b);
  const saturation = maxChannel === 0 ? 0 : (maxChannel - minChannel) / maxChannel;

  for (const beadColor of colors) {
    // 将珠子颜色转换为Lab
    const beadLab = rgbToLab(...beadColor.rgb);
    
    // 使用CIEDE2000计算色差
    let distance = ciede2000(targetLab, beadLab);
    
    // 特殊处理：黑色和白色
    // 如果目标颜色非常暗（接近黑色），增加非黑色候选的距离
    if (brightness < 30 && beadColor.rgb[0] + beadColor.rgb[1] + beadColor.rgb[2] > 100) {
      distance *= 1.5;
    }
    // 如果目标颜色非常亮（接近白色），增加非白色候选的距离
    if (brightness > 230 && beadColor.rgb[0] + beadColor.rgb[1] + beadColor.rgb[2] < 650) {
      distance *= 1.3;
    }
    
    // 特殊处理：高饱和度颜色
    // 如果目标颜色饱和度高，优先选择同样高饱和度的珠子
    if (saturation > 0.5) {
      const beadMax = Math.max(...beadColor.rgb);
      const beadMin = Math.min(...beadColor.rgb);
      const beadSat = beadMax === 0 ? 0 : (beadMax - beadMin) / beadMax;
      // 如果珠子颜色饱和度低，增加距离
      if (beadSat < 0.3) {
        distance *= 1.2;
      }
    }
    
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
