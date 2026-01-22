"use client";

import { useRef, useState, useEffect } from "react";
import CanvasDraw, { Shape } from "@/app/draw";
import { Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  MousePointer2,
  Circle,
  Square,
  Pencil,
  MoveRight,
  Eraser,
  Minus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type TSelectedTool =
  | "circle"
  | "rect"
  | "pencil"
  | "arrow"
  | "eraser"
  | "line"
  | "select";

interface CanvasRoomProps {
  socket: Socket | null;
  roomId: number;
  existingShapes: Shape[];
}

const tools = [
  { id: "select", label: "Select", icon: MousePointer2, shortcut: "V" },
  { id: "rect", label: "Rectangle", icon: Square, shortcut: "R" },
  { id: "circle", label: "Circle", icon: Circle, shortcut: "O" },
  { id: "line", label: "Line", icon: Minus, shortcut: "L" },
  { id: "arrow", label: "Arrow", icon: MoveRight, shortcut: "A" },
  { id: "pencil", label: "Pencil", icon: Pencil, shortcut: "P" },
  { id: "eraser", label: "Eraser", icon: Eraser, shortcut: "E" },
] as const;

export default function CanvasRoom({
  socket,
  roomId,
  existingShapes,
}: CanvasRoomProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTool, setSelectedTool] = useState<TSelectedTool>("rect");
  const drawInstanceRef = useRef<ReturnType<typeof CanvasDraw> | null>(null);

  // Initialize canvas only once
  useEffect(() => {
    if (canvasRef.current && !drawInstanceRef.current) {
      const canvas = canvasRef.current;
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = width;
      canvas.height = height;

      drawInstanceRef.current = CanvasDraw(
        canvas,
        width,
        height,
        selectedTool,
        socket,
        roomId,
        existingShapes
      );

      const handleResize = () => {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;

        canvas.width = newWidth;
        canvas.height = newHeight;

        if (drawInstanceRef.current?.redraw) {
          drawInstanceRef.current.redraw();
        }
      };

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        if (drawInstanceRef.current?.cleanup) {
          drawInstanceRef.current.cleanup();
          drawInstanceRef.current = null;
        }
      };
    }
  }, []);

  // Update tool when selectedTool changes
  useEffect(() => {
    if (drawInstanceRef.current?.setTool) {
      drawInstanceRef.current.setTool(selectedTool);
    }
  }, [selectedTool]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      const key = e.key.toUpperCase();
      const tool = tools.find((t) => t.shortcut === key);
      if (tool) {
        setSelectedTool(tool.id as TSelectedTool);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleClearCanvas = () => {
    if (drawInstanceRef.current?.clearAll) {
      drawInstanceRef.current.clearAll();
    }
  };

  const getCursor = () => {
    switch (selectedTool) {
      case "select":
        return "default";
      case "eraser":
        return "cell";
      default:
        return "crosshair";
    }
  };

  return (
    <TooltipProvider>
      <div className="fixed inset-0 bg-background overflow-hidden">
        {/* Dot pattern background */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle, hsl(var(--muted-foreground) / 0.3) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />

        {/* Main Toolbar - Centered at top */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center gap-1 bg-card/95 backdrop-blur-xl border border-border rounded-xl p-1.5 shadow-lg">
            {tools.map((tool, index) => {
              const Icon = tool.icon;
              const isSelected = selectedTool === tool.id;

              return (
                <div key={tool.id} className="flex items-center">
                  {index === 1 && (
                    <Separator orientation="vertical" className="mx-1 h-6" />
                  )}
                  {index === 5 && (
                    <Separator orientation="vertical" className="mx-1 h-6" />
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isSelected ? "default" : "ghost"}
                        size="icon"
                        onClick={() =>
                          setSelectedTool(tool.id as TSelectedTool)
                        }
                        className={cn(
                          "h-9 w-9 transition-all duration-200",
                          isSelected &&
                            "bg-primary text-primary-foreground shadow-md"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={8}>
                      <span>{tool.label}</span>
                      <span className="ml-2 text-muted-foreground text-xs">
                        {tool.shortcut}
                      </span>
                    </TooltipContent>
                  </Tooltip>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions - Top Right */}
        <div className="absolute top-20 right-4 z-10">
          <div className="flex items-center gap-2">
            {/* Clear Canvas Button */}
            <div className="flex items-center gap-1 bg-card/95 backdrop-blur-xl border border-border rounded-lg p-1 shadow-lg">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleClearCanvas}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Clear Canvas</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="absolute bottom-4 left-4 z-10">
          <div className="flex items-center gap-2 bg-card/95 backdrop-blur-xl border border-border rounded-lg px-3 py-1.5 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">
                Room: {roomId}
              </span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-xs text-muted-foreground capitalize">
              {selectedTool}
            </span>
          </div>
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{ cursor: getCursor() }}
        />
      </div>
    </TooltipProvider>
  );
}
