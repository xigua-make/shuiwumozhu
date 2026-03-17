'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Upload, Download, Copy, Settings, RotateCcw, ZoomIn, ZoomOut, 
  Paintbrush, Eraser, MousePointer, Replace, ChevronDown, ChevronUp, X, Check, Move, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  ProcessResult, 
  ProcessedBead,
  processImageToBeads, 
  loadImageToCanvas, 
  downloadPattern,
  copyColorList,
  resizeImage
} from '@/lib/image-processor';
import { 
  NORMAL_COLORS, GLOW_COLORS, CRYSTAL_COLORS, 
  ColorCategory, BeadColor, ALL_COLORS, getColorsByCategories 
} from '@/lib/bead-colors';

type EditMode = 'drag' | 'brush' | 'eraser' | 'replace';
type CanvasType = 'rect' | 'hexagon' | 'diagonal';

// 六角板预设（每行珠子数）- 18行
const HEXAGON_PATTERN = [9, 10, 11, 12, 13, 14, 15, 16, 17, 17, 16, 15, 14, 13, 12, 11, 10, 9];
const HEXAGON_MAX_WIDTH = 17;
const HEXAGON_HEIGHT = 18;

export default function BeadGenerator() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedResult, setProcessedResult] = useState<ProcessResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [gridWidth, setGridWidth] = useState(20);
  const [gridHeight, setGridHeight] = useState(20);
  const [canvasType, setCanvasType] = useState<CanvasType>('rect');
  const [maxImageSize, setMaxImageSize] = useState(300);
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [showBackgroundBeads, setShowBackgroundBeads] = useState(true);
  const [isFileDragging, setIsFileDragging] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  // 空白画布对话框
  const [showBlankCanvasDialog, setShowBlankCanvasDialog] = useState(false);
  const [blankCanvasWidth, setBlankCanvasWidth] = useState(20);
  const [blankCanvasHeight, setBlankCanvasHeight] = useState(20);
  
  // 颜色选择相关
  const [selectedColorIds, setSelectedColorIds] = useState<Set<string>>(new Set(NORMAL_COLORS.map(c => c.id)));
  const [expandedCategories, setExpandedCategories] = useState<Set<ColorCategory>>(new Set(['normal']));
  
  // 编辑相关
  const [editMode, setEditMode] = useState<EditMode>('drag');
  const [selectedPaintColor, setSelectedPaintColor] = useState<BeadColor | null>(null);
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isCanvasDragging, setIsCanvasDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  // 替换颜色功能
  const [replaceFromColor, setReplaceFromColor] = useState<BeadColor | null>(null);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 获取当前选中的颜色列表
  const getSelectedColors = useCallback(() => {
    return ALL_COLORS.filter(c => selectedColorIds.has(c.id));
  }, [selectedColorIds]);

  // 处理图片上传
  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件');
      return;
    }

    try {
      setIsProcessing(true);
      
      const canvas = await loadImageToCanvas(file);
      const resizedCanvas = resizeImage(canvas, maxImageSize);
      setOriginalImage(resizedCanvas.toDataURL());
      
      const ctx = resizedCanvas.getContext('2d')!;
      const imageData = ctx.getImageData(0, 0, resizedCanvas.width, resizedCanvas.height);
      
      // 根据选中的颜色获取类别
      const categories = new Set<ColorCategory>();
      selectedColorIds.forEach(id => {
        const color = ALL_COLORS.find(c => c.id === id);
        if (color) categories.add(color.category);
      });
      
      // 使用 gridWidth 和 gridHeight 的平均值作为 gridSize
      const avgGridSize = Math.round((gridWidth + gridHeight) / 2);
      let result = processImageToBeads(imageData, avgGridSize, Array.from(categories));
      
      // 对于六角板，需要裁剪成六角形
      if (canvasType === 'hexagon') {
        const hexBeads: ProcessedBead[][] = [];
        for (let y = 0; y < HEXAGON_HEIGHT; y++) {
          const rowWidth = HEXAGON_PATTERN[y];
          const startOffset = Math.floor((HEXAGON_MAX_WIDTH - rowWidth) / 2);
          const row: ProcessedBead[] = [];
          for (let x = 0; x < rowWidth; x++) {
            if (y < result.beads.length && startOffset + x < result.beads[y].length) {
              row.push(result.beads[y][startOffset + x]);
            } else {
              const defaultColor = ALL_COLORS.find(c => c.name === '奶白色') || ALL_COLORS[0];
              row.push({ color: defaultColor, originalRgb: [255, 255, 255] });
            }
          }
          hexBeads.push(row);
        }
        result.beads = hexBeads;
        result.width = HEXAGON_MAX_WIDTH;
        result.height = HEXAGON_HEIGHT;
      }
      
      // 过滤结果，只使用选中的颜色
      const selectedColors = getSelectedColors();
      result.beads = result.beads.map(row => 
        row.map(bead => {
          // 如果当前颜色不在选中列表中，找最接近的选中颜色
          if (!selectedColorIds.has(bead.color.id)) {
            return {
              ...bead,
              color: findClosestColor(bead.originalRgb, selectedColors)
            };
          }
          return bead;
        })
      );
      
      // 重新统计颜色
      const newColorStats = new Map<string, { color: BeadColor; count: number }>();
      result.beads.forEach(row => {
        row.forEach(bead => {
          const key = bead.color.id;
          if (newColorStats.has(key)) {
            newColorStats.get(key)!.count++;
          } else {
            newColorStats.set(key, { color: bead.color, count: 1 });
          }
        });
      });
      result.colorStats = newColorStats;
      
      setProcessedResult(result);
    } catch (error) {
      console.error('图片处理失败:', error);
      alert('图片处理失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  }, [gridWidth, gridHeight, maxImageSize, selectedColorIds, getSelectedColors, canvasType]);

  // 在选中颜色中找最接近的颜色
  const findClosestColor = (rgb: [number, number, number], colors: BeadColor[]): BeadColor => {
    let closest = colors[0];
    let minDist = Infinity;
    
    for (const color of colors) {
      const dist = Math.sqrt(
        Math.pow(rgb[0] - color.rgb[0], 2) +
        Math.pow(rgb[1] - color.rgb[1], 2) +
        Math.pow(rgb[2] - color.rgb[2], 2)
      );
      if (dist < minDist) {
        minDist = dist;
        closest = color;
      }
    }
    
    return closest;
  };

  // 文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // 拖拽处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsFileDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsFileDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsFileDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // 重新处理图片
  const reprocessImage = useCallback(async () => {
    if (!originalImage) return;
    
    try {
      setIsProcessing(true);
      
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        const categories = new Set<ColorCategory>();
        selectedColorIds.forEach(id => {
          const color = ALL_COLORS.find(c => c.id === id);
          if (color) categories.add(color.category);
        });
        
        // 使用 gridWidth 和 gridHeight 的平均值作为 gridSize
        const avgGridSize = Math.round((gridWidth + gridHeight) / 2);
        let result = processImageToBeads(imageData, avgGridSize, Array.from(categories));
        
        // 对于六角板，需要裁剪成六角形
        if (canvasType === 'hexagon') {
          const hexBeads: ProcessedBead[][] = [];
          for (let y = 0; y < HEXAGON_HEIGHT; y++) {
            const rowWidth = HEXAGON_PATTERN[y];
            const startOffset = Math.floor((HEXAGON_MAX_WIDTH - rowWidth) / 2);
            const row: ProcessedBead[] = [];
            for (let x = 0; x < rowWidth; x++) {
              if (y < result.beads.length && startOffset + x < result.beads[y].length) {
                row.push(result.beads[y][startOffset + x]);
              } else {
                const defaultColor = ALL_COLORS.find(c => c.name === '奶白色') || ALL_COLORS[0];
                row.push({ color: defaultColor, originalRgb: [255, 255, 255] });
              }
            }
            hexBeads.push(row);
          }
          result.beads = hexBeads;
          result.width = HEXAGON_MAX_WIDTH;
          result.height = HEXAGON_HEIGHT;
        }
        
        // 过滤结果
        const selectedColors = getSelectedColors();
        result.beads = result.beads.map(row => 
          row.map(bead => {
            if (!selectedColorIds.has(bead.color.id)) {
              return {
                ...bead,
                color: findClosestColor(bead.originalRgb, selectedColors)
              };
            }
            return bead;
          })
        );
        
        const newColorStats = new Map<string, { color: BeadColor; count: number }>();
        result.beads.forEach(row => {
          row.forEach(bead => {
            const key = bead.color.id;
            if (newColorStats.has(key)) {
              newColorStats.get(key)!.count++;
            } else {
              newColorStats.set(key, { color: bead.color, count: 1 });
            }
          });
        });
        result.colorStats = newColorStats;
        
        setProcessedResult(result);
        setIsProcessing(false);
      };
      img.src = originalImage;
    } catch (error) {
      console.error('重新处理失败:', error);
      setIsProcessing(false);
    }
  }, [originalImage, gridWidth, gridHeight, selectedColorIds, getSelectedColors, canvasType]);

  // 创建空白画布
  const createBlankCanvas = useCallback((width: number, height: number, type: CanvasType = 'rect') => {
    setCanvasType(type);
    setOriginalImage(null);
    
    const defaultColor = ALL_COLORS.find(c => c.name === '奶白色') || ALL_COLORS[0];
    const colorStats = new Map<string, { color: BeadColor; count: number }>();
    
    if (type === 'hexagon') {
      // 六角板
      const beads: ProcessedBead[][] = [];
      HEXAGON_PATTERN.forEach(count => {
        const row: ProcessedBead[] = [];
        for (let x = 0; x < count; x++) {
          row.push({
            color: defaultColor,
            originalRgb: [255, 255, 255]
          });
        }
        beads.push(row);
      });
      
      colorStats.set(defaultColor.id, { color: defaultColor, count: HEXAGON_PATTERN.reduce((a, b) => a + b, 0) });
      
      setProcessedResult({
        beads,
        width: HEXAGON_MAX_WIDTH,
        height: HEXAGON_HEIGHT,
        colorStats
      });
      setGridWidth(HEXAGON_MAX_WIDTH);
      setGridHeight(HEXAGON_HEIGHT);
    } else if (type === 'diagonal') {
      // 斜板 - 21x21交错排列（每行偏移半个珠子）
      const beads: ProcessedBead[][] = [];
      for (let y = 0; y < height; y++) {
        const row: ProcessedBead[] = [];
        for (let x = 0; x < width; x++) {
          row.push({
            color: defaultColor,
            originalRgb: [255, 255, 255]
          });
        }
        beads.push(row);
      }
      
      colorStats.set(defaultColor.id, { color: defaultColor, count: width * height });
      
      setProcessedResult({
        beads,
        width,
        height,
        colorStats
      });
      setGridWidth(width);
      setGridHeight(height);
    } else {
      // 矩形画布
      const beads: ProcessedBead[][] = [];
      for (let y = 0; y < height; y++) {
        const row: ProcessedBead[] = [];
        for (let x = 0; x < width; x++) {
          row.push({
            color: defaultColor,
            originalRgb: [255, 255, 255]
          });
        }
        beads.push(row);
      }
      
      colorStats.set(defaultColor.id, { color: defaultColor, count: width * height });
      
      setProcessedResult({
        beads,
        width,
        height,
        colorStats
      });
      setGridWidth(width);
      setGridHeight(height);
    }
    
    setEditMode('brush');
    setSelectedPaintColor(defaultColor);
    setCanvasZoom(1);
    setCanvasOffset({ x: 0, y: 0 });
  }, []);

  // 应用预设 - 设置参数并清空当前结果
  const applyPreset = useCallback((preset: 'hexagon' | 'small-square' | 'large-square' | 'diagonal') => {
    // 清空当前结果
    setProcessedResult(null);
    setOriginalImage(null);
    
    switch (preset) {
      case 'hexagon':
        // 六角板需要创建空白画布，因为它的结构特殊
        createBlankCanvas(HEXAGON_MAX_WIDTH, HEXAGON_HEIGHT, 'hexagon');
        break;
      case 'small-square':
        setCanvasType('rect');
        setGridWidth(16);
        setGridHeight(16);
        break;
      case 'large-square':
        setCanvasType('rect');
        setGridWidth(21);
        setGridHeight(21);
        break;
      case 'diagonal':
        setCanvasType('diagonal');
        setGridWidth(21);
        setGridHeight(21);
        break;
    }
  }, [createBlankCanvas]);

  // 颜色类别展开/收起
  const toggleCategoryExpand = (category: ColorCategory) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // 选择/取消选择某个颜色
  const toggleColorSelection = (colorId: string) => {
    setSelectedColorIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(colorId)) {
        if (newSet.size > 1) {
          newSet.delete(colorId);
        }
      } else {
        newSet.add(colorId);
      }
      return newSet;
    });
  };

  // 选择/取消选择整个类别
  const toggleCategorySelection = (category: ColorCategory) => {
    const categoryColors = category === 'normal' ? NORMAL_COLORS 
      : category === 'glow' ? GLOW_COLORS 
      : CRYSTAL_COLORS;
    
    setSelectedColorIds(prev => {
      const newSet = new Set(prev);
      const allSelected = categoryColors.every(c => newSet.has(c.id));
      
      if (allSelected) {
        // 取消选择该类别所有颜色（至少保留一个）
        const otherColorsCount = prev.size - categoryColors.length;
        if (otherColorsCount > 0) {
          categoryColors.forEach(c => newSet.delete(c.id));
        }
      } else {
        // 选择该类别所有颜色
        categoryColors.forEach(c => newSet.add(c.id));
      }
      
      return newSet;
    });
  };

  // 绘制图纸到 Canvas
  useEffect(() => {
    if (!processedResult || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const { beads, width, height } = processedResult;
    const beadSize = 18 * canvasZoom;
    
    const padding = showCoordinates ? 45 : 15;
    
    // 对于六角板和斜板，宽度取最大值
    let canvasWidth = width;
    if (canvasType === 'hexagon') {
      canvasWidth = HEXAGON_MAX_WIDTH;
    } else if (canvasType === 'diagonal') {
      // 斜板需要额外半个珠子的宽度
      canvasWidth = width + 0.5;
    }
    
    canvas.width = canvasWidth * beadSize + padding * 2;
    canvas.height = height * beadSize + padding * 2;
    
    const ctx = canvas.getContext('2d')!;
    
    // 白色背景
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制点阵网格
    if (showGrid) {
      ctx.fillStyle = '#E5E5E5';
      for (let y = 0; y <= height; y++) {
        let rowWidth, offsetX;
        
        if (canvasType === 'hexagon') {
          rowWidth = HEXAGON_PATTERN[y] || 0;
          offsetX = (HEXAGON_MAX_WIDTH - rowWidth) / 2;
        } else if (canvasType === 'diagonal') {
          rowWidth = width;
          // 奇数行偏移半个珠子
          offsetX = (y % 2 === 0) ? 0.5 : 0;
        } else {
          rowWidth = width;
          offsetX = 0;
        }
        
        for (let x = 0; x <= rowWidth; x++) {
          const px = padding + (offsetX + x) * beadSize;
          const py = padding + y * beadSize;
          ctx.beginPath();
          ctx.arc(px, py, 1.5 * canvasZoom, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    
    // 绘制坐标标签（每行每列都显示）
    if (showCoordinates) {
      ctx.fillStyle = '#666666';
      ctx.font = `${11 * canvasZoom}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      if (canvasType === 'hexagon') {
        // 六角板标签 - 显示行号
        for (let y = 0; y < height; y++) {
          ctx.fillText((y + 1).toString(), padding - 18 * canvasZoom, padding + y * beadSize + beadSize / 2);
        }
      } else {
        // 矩形和斜板标签 - 每行每列都显示
        for (let x = 0; x < width; x++) {
          ctx.fillText((x + 1).toString(), padding + x * beadSize + beadSize / 2, padding - 18 * canvasZoom);
        }
        
        for (let y = 0; y < height; y++) {
          ctx.fillText((y + 1).toString(), padding - 18 * canvasZoom, padding + y * beadSize + beadSize / 2);
        }
      }
    }
    
    // 获取奶白色（背景珠子颜色）
    const defaultColor = ALL_COLORS.find(c => c.name === '奶白色') || ALL_COLORS[0];
    
    // 绘制圆形珠子
    for (let y = 0; y < height; y++) {
      const row = beads[y];
      const rowWidth = row.length;
      let offsetX;
      
      if (canvasType === 'hexagon') {
        offsetX = (HEXAGON_MAX_WIDTH - rowWidth) / 2;
      } else if (canvasType === 'diagonal') {
        // 奇数行偏移半个珠子
        offsetX = (y % 2 === 0) ? 0.5 : 0;
      } else {
        offsetX = 0;
      }
      
      for (let x = 0; x < rowWidth; x++) {
        const bead = row[x];
        
        // 如果不显示背景珠子，且是奶白色，则跳过
        if (!showBackgroundBeads && bead.color.id === defaultColor.id) {
          continue;
        }
        
        const cx = padding + (offsetX + x) * beadSize + beadSize / 2;
        const cy = padding + y * beadSize + beadSize / 2;
        const radius = (beadSize / 2) - 1.5 * canvasZoom;
        
        if (radius > 0) {
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.fillStyle = bead.color.hex;
          ctx.fill();
          
          ctx.strokeStyle = 'rgba(0,0,0,0.1)';
          ctx.lineWidth = 0.5 * canvasZoom;
          ctx.stroke();
          
          // 高光
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
  }, [processedResult, canvasZoom, showGrid, showCoordinates, showBackgroundBeads, canvasType]);

  // Canvas 交互 - 拖拽/画笔/橡皮擦/替换
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!processedResult) return;
    
    if (editMode === 'drag') {
      // 开始拖拽
      setIsCanvasDragging(true);
      setDragStart({ x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y });
      return;
    }
    
    handleCanvasInteraction(e);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!processedResult) return;
    
    if (editMode === 'drag' && isCanvasDragging) {
      // 拖拽中 - 更新偏移
      setCanvasOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
      return;
    }
    
    if (editMode === 'drag') return;
    if (e.buttons !== 1) return; // 只在左键按下时处理
    
    handleCanvasInteraction(e);
  };

  const handleCanvasMouseUp = () => {
    setIsCanvasDragging(false);
  };

  const handleCanvasMouseLeave = () => {
    setIsCanvasDragging(false);
  };

  // 鼠标滚轮缩放
  const handleCanvasWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setCanvasZoom(prev => Math.min(3, Math.max(0.5, prev + delta)));
  };

  const handleCanvasInteraction = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!processedResult || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const beadSize = 18 * canvasZoom;
    const padding = showLabels ? 45 : 15;
    
    // 计算点击位置
    const clickX = (e.clientX - rect.left - padding) / beadSize;
    const y = Math.floor((e.clientY - rect.top - padding) / beadSize);
    
    if (y < 0 || y >= processedResult.height) return;
    
    // 根据画布类型计算行偏移
    const rowWidth = processedResult.beads[y].length;
    let offsetX;
    
    if (canvasType === 'hexagon') {
      offsetX = (HEXAGON_MAX_WIDTH - rowWidth) / 2;
    } else if (canvasType === 'diagonal') {
      // 斜板奇数行偏移半个珠子
      offsetX = (y % 2 === 0) ? 0.5 : 0;
    } else {
      offsetX = 0;
    }
    
    const x = Math.floor(clickX - offsetX);
    
    if (x < 0 || x >= rowWidth) return;
    
    const newResult = { ...processedResult };
    newResult.beads = processedResult.beads.map(row => [...row]);
    newResult.colorStats = new Map(processedResult.colorStats);
    
    if (editMode === 'brush' && selectedPaintColor) {
      // 画笔模式
      const oldColor = newResult.beads[y][x].color;
      if (newResult.colorStats.has(oldColor.id)) {
        const stat = newResult.colorStats.get(oldColor.id)!;
        stat.count--;
        if (stat.count === 0) {
          newResult.colorStats.delete(oldColor.id);
        }
      }
      
      newResult.beads[y][x] = { color: selectedPaintColor, originalRgb: selectedPaintColor.rgb };
      
      if (newResult.colorStats.has(selectedPaintColor.id)) {
        newResult.colorStats.get(selectedPaintColor.id)!.count++;
      } else {
        newResult.colorStats.set(selectedPaintColor.id, { color: selectedPaintColor, count: 1 });
      }
    } else if (editMode === 'eraser') {
      // 橡皮擦模式 - 替换为奶白色
      const whiteColor = ALL_COLORS.find(c => c.name === '奶白色') || ALL_COLORS[0];
      const oldColor = newResult.beads[y][x].color;
      
      if (oldColor.id !== whiteColor.id) {
        if (newResult.colorStats.has(oldColor.id)) {
          const stat = newResult.colorStats.get(oldColor.id)!;
          stat.count--;
          if (stat.count === 0) {
            newResult.colorStats.delete(oldColor.id);
          }
        }
        
        newResult.beads[y][x] = { color: whiteColor, originalRgb: whiteColor.rgb };
        
        if (newResult.colorStats.has(whiteColor.id)) {
          newResult.colorStats.get(whiteColor.id)!.count++;
        } else {
          newResult.colorStats.set(whiteColor.id, { color: whiteColor, count: 1 });
        }
      }
    } else if (editMode === 'replace' && selectedPaintColor) {
      // 批量替换模式 - 单格替换
      const oldColor = newResult.beads[y][x].color;
      if (newResult.colorStats.has(oldColor.id)) {
        const stat = newResult.colorStats.get(oldColor.id)!;
        stat.count--;
        if (stat.count === 0) {
          newResult.colorStats.delete(oldColor.id);
        }
      }
      
      newResult.beads[y][x] = { color: selectedPaintColor, originalRgb: selectedPaintColor.rgb };
      
      if (newResult.colorStats.has(selectedPaintColor.id)) {
        newResult.colorStats.get(selectedPaintColor.id)!.count++;
      } else {
        newResult.colorStats.set(selectedPaintColor.id, { color: selectedPaintColor, count: 1 });
      }
    }
    
    setProcessedResult(newResult);
  };

  // 材料清单颜色替换
  const handleColorReplace = (fromColor: BeadColor) => {
    setReplaceFromColor(fromColor);
    setShowReplaceDialog(true);
  };

  const executeColorReplace = (toColor: BeadColor) => {
    if (!processedResult || !replaceFromColor) return;
    
    const newResult = { ...processedResult };
    newResult.beads = processedResult.beads.map(row => 
      row.map(bead => {
        if (bead.color.id === replaceFromColor.id) {
          return { color: toColor, originalRgb: toColor.rgb };
        }
        return bead;
      })
    );
    
    // 重新统计
    const newColorStats = new Map<string, { color: BeadColor; count: number }>();
    newResult.beads.forEach(row => {
      row.forEach(bead => {
        const key = bead.color.id;
        if (newColorStats.has(key)) {
          newColorStats.get(key)!.count++;
        } else {
          newColorStats.set(key, { color: bead.color, count: 1 });
        }
      });
    });
    newResult.colorStats = newColorStats;
    
    setProcessedResult(newResult);
    setShowReplaceDialog(false);
    setReplaceFromColor(null);
  };

  // 导出
  const handleExport = () => {
    if (!processedResult) return;
    downloadPattern(
      processedResult.beads,
      `水雾魔珠图纸-${Date.now()}.png`,
      32,  // 增大珠子尺寸，配合2倍高清导出
      showGrid,
      showLabels,
      processedResult.colorStats,
      canvasType
    );
  };

  // 复制清单
  const handleCopyColors = () => {
    if (!processedResult) return;
    const text = copyColorList(processedResult.colorStats);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // 重置
  const handleReset = () => {
    setOriginalImage(null);
    setProcessedResult(null);
    setGridWidth(20);
    setGridHeight(20);
    setCanvasType('rect');
    setMaxImageSize(300);
    setSelectedColorIds(new Set(NORMAL_COLORS.map(c => c.id)));
    setEditMode('drag');
    setSelectedPaintColor(null);
    setCanvasZoom(1);
    setCanvasOffset({ x: 0, y: 0 });
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {/* 标题 */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              水雾魔珠生成器
            </h1>
            <p className="text-gray-600">上传图片，自动生成魔珠图纸，支持编辑修改</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* 左侧面板 */}
            <div className="lg:col-span-4 space-y-3">
              {/* 图片上传区 */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Upload className="w-4 h-4" />
                    上传图片
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer
                      ${isCanvasDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400'}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                    {originalImage ? (
                      <img src={originalImage} alt="原图" className="max-h-32 mx-auto rounded shadow" />
                    ) : (
                      <div className="text-gray-400">
                        <Upload className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">拖拽或点击上传</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 颜色选择 */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    珠子颜色
                    <Badge variant="secondary" className="ml-auto">{selectedColorIds.size}色</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {/* 普通款 */}
                  <div className="border rounded-lg">
                    <div 
                      className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleCategoryExpand('normal')}
                    >
                      <div className="flex items-center gap-2">
                        {expandedCategories.has('normal') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <span className="font-medium text-sm">普通款（24色）</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1">
                          {NORMAL_COLORS.slice(0, 6).map(c => (
                            <div key={c.id} className="w-4 h-4 rounded-full border-2 border-white" style={{ backgroundColor: c.hex }} />
                          ))}
                          <div className="w-4 h-4 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[8px]">+18</div>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={NORMAL_COLORS.every(c => selectedColorIds.has(c.id))}
                          onChange={(e) => { e.stopPropagation(); toggleCategorySelection('normal'); }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4"
                        />
                      </div>
                    </div>
                    {expandedCategories.has('normal') && (
                      <div className="grid grid-cols-4 gap-2 p-2 pt-0 border-t">
                        {NORMAL_COLORS.map(c => (
                          <div
                            key={c.id}
                            className={`flex flex-col items-center p-2 rounded cursor-pointer transition-all ${selectedColorIds.has(c.id) ? 'ring-2 ring-purple-500 bg-purple-50' : 'opacity-60 hover:opacity-100 hover:bg-gray-50'}`}
                            onClick={() => toggleColorSelection(c.id)}
                          >
                            <div 
                              className="w-8 h-8 rounded-full border-2 shadow-sm"
                              style={{ backgroundColor: c.hex }}
                            />
                            <span className="text-xs mt-1 text-center leading-tight text-gray-700 font-medium">{c.name.slice(0, 4)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 夜光款 */}
                  <div className="border rounded-lg">
                    <div 
                      className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleCategoryExpand('glow')}
                    >
                      <div className="flex items-center gap-2">
                        {expandedCategories.has('glow') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <span className="font-medium text-sm">夜光款（12色）</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1">
                          {GLOW_COLORS.slice(0, 4).map(c => (
                            <div key={c.id} className="w-4 h-4 rounded-full border-2 border-white" style={{ backgroundColor: c.hex }} />
                          ))}
                        </div>
                        <input 
                          type="checkbox" 
                          checked={GLOW_COLORS.every(c => selectedColorIds.has(c.id))}
                          onChange={(e) => { e.stopPropagation(); toggleCategorySelection('glow'); }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4"
                        />
                      </div>
                    </div>
                    {expandedCategories.has('glow') && (
                      <div className="grid grid-cols-4 gap-2 p-2 pt-0 border-t">
                        {GLOW_COLORS.map(c => (
                          <div
                            key={c.id}
                            className={`flex flex-col items-center p-2 rounded cursor-pointer transition-all ${selectedColorIds.has(c.id) ? 'ring-2 ring-purple-500 bg-purple-50' : 'opacity-60 hover:opacity-100 hover:bg-gray-50'}`}
                            onClick={() => toggleColorSelection(c.id)}
                          >
                            <div 
                              className="w-8 h-8 rounded-full border-2 shadow-sm"
                              style={{ backgroundColor: c.hex }}
                            />
                            <span className="text-xs mt-1 text-center leading-tight text-gray-700 font-medium">{c.name.slice(0, 4)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 水晶珠 */}
                  <div className="border rounded-lg">
                    <div 
                      className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleCategoryExpand('crystal')}
                    >
                      <div className="flex items-center gap-2">
                        {expandedCategories.has('crystal') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <span className="font-medium text-sm">水晶珠（12色）</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1">
                          {CRYSTAL_COLORS.slice(0, 4).map(c => (
                            <div key={c.id} className="w-4 h-4 rounded-full border-2 border-white" style={{ backgroundColor: c.hex }} />
                          ))}
                        </div>
                        <input 
                          type="checkbox" 
                          checked={CRYSTAL_COLORS.every(c => selectedColorIds.has(c.id))}
                          onChange={(e) => { e.stopPropagation(); toggleCategorySelection('crystal'); }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4"
                        />
                      </div>
                    </div>
                    {expandedCategories.has('crystal') && (
                      <div className="grid grid-cols-4 gap-2 p-2 pt-0 border-t">
                        {CRYSTAL_COLORS.map(c => (
                          <div
                            key={c.id}
                            className={`flex flex-col items-center p-2 rounded cursor-pointer transition-all ${selectedColorIds.has(c.id) ? 'ring-2 ring-purple-500 bg-purple-50' : 'opacity-60 hover:opacity-100 hover:bg-gray-50'}`}
                            onClick={() => toggleColorSelection(c.id)}
                          >
                            <div 
                              className="w-8 h-8 rounded-full border-2 shadow-sm"
                              style={{ backgroundColor: c.hex }}
                            />
                            <span className="text-xs mt-1 text-center leading-tight text-gray-700 font-medium">{c.name.slice(0, 4)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 参数设置 */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Settings className="w-4 h-4" />
                    参数设置
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 空白画布按钮 */}
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowBlankCanvasDialog(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />新建空白画布
                  </Button>
                  
                  {/* 画布尺寸预设 */}
                  <div className="space-y-2">
                    <Label className="text-sm">画布尺寸预设</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant={canvasType === 'hexagon' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => applyPreset('hexagon')}
                      >
                        六角板
                      </Button>
                      <Button 
                        variant={canvasType === 'rect' && gridWidth === 16 && gridHeight === 16 ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => applyPreset('small-square')}
                      >
                        小方板
                      </Button>
                      <Button 
                        variant={canvasType === 'rect' && gridWidth === 21 && gridHeight === 21 ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => applyPreset('large-square')}
                      >
                        大方板
                      </Button>
                      <Button 
                        variant={canvasType === 'diagonal' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => applyPreset('diagonal')}
                      >
                        斜板
                      </Button>
                    </div>
                  </div>
                  
                  {/* 图纸尺寸（仅矩形画布可调整） */}
                  {canvasType === 'rect' && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-sm">宽度</Label>
                          <Badge variant="secondary">{gridWidth}</Badge>
                        </div>
                        <Slider
                          min={5} max={200} step={1}
                          value={[gridWidth]}
                          onValueChange={([value]) => setGridWidth(value)}
                          onValueCommit={() => reprocessImage()}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-sm">高度</Label>
                          <Badge variant="secondary">{gridHeight}</Badge>
                        </div>
                        <Slider
                          min={5} max={200} step={1}
                          value={[gridHeight]}
                          onValueChange={([value]) => setGridHeight(value)}
                          onValueCommit={() => reprocessImage()}
                        />
                      </div>
                      <p className="text-xs text-gray-500">当前尺寸: {gridWidth} × {gridHeight}</p>
                    </div>
                  )}
                  
                  {canvasType === 'hexagon' && (
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-700">六角板: {HEXAGON_PATTERN.reduce((a, b) => a + b, 0)}颗珠子（{HEXAGON_HEIGHT}行）</p>
                    </div>
                  )}
                  
                  {canvasType === 'diagonal' && (
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">斜板: {gridWidth}×{gridHeight} = {gridWidth * gridHeight}颗珠子（交错排列）</p>
                    </div>
                  )}
                  
                  {/* 显示选项 */}
                  <div className="space-y-3">
                    <Label className="text-sm">显示选项</Label>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">显示坐标</span>
                        <input 
                          type="checkbox" 
                          checked={showCoordinates}
                          onChange={(e) => setShowCoordinates(e.target.checked)}
                          className="w-4 h-4"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">显示网格</span>
                        <input 
                          type="checkbox" 
                          checked={showGrid}
                          onChange={(e) => setShowGrid(e.target.checked)}
                          className="w-4 h-4"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">显示珠子</span>
                        <input 
                          type="checkbox" 
                          checked={showBackgroundBeads}
                          onChange={(e) => setShowBackgroundBeads(e.target.checked)}
                          className="w-4 h-4"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">关闭"显示珠子"将隐藏未上色的珠子</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm">图片大小限制</Label>
                      <Badge variant="secondary">{maxImageSize}px</Badge>
                    </div>
                    <Slider
                      min={200} max={1000} step={50}
                      value={[maxImageSize]}
                      onValueChange={([value]) => setMaxImageSize(value)}
                      onValueCommit={() => originalImage && handleFileUpload(fileInputRef.current?.files?.[0] as File)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 操作按钮 */}
              {processedResult && (
                <Card>
                  <CardContent className="pt-4 grid grid-cols-2 gap-2">
                    <Button onClick={handleExport} size="sm"><Download className="w-4 h-4 mr-1" />导出</Button>
                    <Button variant="outline" onClick={handleCopyColors} size="sm"><Copy className="w-4 h-4 mr-1" />复制清单</Button>
                    <Button variant="outline" onClick={reprocessImage} size="sm" disabled={isProcessing}>重新生成</Button>
                    <Button variant="ghost" onClick={handleReset} size="sm"><RotateCcw className="w-4 h-4 mr-1" />重置</Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* 右侧：图纸区域 */}
            <div className="lg:col-span-8 space-y-3">
              {/* 编辑工具栏 */}
              {processedResult && (
                <Card>
                  <CardContent className="py-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1 border-r pr-2">
                        <Button
                          variant={editMode === 'drag' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setEditMode('drag')}
                        >
                          <Move className="w-4 h-4 mr-1" />拖拽
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-1 border-r pr-2">
                        <Button
                          variant={editMode === 'brush' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => { setEditMode('brush'); setSelectedPaintColor(selectedPaintColor || ALL_COLORS[0]); }}
                        >
                          <Paintbrush className="w-4 h-4 mr-1" />画笔
                        </Button>
                        <Button
                          variant={editMode === 'eraser' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setEditMode('eraser')}
                        >
                          <Eraser className="w-4 h-4 mr-1" />橡皮
                        </Button>
                        <Button
                          variant={editMode === 'replace' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => { setEditMode('replace'); setSelectedPaintColor(selectedPaintColor || ALL_COLORS[0]); }}
                        >
                          <Replace className="w-4 h-4 mr-1" />替换
                        </Button>
                      </div>
                      
                      {(editMode === 'brush' || editMode === 'replace') && (
                        <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1">
                              {selectedPaintColor ? (
                                <>
                                  <div
                                    className="w-4 h-4 rounded-full border"
                                    style={{ backgroundColor: selectedPaintColor.hex }}
                                  />
                                  <span className="text-xs">{selectedPaintColor.name.slice(0, 3)}</span>
                                </>
                              ) : (
                                <span className="text-xs">选择颜色</span>
                              )}
                              <ChevronDown className="w-3 h-3" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[420px] p-3" align="start">
                            <div className="space-y-3 max-h-[450px] overflow-y-auto">
                              {/* 普通款 */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 px-1">
                                  <span className="text-sm font-medium text-gray-700">普通款（24色）</span>
                                  <div className="flex-1 h-px bg-gray-200" />
                                </div>
                                <div className="grid grid-cols-6 gap-2">
                                  {NORMAL_COLORS.map(c => (
                                    <Tooltip key={c.id}>
                                      <TooltipTrigger>
                                        <div
                                          className={`flex flex-col items-center p-1.5 rounded cursor-pointer ${selectedPaintColor?.id === c.id ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:bg-gray-100'}`}
                                          onClick={() => { setSelectedPaintColor(c); setShowColorPicker(false); }}
                                        >
                                          <div
                                            className="w-9 h-9 rounded-full border-2 shadow-sm"
                                            style={{ backgroundColor: c.hex }}
                                          />
                                          <span className="text-xs text-gray-600 leading-tight font-medium mt-0.5">{c.name.slice(0, 3)}</span>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">
                                        <p>{c.name}</p>
                                        <p className="text-xs text-gray-400">{c.hex}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  ))}
                                </div>
                              </div>
                              
                              {/* 夜光款 */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 px-1">
                                  <span className="text-sm font-medium text-gray-700">夜光款（12色）</span>
                                  <div className="flex-1 h-px bg-gray-200" />
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                  {GLOW_COLORS.map(c => (
                                    <Tooltip key={c.id}>
                                      <TooltipTrigger>
                                        <div
                                          className={`flex flex-col items-center p-1.5 rounded cursor-pointer ${selectedPaintColor?.id === c.id ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:bg-gray-100'}`}
                                          onClick={() => { setSelectedPaintColor(c); setShowColorPicker(false); }}
                                        >
                                          <div
                                            className="w-9 h-9 rounded-full border-2 shadow-sm"
                                            style={{ backgroundColor: c.hex }}
                                          />
                                          <span className="text-xs text-gray-600 leading-tight font-medium mt-0.5">{c.name.slice(0, 3)}</span>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">
                                        <p>{c.name}</p>
                                        <p className="text-xs text-gray-400">{c.hex}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  ))}
                                </div>
                              </div>
                              
                              {/* 水晶珠 */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 px-1">
                                  <span className="text-sm font-medium text-gray-700">水晶珠（12色）</span>
                                  <div className="flex-1 h-px bg-gray-200" />
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                  {CRYSTAL_COLORS.map(c => (
                                    <Tooltip key={c.id}>
                                      <TooltipTrigger>
                                        <div
                                          className={`flex flex-col items-center p-1.5 rounded cursor-pointer ${selectedPaintColor?.id === c.id ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:bg-gray-100'}`}
                                          onClick={() => { setSelectedPaintColor(c); setShowColorPicker(false); }}
                                        >
                                          <div
                                            className="w-9 h-9 rounded-full border-2 shadow-sm"
                                            style={{ backgroundColor: c.hex }}
                                          />
                                          <span className="text-xs text-gray-600 leading-tight font-medium mt-0.5">{c.name.slice(0, 3)}</span>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">
                                        <p>{c.name}</p>
                                        <p className="text-xs text-gray-400">{c.hex}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                      
                      <div className="flex items-center gap-1 ml-auto">
                        <Tooltip>
                          <TooltipTrigger>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => { setCanvasZoom(1); setCanvasOffset({ x: 0, y: 0 }); }}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>重置视图</TooltipContent>
                        </Tooltip>
                        <Button variant="outline" size="sm" onClick={() => setCanvasZoom(z => Math.max(0.5, z - 0.25))}>
                          <ZoomOut className="w-4 h-4" />
                        </Button>
                        <Badge variant="outline">{Math.round(canvasZoom * 100)}%</Badge>
                        <Button variant="outline" size="sm" onClick={() => setCanvasZoom(z => Math.min(3, z + 0.25))}>
                          <ZoomIn className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 图纸预览 */}
              <Card className="min-h-[400px]">
                <CardContent className="p-4">
                  {isProcessing ? (
                    <div className="flex items-center justify-center h-[350px]">
                      <div className="text-center">
                        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-gray-500">处理中...</p>
                      </div>
                    </div>
                  ) : processedResult ? (
                    <ScrollArea className="h-[500px]" ref={containerRef}>
                      <div 
                        className="inline-block min-w-full"
                        style={{ 
                          transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px)`,
                          transition: isCanvasDragging ? 'none' : 'transform 0.1s ease-out'
                        }}
                      >
                        <canvas 
                          ref={canvasRef} 
                          className={`shadow-lg ${editMode === 'drag' ? (isCanvasDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-crosshair'}`}
                          onMouseDown={handleCanvasMouseDown}
                          onMouseMove={handleCanvasMouseMove}
                          onMouseUp={handleCanvasMouseUp}
                          onMouseLeave={handleCanvasMouseLeave}
                          onWheel={handleCanvasWheel}
                        />
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="flex items-center justify-center h-[350px] text-gray-400">
                      <div className="text-center">
                        <Upload className="w-12 h-12 mx-auto mb-2" />
                        <p>请上传图片</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 颜色统计 */}
              {processedResult && (
                <Card>
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm">材料清单（点击可批量替换颜色）</CardTitle>
                    <CardDescription className="text-xs">
                      共 {Array.from(processedResult.colorStats.values()).reduce((sum, s) => sum + s.count, 0)} 颗，
                      {processedResult.colorStats.size} 种颜色
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(processedResult.colorStats.values())
                        .sort((a, b) => b.count - a.count)
                        .map((stat) => (
                          <Tooltip key={stat.color.id}>
                            <TooltipTrigger>
                              <div 
                                className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-white hover:shadow cursor-pointer"
                                onClick={() => handleColorReplace(stat.color)}
                              >
                                <div 
                                  className="w-7 h-7 rounded-full border-2 shrink-0"
                                  style={{ backgroundColor: stat.color.hex }}
                                />
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">{stat.color.name}</span>
                                  <span className="text-xs text-gray-500">{stat.count}颗</span>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs text-gray-400">点击批量替换</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* 空白画布对话框 */}
        {showBlankCanvasDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-[400px]">
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-base">新建空白画布</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowBlankCanvasDialog(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm">宽度</Label>
                      <Badge variant="secondary">{blankCanvasWidth}</Badge>
                    </div>
                    <Slider
                      min={5} max={100} step={1}
                      value={[blankCanvasWidth]}
                      onValueChange={([value]) => setBlankCanvasWidth(value)}
                    />
                    <input
                      type="number"
                      min={5}
                      max={100}
                      value={blankCanvasWidth}
                      onChange={(e) => setBlankCanvasWidth(Math.min(100, Math.max(5, parseInt(e.target.value) || 5)))}
                      className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="输入宽度 (5-100)"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm">高度</Label>
                      <Badge variant="secondary">{blankCanvasHeight}</Badge>
                    </div>
                    <Slider
                      min={5} max={100} step={1}
                      value={[blankCanvasHeight]}
                      onValueChange={([value]) => setBlankCanvasHeight(value)}
                    />
                    <input
                      type="number"
                      min={5}
                      max={100}
                      value={blankCanvasHeight}
                      onChange={(e) => setBlankCanvasHeight(Math.min(100, Math.max(5, parseInt(e.target.value) || 5)))}
                      className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="输入高度 (5-100)"
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-500">总计: {blankCanvasWidth * blankCanvasHeight} 颗珠子</p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowBlankCanvasDialog(false)}
                  >
                    取消
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      createBlankCanvas(blankCanvasWidth, blankCanvasHeight, 'rect');
                      setShowBlankCanvasDialog(false);
                    }}
                  >
                    创建
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 颜色替换对话框 */}
        {showReplaceDialog && replaceFromColor && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-[580px] max-h-[85vh]">
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-base">替换颜色</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowReplaceDialog(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-500 mb-3">
                  将 <span className="inline-flex items-center gap-1">
                    <span className="w-5 h-5 rounded-full border-2" style={{ backgroundColor: replaceFromColor.hex }} />
                    <span className="font-medium">{replaceFromColor.name}</span>
                  </span> 替换为：
                </p>
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {/* 普通款 */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700 px-1">普通款（24色）</div>
                    <div className="grid grid-cols-4 gap-2">
                      {NORMAL_COLORS.map(c => (
                        <Tooltip key={c.id}>
                          <TooltipTrigger>
                            <div
                              className={`flex flex-col items-center p-2 rounded cursor-pointer hover:bg-gray-100`}
                              onClick={() => executeColorReplace(c)}
                            >
                              <div
                                className="w-10 h-10 rounded-full border-2 shadow-sm"
                                style={{ backgroundColor: c.hex }}
                              />
                              <span className="text-xs text-gray-600 font-medium mt-1">{c.name.slice(0, 3)}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{c.name}</p>
                            <p className="text-xs text-gray-400">{c.hex}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                  
                  {/* 夜光款 */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700 px-1">夜光款（12色）</div>
                    <div className="grid grid-cols-4 gap-2">
                      {GLOW_COLORS.map(c => (
                        <Tooltip key={c.id}>
                          <TooltipTrigger>
                            <div
                              className={`flex flex-col items-center p-2 rounded cursor-pointer hover:bg-gray-100`}
                              onClick={() => executeColorReplace(c)}
                            >
                              <div
                                className="w-10 h-10 rounded-full border-2 shadow-sm"
                                style={{ backgroundColor: c.hex }}
                              />
                              <span className="text-xs text-gray-600 font-medium mt-1">{c.name.slice(0, 3)}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{c.name}</p>
                            <p className="text-xs text-gray-400">{c.hex}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                  
                  {/* 水晶珠 */}
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700 px-1">水晶珠（12色）</div>
                    <div className="grid grid-cols-4 gap-2">
                      {CRYSTAL_COLORS.map(c => (
                        <Tooltip key={c.id}>
                          <TooltipTrigger>
                            <div
                              className={`flex flex-col items-center p-2 rounded cursor-pointer hover:bg-gray-100`}
                              onClick={() => executeColorReplace(c)}
                            >
                              <div
                                className="w-10 h-10 rounded-full border-2 shadow-sm"
                                style={{ backgroundColor: c.hex }}
                              />
                              <span className="text-xs text-gray-600 font-medium mt-1">{c.name.slice(0, 3)}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{c.name}</p>
                            <p className="text-xs text-gray-400">{c.hex}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

// 添加缺失的 ChevronRight 图标
function ChevronRight({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}
