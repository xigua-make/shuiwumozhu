import { BeadColor, findClosestBeadColor, DEFAULT_COLORS, ColorCategory, getColorsByCategories } from './bead-colors';

export interface ProcessedBead {
  color: BeadColor;
  originalRgb: [number, number, number];
}

export interface ProcessResult {
  beads: ProcessedBead[][];
  width: number;
  height: number;
  colorStats: Map<string, { color: BeadColor; count: number }>;
}

// 将图片处理成魔珠图纸
export function processImageToBeads(
  imageData: ImageData,
  gridSize: number,
  colorCategories: ColorCategory[] = ['normal']
): ProcessResult {
  const { width, height, data } = imageData;
  const beads: ProcessedBead[][] = [];
  const colorStats = new Map<string, { color: BeadColor; count: number }>();
  
  // 获取选定的颜色集
  const availableColors = getColorsByCategories(colorCategories);
  const defaultColor = availableColors.find(c => c.name === '奶白色') || availableColors[0];

  // 计算每个网格单元的大小
  const cellWidth = Math.max(1, Math.floor(width / gridSize));
  const cellHeight = Math.max(1, Math.floor(height / gridSize));

  const gridHeight = Math.floor(height / cellHeight);
  const gridWidth = Math.floor(width / cellWidth);

  // 遍历每个网格单元
  for (let gy = 0; gy < gridHeight; gy++) {
    const row: ProcessedBead[] = [];
    
    for (let gx = 0; gx < gridWidth; gx++) {
      // 计算该网格单元的平均颜色
      const startX = gx * cellWidth;
      const startY = gy * cellHeight;
      
      let totalR = 0, totalG = 0, totalB = 0, totalA = 0;
      let pixelCount = 0;

      // 遍历网格内的所有像素
      for (let y = startY; y < startY + cellHeight && y < height; y++) {
        for (let x = startX; x < startX + cellWidth && x < width; x++) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          if (a > 128) { // 忽略透明像素
            totalR += r;
            totalG += g;
            totalB += b;
            totalA += a;
            pixelCount++;
          }
        }
      }

      let originalRgb: [number, number, number];
      let beadColor: BeadColor;

      if (pixelCount === 0) {
        // 如果没有有效像素，使用默认颜色
        originalRgb = [255, 255, 255];
        beadColor = defaultColor;
      } else {
        // 计算平均颜色
        const avgR = Math.round(totalR / pixelCount);
        const avgG = Math.round(totalG / pixelCount);
        const avgB = Math.round(totalB / pixelCount);
        
        originalRgb = [avgR, avgG, avgB];
        
        // 在选定颜色集中找到最接近的魔珠颜色
        beadColor = findClosestBeadColor(avgR, avgG, avgB, availableColors);
      }

      row.push({
        color: beadColor,
        originalRgb
      });

      // 统计颜色使用次数
      const colorKey = beadColor.id;
      if (colorStats.has(colorKey)) {
        colorStats.get(colorKey)!.count++;
      } else {
        colorStats.set(colorKey, { color: beadColor, count: 1 });
      }
    }

    beads.push(row);
  }

  return {
    beads,
    width: gridWidth,
    height: gridHeight,
    colorStats
  };
}

// 缩放图片到指定大小
export function resizeImage(
  sourceCanvas: HTMLCanvasElement,
  maxSize: number
): HTMLCanvasElement {
  const { width, height } = sourceCanvas;
  const scale = Math.min(maxSize / width, maxSize / height, 1);
  
  const targetCanvas = document.createElement('canvas');
  targetCanvas.width = Math.round(width * scale);
  targetCanvas.height = Math.round(height * scale);
  
  const ctx = targetCanvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(sourceCanvas, 0, 0, targetCanvas.width, targetCanvas.height);
  
  return targetCanvas;
}

// 加载图片到 Canvas
export function loadImageToCanvas(file: File): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        
        resolve(canvas);
      };
      
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

// 六角板预设（每行珠子数）- 18行
const HEXAGON_PATTERN = [9, 10, 11, 12, 13, 14, 15, 16, 17, 17, 16, 15, 14, 13, 12, 11, 10, 9];
const HEXAGON_MAX_WIDTH = 17;

