'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, Download, Copy, Settings, RotateCcw, ZoomIn, ZoomOut, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ProcessResult, 
  processImageToBeads, 
  loadImageToCanvas, 
  downloadPattern,
  copyColorList,
  resizeImage
} from '@/lib/image-processor';
import { BEAD_COLORS, BeadColor } from '@/lib/bead-colors';

export default function BeadGenerator() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedResult, setProcessedResult] = useState<ProcessResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [gridSize, setGridSize] = useState(30);
  const [maxImageSize, setMaxImageSize] = useState(400);
  const [beadSize, setBeadSize] = useState(15);
  const [showGrid, setShowGrid] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
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
      const result = processImageToBeads(imageData, gridSize);
      
      setProcessedResult(result);
    } catch (error) {
      console.error('图片处理失败:', error);
      alert('图片处理失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  }, [gridSize, maxImageSize]);

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
        const result = processImageToBeads(imageData, gridSize);
        setProcessedResult(result);
        setIsProcessing(false);
      };
      img.src = originalImage;
    } catch (error) {
      console.error('重新处理失败:', error);
      setIsProcessing(false);
    }
  }, [originalImage, gridSize]);

  // 绘制图纸到 Canvas
  useEffect(() => {
    if (!processedResult || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const { beads, width, height } = processedResult;
    
    const padding = showLabels ? 40 : 10;
    canvas.width = width * beadSize + padding * 2;
    canvas.height = height * beadSize + padding * 2;
    
    const ctx = canvas.getContext('2d')!;
    
    // 白色背景
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制标签
    if (showLabels) {
      ctx.fillStyle = '#666666';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // 列标签
      for (let x = 0; x < width; x++) {
        if (x % 5 === 0) {
          ctx.fillText((x + 1).toString(), padding + x * beadSize + beadSize / 2, padding - 15);
        }
      }
      
      // 行标签
      for (let y = 0; y < height; y++) {
        if (y % 5 === 0) {
          ctx.fillText((y + 1).toString(), padding - 15, padding + y * beadSize + beadSize / 2);
        }
      }
    }
    
    // 绘制珠子
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const bead = beads[y][x];
        const px = padding + x * beadSize;
        const py = padding + y * beadSize;
        
        // 填充颜色
        ctx.fillStyle = bead.color.hex;
        ctx.fillRect(px, py, beadSize, beadSize);
        
        // 绘制网格
        if (showGrid && beadSize >= 8) {
          ctx.strokeStyle = '#DDDDDD';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(px, py, beadSize, beadSize);
        }
      }
    }
  }, [processedResult, beadSize, showGrid, showLabels]);

  // 导出图片
  const handleExport = () => {
    if (!processedResult) return;
    downloadPattern(
      processedResult.beads,
      `bead-pattern-${Date.now()}.png`,
      20,
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
    setGridSize(30);
    setMaxImageSize(400);
    setBeadSize(15);
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
                {/* 网格大小 */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="gridSize">图纸尺寸</Label>
                    <Badge variant="secondary">{gridSize} × {gridSize}</Badge>
                  </div>
                  <Slider
                    id="gridSize"
                    min={10}
                    max={80}
                    step={5}
                    value={[gridSize]}
                    onValueChange={([value]) => setGridSize(value)}
                    onValueCommit={() => reprocessImage()}
                  />
                  <p className="text-xs text-gray-500">数值越大，图纸越精细，珠子数量越多</p>
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
                      显示网格
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
                      min={5}
                      max={30}
                      step={1}
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
                            className="w-8 h-8 rounded border shadow-sm"
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
                  
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      <strong>提示：</strong>水雾魔珠（又称拼豆）通过在模板板上排列珠子，然后用熨斗加热制作。
                      选择合适的图片大小，避免图纸过大导致制作困难。
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
