import { useRef, useState, useEffect } from "react";
import CanvasDraw, { Shape } from "@/app/draw";
import { Socket } from "socket.io-client";

export type TSelectedTool = 'circle' | 'rect' | 'pencil' | 'arrow' | 'eraser' | 'line' | 'select';


export default function CanvasRoom({ socket, roomId , existingShapes}: { socket: Socket| null, roomId: number , existingShapes: Shape[] }) {


    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [selectedTool, setSelectedTool] = useState<TSelectedTool>('rect');
    const drawInstanceRef = useRef<any>(null);

    // Initialize canvas only once
    useEffect(() => {

        if (canvasRef.current && !drawInstanceRef.current) {
            console.log("hlo hi");
            const canvas = canvasRef.current;

            const width = window.innerWidth;
            const height = window.innerHeight;

            canvas.width = width;
            canvas.height = height;

            console.log(canvas.width, canvas.height)
            drawInstanceRef.current = CanvasDraw(canvas, width, height, selectedTool, socket, roomId ,existingShapes);

            // Handle window resize
            const handleResize = () => {
                const newWidth = window.innerWidth;
                const newHeight = window.innerHeight;

                // Resize canvas (this clears it)
                canvas.width = newWidth;
                canvas.height = newHeight;

                console.log(canvas.width, canvas.height)


                // Redraw shapes
                if (drawInstanceRef.current?.redraw) {
                    drawInstanceRef.current.redraw();
                }
            };

            window.addEventListener('resize', handleResize);

            return () => {
                window.removeEventListener('resize', handleResize);
                if (drawInstanceRef.current?.cleanup) {
                    drawInstanceRef.current.cleanup();
                    drawInstanceRef.current = null;
                }
            };
        }
    }, []); // Empty dependency array - run only once!

    // Update tool when selectedTool changes
    useEffect(() => {
        console.log("selected toool changes")

        if (drawInstanceRef.current?.setTool) {
            drawInstanceRef.current.setTool(selectedTool);
        }
    }, [selectedTool]);


    



    const tools = [
        { id: 'select', label: 'Select', icon: '⬚' },
        { id: 'circle', label: 'Circle', icon: '〇' },
        { id: 'rect', label: 'Rectangle', icon: '□' },
        { id: 'pencil', label: 'Pencil', icon: 'ᝰ' },
        { id: 'arrow', label: 'Arrow', icon: '➝' },
        { id: 'eraser', label: 'Eraser', icon: '🧼' },
        { id: 'line', label: 'Line', icon: '―' },

    ] as const;

    const handleClearCanvas = () => {
        if (drawInstanceRef.current?.clearAll) {
            drawInstanceRef.current.clearAll();
        }
    }

    console.log("i am in canvas Room");

    return (
        <div className="fixed inset-0 bg-black">
            {/* Tools toolbar at top center */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-gray-800 rounded-lg shadow-lg p-2 flex gap-2">
                {tools.map((tool) => (
                    <button
                        key={tool.id}
                        onClick={() => setSelectedTool(tool.id as TSelectedTool)}
                        className={`px-4 py-2 rounded transition-colors ${selectedTool === tool.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        title={tool.label}
                    >
                        <span className="text-xl">{tool.icon}</span>
                    </button>
                ))}
            </div>

            <div className="absolute top-4 right-4 z-10">
                <button
                    onClick={handleClearCanvas}
                    className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors shadow-lg"
                    title="Clear All"
                >
                    <span className="text-xl mr-2">🗑️</span>
                    Clear All
                </button>
            </div>

            <canvas
                ref={canvasRef}
                className="cursor-crosshair"
                style={{
                    cursor: selectedTool === 'select' ? 'pointer' : 'crosshair'
                }}
            />
        </div>
    )
}