// 导出图纸为图片（水雾魔珠样式：圆形珠子 + 点阵网格 + 用料统计）
export function exportBeadPattern(
  beads: ProcessedBead[][],
  beadSize: number = 20,
  showGrid: boolean = true,
  showLabels: boolean = true,
  colorStats?: Map<string, { color: BeadColor; count: number }>,
  canvasType: 'rect' | 'hexagon' | 'diagonal' = 'rect'
): HTMLCanvasElement {
  const height = beads.length;
  let width = beads[0]?.length || 0;
  
  if (height === 0) {
    throw new Error('图纸数据无效');
  }

  // 高清导出：使用2倍尺寸
  const scale = 2;
  const actualBeadSize = beadSize * scale;
  // 四周都需要留出坐标空间
  const padding = showLabels ? 40 * scale : 25 * scale;
  
  // 计算画布尺寸
  let canvasWidth = width;
  let canvasHeight = height;
  if (canvasType === 'hexagon') {
    canvasWidth = HEXAGON_MAX_WIDTH;
  }
  // 斜板：偶数列向下偏移半个珠子，需要额外高度
  if (canvasType === 'diagonal') {
    canvasHeight = height + 0.5;
  }
  
  // 计算统计区域高度 - 根据颜色数量自适应
  let statsHeight = 0;
  if (colorStats && colorStats.size > 0) {
    const availableWidth = canvasWidth * actualBeadSize;
    const itemWidth = 140 * scale;
    const cols = Math.max(4, Math.min(10, Math.floor(availableWidth / itemWidth)));
    const rows = Math.ceil(colorStats.size / cols);
    statsHeight = 95 * scale + rows * 36 * scale; // 标题区域 + 每行高度
  }
  
  // 下方坐标需要的额外空间
  const coordSpace = showLabels ? 30 * scale : 0;
  
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth * actualBeadSize + padding * 2;
  canvas.height = canvasHeight * actualBeadSize + padding + coordSpace + statsHeight;
  
  const ctx = canvas.getContext('2d')!;
  
  // 白色背景
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 绘制点阵网格（小圆点）
  if (showGrid) {
    ctx.fillStyle = '#E5E5E5';
    for (let y = 0; y <= height; y++) {
      let rowWidth, offsetX;
      
      if (canvasType === 'hexagon') {
        rowWidth = HEXAGON_PATTERN[y] || 0;
        offsetX = (HEXAGON_MAX_WIDTH - rowWidth) / 2;
      } else {
        rowWidth = width;
        offsetX = 0;
      }
      
      for (let x = 0; x <= rowWidth; x++) {
        const px = padding + x * actualBeadSize;
        // 斜板：偶数列向下偏移半个珠子
        const offsetY = (canvasType === 'diagonal' && x % 2 === 1) ? 0.5 * actualBeadSize : 0;
        const py = padding + y * actualBeadSize + offsetY;
        
        ctx.beginPath();
        ctx.arc(px, py, 2 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  
  // 绘制标签（四周都显示，圆形背景）
  if (showLabels) {
    ctx.font = `bold ${14 * scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (canvasType === 'hexagon') {
      // 六角板标签 - 只在左侧显示行号
      for (let y = 0; y < height; y++) {
        const rowWidth = HEXAGON_PATTERN[y] || 0;
        const lx = padding - 22 * scale;
        const ly = padding + y * actualBeadSize + actualBeadSize / 2;
        ctx.beginPath();
        ctx.arc(lx, ly, 12 * scale, 0, Math.PI * 2);
        ctx.fillStyle = '#E0E0E0';
        ctx.fill();
        ctx.fillStyle = '#333333';
        ctx.fillText((y + 1).toString(), lx, ly);
      }
    } else {
      // 矩形和斜板标签 - 四周都显示
      for (let x = 0; x < width; x++) {
        const offsetY = (canvasType === 'diagonal' && x % 2 === 1) ? 0.5 * actualBeadSize : 0;
        
        // 上方
        const tx = padding + x * actualBeadSize + actualBeadSize / 2;
        const ty = padding - 22 * scale;
        ctx.beginPath();
        ctx.arc(tx, ty, 12 * scale, 0, Math.PI * 2);
        ctx.fillStyle = '#E0E0E0';
        ctx.fill();
        ctx.fillStyle = '#333333';
        ctx.fillText((x + 1).toString(), tx, ty);
        
        // 下方
        const by = padding + height * actualBeadSize + offsetY + 22 * scale;
        ctx.beginPath();
        ctx.arc(tx, by, 12 * scale, 0, Math.PI * 2);
        ctx.fillStyle = '#E0E0E0';
        ctx.fill();
        ctx.fillStyle = '#333333';
        ctx.fillText((x + 1).toString(), tx, by);
      }
      
      for (let y = 0; y < height; y++) {
        // 左侧
        const lx = padding - 22 * scale;
        const ly = padding + y * actualBeadSize + actualBeadSize / 2;
        ctx.beginPath();
        ctx.arc(lx, ly, 12 * scale, 0, Math.PI * 2);
        ctx.fillStyle = '#E0E0E0';
        ctx.fill();
        ctx.fillStyle = '#333333';
        ctx.fillText((y + 1).toString(), lx, ly);
        
        // 右侧
        const rx = padding + width * actualBeadSize + 22 * scale;
        ctx.beginPath();
        ctx.arc(rx, ly, 12 * scale, 0, Math.PI * 2);
        ctx.fillStyle = '#E0E0E0';
        ctx.fill();
        ctx.fillStyle = '#333333';
        ctx.fillText((y + 1).toString(), rx, ly);
      }
    }
  }
  
  // 绘制圆形珠子
  for (let y = 0; y < height; y++) {
    const row = beads[y];
    const rowWidth = row.length;
    let offsetX;
    
    if (canvasType === 'hexagon') {
      offsetX = (HEXAGON_MAX_WIDTH - rowWidth) / 2;
    } else {
      offsetX = 0;
    }
    
    for (let x = 0; x < rowWidth; x++) {
      const bead = row[x];
      const cx = padding + (offsetX + x) * actualBeadSize + actualBeadSize / 2;
      // 斜板：偶数列向下偏移半个珠子
      const offsetY = (canvasType === 'diagonal' && x % 2 === 1) ? 0.5 * actualBeadSize : 0;
      const cy = padding + y * actualBeadSize + actualBeadSize / 2 + offsetY;
      const radius = (actualBeadSize / 2) - 2 * scale;
      
      if (radius > 0) {
        // 绘制圆形珠子
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = bead.color.hex;
        ctx.fill();
        
        // 微妙边框
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = scale;
        ctx.stroke();
        
        // 高光效果
        const gradient = ctx.createRadialGradient(
          cx - radius * 0.3, cy - radius * 0.3, 0,
          cx, cy, radius
        );
        gradient.addColorStop(0, 'rgba(255,255,255,0.4)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0.1)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.05)');
        
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    }
  }

  // 绘制用料统计
  if (colorStats && colorStats.size > 0) {
    // 统计区域起始位置：画布高度 + 下方坐标空间 + padding
    const coordSpace = showLabels ? 30 * scale : 0; // 下方坐标的空间
    const statsY = canvasHeight * actualBeadSize + padding + coordSpace + 25 * scale;
    
    // 分隔线
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = scale;
    ctx.beginPath();
    ctx.moveTo(padding, statsY - 10 * scale);
    ctx.lineTo(canvas.width - padding, statsY - 10 * scale);
    ctx.stroke();
    
    // 标题
    ctx.fillStyle = '#333333';
    ctx.font = `bold ${22 * scale}px Arial`;
    ctx.textAlign = 'left';
    ctx.fillText('用料统计', padding, statsY + 16 * scale);
    
    // 统计总数
    const totalBeads = Array.from(colorStats.values()).reduce((sum, s) => sum + s.count, 0);
    ctx.fillStyle = '#666666';
    ctx.font = `${18 * scale}px Arial`;
    ctx.fillText(`共 ${totalBeads} 颗珠子，${colorStats.size} 种颜色`, padding + 120 * scale, statsY + 16 * scale);
    
    // 颜色列表 - 根据画布宽度自适应列数
    const sortedStats = Array.from(colorStats.values()).sort((a, b) => b.count - a.count);
    const availableWidth = canvas.width - padding * 2;
    const itemWidth = 140 * scale; // 每个颜色项的宽度
    const cols = Math.max(4, Math.min(10, Math.floor(availableWidth / itemWidth))); // 自适应列数，最少4列，最多10列
    const actualColWidth = availableWidth / cols;
    
    sortedStats.forEach((stat, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      const x = padding + col * actualColWidth;
      const y = statsY + 55 * scale + row * 36 * scale;
      
      // 颜色圆点
      ctx.beginPath();
      ctx.arc(x + 12 * scale, y + 10 * scale, 10 * scale, 0, Math.PI * 2);
      ctx.fillStyle = stat.color.hex;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = scale;
      ctx.stroke();
      
      // 名称和数量
      ctx.fillStyle = '#333333';
      ctx.font = `${16 * scale}px Arial`;
      ctx.textAlign = 'left';
      ctx.fillText(`${stat.color.name}×${stat.count}`, x + 28 * scale, y + 14 * scale);
    });
  }
  
  return canvas;
}

// 导出为图片并下载
export function downloadPattern(
  beads: ProcessedBead[][],
  filename: string = 'bead-pattern.png',
  beadSize: number = 20,
  showGrid: boolean = true,
  showLabels: boolean = true,
  colorStats?: Map<string, { color: BeadColor; count: number }>,
  canvasType: 'rect' | 'hexagon' | 'diagonal' = 'rect'
): void {
  const canvas = exportBeadPattern(beads, beadSize, showGrid, showLabels, colorStats, canvasType);
  
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// 复制颜色列表到剪贴板（带统计）
export function copyColorList(
  colorStats: Map<string, { color: BeadColor; count: number }>
): string {
  const sortedStats = Array.from(colorStats.values())
    .sort((a, b) => b.count - a.count);
  
  let text = '水雾魔珠配色清单\n';
  text += '================\n\n';
  
  let totalBeads = 0;
  for (const stat of sortedStats) {
    text += `${stat.color.name}(${stat.color.id}): ${stat.count} 颗\n`;
    totalBeads += stat.count;
  }
  
  text += `\n总计: ${totalBeads} 颗珠子`;
  
  navigator.clipboard.writeText(text);
  return text;
}
