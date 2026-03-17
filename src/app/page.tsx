'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, Download, Copy, Settings, RotateCcw, ZoomIn, ZoomOut, Eye, EyeOff, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ProcessResult, 
  processImageToBeads, 
  loadImageToCanvas, 
  downloadPattern,
  copyColorList,
  resizeImage
} from '@/lib/image-processor';
import { NORMAL_COLORS, GLOW_COLORS, CRYSTAL_COLORS, ColorCategory, BeadColor } from '@/lib/bead-colors';

export default function BeadGenerator() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedResult, setProcessedResult] = useState<ProcessResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [gridSize, setGridSize] = useState(20);
  const [maxImageSize, setMaxImageSize] = useState(300);
  const [beadSize, setBeadSize] = useState(18);
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [colorCategories, setColorCategories] = useState<ColorCategory[]>(['normal']);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 处理图片上传
  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件');
      return;
    }

    try {
      setIsProcessing(true);
      
      // 加载图片
      const canvas = await loadImageToCanvas(file);
      
      // 缩放图片
      const resizedCanvas = resizeImage(canvas, maxImageSize);
      
      // 保存原图预览
      setOriginalImage(resizedCanvas.toDataURL());
      
      // 处理图片
      const ctx = resizedCanvas.getContext('2d')!;
      const imageData = ctx.getImageData(0, 0, resizedCanvas.width, resizedCanvas.height);
      const result = processImageToBeads(imageData, gridSize, colorCategories);
      
      setProcessedResult(result);
    } catch (error) {
      console.error('图片处理失败:', error);
      alert('图片处理失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  }, [gridSize, maxImageSize, colorCategories]);

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
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // 重新处理图片（当参数改变时）
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
        const result = processImageToBeads(imageData, gridSize, colorCategories);
        setProcessedResult(result);
        setIsProcessing(false);
      };
      img.src = originalImage;
    } catch (error) {
      console.error('重新处理失败:', error);
      setIsProcessing(false);
    }
  }, [originalImage, gridSize, colorCategories]);

  // 绘制图纸到 Canvas（水雾魔珠样式：圆形珠子 + 点阵网格）
  useEffect(() => {
    if (!processedResult || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const { beads, width, height } = processedResult;
    
    const padding = showLabels ? 45 : 15;
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
        const radius = (beadSize / 2) - 1.5; // 稍微缩小一点，留出间隙
        
        if (radius > 0) {
          // 绘制圆形珠子
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          
          // 填充颜色
          ctx.fillStyle = bead.color.hex;
          ctx.fill();
          
          // 添加微妙的边框
          ctx.strokeStyle = 'rgba(0,0,0,0.1)';
          ctx.lineWidth = 0.5;
          ctx.stroke();
          
          // 添加高光效果（让珠子更立体）
          const highlightRadius = radius * 0.6;
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
  }, [processedResult, beadSize, showGrid, showLabels]);

  // 导出图片
  const handleExport = () => {
    if (!processedResult) return;
    downloadPattern(
      processedResult.beads,
      `水雾魔珠图纸-${Date.now()}.png`,
      24, // 导出时使用较大的珠子尺寸
      showGrid,
      showLabels
    );
  };

  // 复制配色清单
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
    setGridSize(20);
    setMaxImageSize(300);
    setBeadSize(18);
    setColorCategories(['normal']);
  };

  // 切换颜色类别
  const toggleColorCategory = (category: ColorCategory) => {
    setColorCategories(prev => {
      if (prev.includes(category)) {
        // 至少保留一个类别
        if (prev.length === 1) return prev;
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            水雾魔珠生成器
          </h1>
          <p className="text-gray-600">
            上传图片，自动生成魔珠图纸，享受DIY乐趣
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左侧：上传区和设置 */}
          <div className="lg:col-span-4 space-y-4">
            {/* 图片上传区 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  上传图片
                </CardTitle>
                <CardDescription>
                  支持拖拽上传或点击选择图片
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer
                    ${isDragging 
                      ? 'border-purple-500 bg-purple-50' 
                      : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                    }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  
                  {originalImage ? (
                    <div className="space-y-3">
                      <img 
                        src={originalImage} 
                        alt="原图" 
                        className="max-h-40 mx-auto rounded shadow"
                      />
                      <p className="text-sm text-gray-500">点击更换图片</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
                        <Upload className="w-8 h-8 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-gray-600">拖拽图片到这里</p>
                        <p className="text-sm text-gray-400">或点击选择文件</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 参数设置 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  参数设置
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 珠子颜色类别 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-purple-500" />
                    <Label>珠子类型</Label>
                  </div>
                  <div className="space-y-3">
                    {/* 普通款 */}
                    <div className="flex items-start gap-3 p-3 rounded-lg border bg-white hover:shadow-sm transition-shadow">
                      <Checkbox
                        id="normal"
                        checked={colorCategories.includes('normal')}
                        onCheckedChange={() => toggleColorCategory('normal')}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <Label htmlFor="normal" className="font-medium cursor-pointer">
                          普通款（24色糖果珠）
                        </Label>
                        <p className="text-xs text-gray-500 mt-1">默认推荐，颜色丰富</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {NORMAL_COLORS.slice(0, 12).map(c => (
                            <div key={c.id} className="w-4 h-4 rounded-full border" style={{ backgroundColor: c.hex }} title={c.name} />
                          ))}
                          <span className="text-xs text-gray-400">+12色</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 夜光款 */}
                    <div className="flex items-start gap-3 p-3 rounded-lg border bg-white hover:shadow-sm transition-shadow">
                      <Checkbox
                        id="glow"
                        checked={colorCategories.includes('glow')}
                        onCheckedChange={() => toggleColorCategory('glow')}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <Label htmlFor="glow" className="font-medium cursor-pointer">
                          夜光款（12色）
                        </Label>
                        <p className="text-xs text-gray-500 mt-1">黑暗中会发光</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {GLOW_COLORS.map(c => (
                            <div key={c.id} className="w-4 h-4 rounded-full border" style={{ backgroundColor: c.hex }} title={c.name} />
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* 水晶珠 */}
                    <div className="flex items-start gap-3 p-3 rounded-lg border bg-white hover:shadow-sm transition-shadow">
                      <Checkbox
                        id="crystal"
                        checked={colorCategories.includes('crystal')}
                        onCheckedChange={() => toggleColorCategory('crystal')}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <Label htmlFor="crystal" className="font-medium cursor-pointer">
                          水晶珠（12色）
                        </Label>
                        <p className="text-xs text-gray-500 mt-1">半透明质感</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {CRYSTAL_COLORS.map(c => (
                            <div key={c.id} className="w-4 h-4 rounded-full border" style={{ backgroundColor: c.hex }} title={c.name} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    已选择 {colorCategories.length} 种类型，共 {
                      (colorCategories.includes('normal') ? 24 : 0) +
                      (colorCategories.includes('glow') ? 12 : 0) +
                      (colorCategories.includes('crystal') ? 12 : 0)
                    } 种颜色
                  </p>
                </div>

                <Separator />

                {/* 网格大小 */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="gridSize">图纸尺寸</Label>
                    <Badge variant="secondary">{gridSize} × {gridSize}</Badge>
                  </div>
                  <Slider
                    id="gridSize"
                    min={10}
                    max={50}
                    step={2}
                    value={[gridSize]}
                    onValueChange={([value]) => setGridSize(value)}
                    onValueCommit={() => reprocessImage()}
                  />
                  <p className="text-xs text-gray-500">建议15-25格，适合制作小挂饰</p>
                </div>

                {/* 图片大小限制 */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="maxImageSize">图片大小限制</Label>
                    <Badge variant="secondary">{maxImageSize}px</Badge>
                  </div>
                  <Slider
                    id="maxImageSize"
                    min={200}
                    max={800}
                    step={50}
                    value={[maxImageSize]}
                    onValueChange={([value]) => setMaxImageSize(value)}
                    onValueCommit={() => originalImage && handleFileUpload(fileInputRef.current?.files?.[0] as File)}
                  />
                </div>

                <Separator />

                {/* 显示选项 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showGrid" className="flex items-center gap-2">
                      {showGrid ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      显示点阵网格
                    </Label>
                    <Switch
                      id="showGrid"
                      checked={showGrid}
                      onCheckedChange={setShowGrid}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showLabels" className="flex items-center gap-2">
                      {showLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      显示行列标签
                    </Label>
                    <Switch
                      id="showLabels"
                      checked={showLabels}
                      onCheckedChange={setShowLabels}
                    />
                  </div>
                </div>

                <Separator />

                {/* 珠子显示大小 */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>预览大小</Label>
                    <Badge variant="secondary">{beadSize}px</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <ZoomOut className="w-4 h-4 text-gray-400" />
                    <Slider
                      min={8}
                      max={40}
                      step={2}
                      value={[beadSize]}
                      onValueChange={([value]) => setBeadSize(value)}
                      className="flex-1"
                    />
                    <ZoomIn className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 操作按钮 */}
            {processedResult && (
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-3">
                    <Button onClick={handleExport} className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      导出图纸
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleCopyColors}
                      className="w-full"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      复制清单
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={reprocessImage}
                      className="w-full"
                      disabled={isProcessing}
                    >
                      重新生成
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={handleReset}
                      className="w-full"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      重置
                    </Button>
                  </div>
                  
                  {copiedText && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700">配色清单已复制到剪贴板！</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右侧：图纸预览和统计 */}
          <div className="lg:col-span-8 space-y-4">
            {/* 图纸预览 */}
            <Card className="min-h-[500px]">
              <CardHeader>
                <CardTitle>图纸预览</CardTitle>
                <CardDescription>
                  {processedResult 
                    ? `尺寸: ${processedResult.width} × ${processedResult.height} 格`
                    : '上传图片后显示图纸'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isProcessing ? (
                  <div className="flex items-center justify-center h-[400px]">
                    <div className="text-center space-y-3">
                      <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-gray-500">正在生成图纸...</p>
                    </div>
                  </div>
                ) : processedResult ? (
                  <ScrollArea className="h-[500px] rounded border bg-white">
                    <div className="p-4 inline-block min-w-full">
                      <canvas ref={canvasRef} className="shadow-lg" />
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex items-center justify-center h-[400px] text-gray-400">
                    <div className="text-center space-y-3">
                      <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                        <Upload className="w-10 h-10 text-gray-300" />
                      </div>
                      <p>请先上传图片</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 颜色统计 */}
            {processedResult && (
              <Card>
                <CardHeader>
                  <CardTitle>颜色统计</CardTitle>
                  <CardDescription>
                    共需 {Array.from(processedResult.colorStats.values()).reduce((sum, s) => sum + s.count, 0)} 颗珠子，
                    使用 {processedResult.colorStats.size} 种颜色
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {Array.from(processedResult.colorStats.values())
                      .sort((a, b) => b.count - a.count)
                      .map((stat) => (
                        <div 
                          key={stat.color.id}
                          className="flex items-center gap-2 p-2 rounded-lg border bg-white hover:shadow-md transition-shadow"
                        >
                          <div 
                            className="w-8 h-8 rounded-full border shadow-sm"
                            style={{ backgroundColor: stat.color.hex }}
                            title={stat.color.name}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{stat.color.name}</p>
                            <p className="text-xs text-gray-500">{stat.count} 颗</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 使用说明 */}
            {!processedResult && (
              <Card>
                <CardHeader>
                  <CardTitle>使用说明</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold shrink-0">
                        1
                      </div>
                      <div>
                        <p className="font-medium">上传图片</p>
                        <p className="text-sm text-gray-500">支持 JPG、PNG 等常见格式</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold shrink-0">
                        2
                      </div>
                      <div>
                        <p className="font-medium">调整参数</p>
                        <p className="text-sm text-gray-500">设置合适的图纸尺寸</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold shrink-0">
                        3
                      </div>
                      <div>
                        <p className="font-medium">导出图纸</p>
                        <p className="text-sm text-gray-500">下载图片或复制配色清单</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
                    <p className="text-sm text-cyan-800">
                      <strong>提示：</strong>水雾魔珠通过在模板板上排列珠子，然后<strong>喷水粘合</strong>制作完成。
                      建议选择简单清晰的图片，尺寸控制在15-25格左右，适合制作钥匙扣、小挂饰等。
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
