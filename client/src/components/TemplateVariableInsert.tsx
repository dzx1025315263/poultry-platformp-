import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Braces, Building2, User, Eye } from "lucide-react";
import {
  EMAIL_TEMPLATE_VARIABLES,
  getVariablesByGroup,
  replaceTemplateVariables,
  getSampleContext,
  detectUsedVariables,
  type TemplateVariable,
  type TemplateContext,
} from "@shared/emailTemplateVars";

interface TemplateVariableInsertProps {
  /** 当前文本值 */
  value: string;
  /** 插入变量后的回调 */
  onInsert: (newValue: string) => void;
  /** 可选：用于预览的实际数据上下文 */
  previewContext?: TemplateContext;
  /** 按钮大小 */
  size?: "sm" | "default";
  /** 是否显示预览按钮 */
  showPreview?: boolean;
}

/**
 * 模板变量插入组件
 * 
 * 提供一个弹出面板，用户可以点击变量快速插入到文本中。
 * 同时支持预览功能，展示变量替换后的效果。
 */
export default function TemplateVariableInsert({
  value,
  onInsert,
  previewContext,
  size = "sm",
  showPreview = true,
}: TemplateVariableInsertProps) {
  const [open, setOpen] = useState(false);
  const [showPreviewPanel, setShowPreviewPanel] = useState(false);

  const groups = getVariablesByGroup();
  const usedVars = detectUsedVariables(value);

  const handleInsertVariable = (variable: TemplateVariable) => {
    onInsert(value + variable.placeholder);
    // 不关闭弹窗，方便连续插入
  };

  // 使用实际数据或示例数据进行预览
  const previewCtx = previewContext || getSampleContext();
  const previewText = replaceTemplateVariables(value, previewCtx);

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size={size}
            className="gap-1 text-xs h-7 px-2"
          >
            <Braces className="h-3 w-3" />
            插入变量
            {usedVars.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1">
                {usedVars.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <div className="p-3 border-b">
            <p className="text-sm font-medium">插入模板变量</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              点击变量标签插入到文本末尾
            </p>
          </div>
          <Tabs defaultValue="company" className="w-full">
            <TabsList className="w-full grid grid-cols-2 h-8 rounded-none">
              <TabsTrigger value="company" className="text-xs gap-1 h-7">
                <Building2 className="h-3 w-3" />
                企业信息
              </TabsTrigger>
              <TabsTrigger value="contact" className="text-xs gap-1 h-7">
                <User className="h-3 w-3" />
                联系人
              </TabsTrigger>
            </TabsList>
            {groups.map((group) => (
              <TabsContent
                key={group.group}
                value={group.group}
                className="p-2 mt-0"
              >
                <div className="flex flex-wrap gap-1.5">
                  {group.variables.map((v) => {
                    const isUsed = usedVars.some((u) => u.key === v.key);
                    return (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => handleInsertVariable(v)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs border transition-colors cursor-pointer ${
                          isUsed
                            ? "bg-primary/10 border-primary/30 text-primary"
                            : "bg-muted/50 border-border hover:bg-muted hover:border-primary/30"
                        }`}
                        title={v.description}
                      >
                        <Braces className="h-2.5 w-2.5 opacity-50" />
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
          {usedVars.length > 0 && (
            <div className="p-2 border-t bg-muted/30">
              <p className="text-[10px] text-muted-foreground">
                已使用 {usedVars.length} 个变量：
                {usedVars.map((v) => v.placeholder).join(" ")}
              </p>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {showPreview && usedVars.length > 0 && (
        <Popover open={showPreviewPanel} onOpenChange={setShowPreviewPanel}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size={size}
              className="gap-1 text-xs h-7 px-2"
            >
              <Eye className="h-3 w-3" />
              预览
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <div className="p-3 border-b">
              <p className="text-sm font-medium flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                变量替换预览
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {previewContext ? "使用实际企业/联系人数据" : "使用示例数据预览"}
              </p>
            </div>
            <div className="p-3 space-y-2">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">原始模板：</p>
                <div className="text-xs bg-muted/50 p-2 rounded border whitespace-pre-wrap break-all max-h-24 overflow-y-auto">
                  {value || <span className="text-muted-foreground italic">（空）</span>}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">替换后效果：</p>
                <div className="text-xs bg-green-50 dark:bg-green-950/30 p-2 rounded border border-green-200 dark:border-green-800 whitespace-pre-wrap break-all max-h-24 overflow-y-auto">
                  {previewText || <span className="text-muted-foreground italic">（空）</span>}
                </div>
              </div>
              {!previewContext && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400">
                  当前使用示例数据预览，实际发送时将使用真实企业/联系人数据
                </p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

/**
 * 简化版变量标签列表（用于内联展示）
 */
export function VariableTagList({ onInsert }: { onInsert: (placeholder: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {EMAIL_TEMPLATE_VARIABLES.map((v) => (
        <button
          key={v.key}
          type="button"
          onClick={() => onInsert(v.placeholder)}
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-muted/50 border border-border hover:bg-muted hover:border-primary/30 transition-colors cursor-pointer"
          title={v.description}
        >
          <Braces className="h-2 w-2 opacity-50" />
          {v.label}
        </button>
      ))}
    </div>
  );
}
