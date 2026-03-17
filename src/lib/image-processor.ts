import { BeadColor, findClosestBeadColor, BEAD_COLORS } from './bead-colors';

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
  gridSize: number
): ProcessResult {
  const { width, height, data } = imageData;
  const beads: ProcessedBead[][] = [];
  const colorStats = new Map<string, { color: BeadColor; count: number }>();

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
        // 如果没有有效像素，使用白色
        originalRgb = [255, 255, 255];
        beadColor = BEAD_COLORS[0]; // 白色
      } else {
        // 计算平均颜色
        const avgR = Math.round(totalR / pixelCount);
        const avgG = Math.round(totalG / pixelCount);
        const avgB = Math.round(totalB / pixelCount);
        
        originalRgb = [avgR, avgG, avgB];
        
        // 找到最接近的魔珠颜色
        beadColor = findClosestBeadColor(avgR, avgG, avgB);
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

// 导出图纸为图片（水雾魔珠样式：圆形珠子 + 点阵网格）
export function exportBeadPattern(
  beads: ProcessedBead[][],
  beadSize: number = 20,
  showGrid: boolean = true,
  showLabels: boolean = true
): HTMLCanvasElement {
  const height = beads.length;
  const width = beads[0]?.length || 0;
  
  if (width === 0 || height === 0) {
    throw new Error('图纸数据无效');
  }

  const canvas = document.createElement('canvas');
  const padding = showLabels ? 50 : 15;
  
  canvas.width = width * beadSize + padding * 2;
  canvas.height = height * beadSize + padding * 2;
  
  const ctx = canvas.getContext('2d')!;
  
  // 白色背景
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 绘制点阵网格（小圆点）
  if (showGrid) {
    ctx.fillStyle = '#E5E5E5';
    for (let y = 0; y <= height; y++) {
      for (let x = 0; x <= width; x++) {
        const px = padding + x * beadSize;
        const py = padding + y * beadSize;
        
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  
  // 绘制标签
  if (showLabels) {
    ctx.fillStyle = '#999999';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 列标签
    for (let x = 0; x < width; x++) {
      if (x % 5 === 0 || x === width - 1) {
        ctx.fillText((x + 1).toString(), padding + x * beadSize + beadSize / 2, padding - 18);
      }
    }
    
    // 行标签
    for (let y = 0; y < height; y++) {
      if (y % 5 === 0 || y === height - 1) {
        ctx.fillText((y + 1).toString(), padding - 18, padding + y * beadSize + beadSize / 2);
      }
    }
  }
  
  // 绘制圆形珠子
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const bead = beads[y][x];
      const cx = padding + x * beadSize + beadSize / 2;
      const cy = padding + y * beadSize + beadSize / 2;
      const radius = (beadSize / 2) - 1.5;
      
      if (radius > 0) {
        // 绘制圆形珠子
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = bead.color.hex;
        ctx.fill();
        
        // 微妙边框
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 0.5;
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
  
  return canvas;
}

// 导出为图片并下载
export function downloadPattern(
  beads: ProcessedBead[][],
  filename: string = 'bead-pattern.png',
  beadSize: number = 20,
  showGrid: boolean = true,
  showLabels: boolean = true
): void {
  const canvas = exportBeadPattern(beads, beadSize, showGrid, showLabels);
  
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
