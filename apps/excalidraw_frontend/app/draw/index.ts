
// import { TSelectedTool } from "@/components/CanvasRoom";
// import { Socket } from "socket.io-client";

// export type Shape = {
//     type: "rect",
//     x: number,
//     y: number,
//     width: number,
//     height: number
// } | {
//     type: "circle",
//     x: number,
//     y: number,
//     radius: number
// } | {
//     type: "line",
//     x: number,
//     y: number,
//     mx: number,
//     my: number
// } | {
//     type: "arrow",
//     x: number,
//     y: number,
//     mx: number,
//     my: number,
//     l1x: number,
//     l1y: number,
//     l2x: number,
//     l2y: number,
//     header: number
// } | {
//     type: "pencil",
//     points: { x: number, y: number }[]
// }

// function
//     clearCanvas(existingShapes: Shape[], ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, socket: Socket | null, roomId: number) {
//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     existingShapes.forEach((shape) => {
//         ctx.strokeStyle = "rgb(0,0,0)";
//         ctx.lineWidth = 2;

//         if (shape.type === "rect") {
//             ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
//         } else if (shape.type === "line") {
//             ctx.beginPath();
//             ctx.moveTo(shape.x, shape.y);
//             ctx.lineTo(shape.mx, shape.my);
//             ctx.stroke();
//         } else if (shape.type === "arrow") {
//             ctx.beginPath();
//             ctx.moveTo(shape.x, shape.y);
//             ctx.lineTo(shape.mx, shape.my)
//             ctx.stroke();

//             const angle = Math.atan2(shape.my - shape.y, shape.mx - shape.x);
//             const headLength = 15;

//             ctx.beginPath();
//             ctx.moveTo(shape.mx, shape.my);
//             ctx.lineTo(
//                 shape.mx - headLength * Math.cos(angle - Math.PI / 6),
//                 shape.my - headLength * Math.sin(angle - Math.PI / 6)
//             );

//             ctx.moveTo(shape.mx, shape.my);
//             ctx.lineTo(
//                 shape.mx - headLength * Math.cos(angle + Math.PI / 6),
//                 shape.my - headLength * Math.sin(angle + Math.PI / 6)
//             );
//             ctx.stroke();
//         } else if (shape.type === "circle") {
//             ctx.beginPath();
//             ctx.arc(shape.x, shape.y, shape.radius, 0, 360);
//             ctx.stroke();
//         } else if (shape.type === "pencil") {
//             ctx.beginPath();
//             ctx.moveTo(shape.points[0].x, shape.points[0].y);
//             for (let i = 1; i < shape.points.length; i++) {
//                 ctx.lineTo(shape.points[i].x, shape.points[i].y);
//             }
//             ctx.stroke();
//         }
//     });
// }


// export default function CanvasDraw(canvas: HTMLCanvasElement, width: number, height: number, initialTool: TSelectedTool, socket: Socket | null, roomId: number, existingShapes: Shape[], token?: string) {
//     console.log("you are in canvasDraw")

//     const isDummyToken = token === "dummy";
//     const storageKey = `canvas_shapes_${roomId}`;

//     let clicked = false;
//     let startX = 0, startY = 0;
//     let currentTool = initialTool;
//     let coordinates: { x: number, y: number }[] = [];

//     // Dragging state
//     let isDragging = false;
//     let draggedShapeIndex: number | null = null;
//     let dragOffsetX = 0;  // how far from the shape origin we 
//     let dragOffsetY = 0;

//     const ctx = canvas.getContext("2d");
//     if (!ctx) return;

//     // Load shapes from localStorage if dummy token (replace existingShapes)
//     if (isDummyToken && typeof window !== 'undefined') {
//         try {
//             const savedShapes = localStorage.getItem(storageKey);
//             if (savedShapes) {
//                 const parsed = JSON.parse(savedShapes);
//                 if (Array.isArray(parsed) && parsed.length > 0) {
//                     // Replace existingShapes with localStorage data
//                     existingShapes.length = 0;
//                     existingShapes.push(...parsed);
//                 }
//             }
//         } catch (error) {
//             console.error("Error loading shapes from localStorage:", error);
//         }
//     }

//     // Save shapes to localStorage
//     const saveToLocalStorage = () => {
//         if (isDummyToken && typeof window !== 'undefined') {
//             try {
//                 localStorage.setItem(storageKey, JSON.stringify(existingShapes));
//             } catch (error) {
//                 console.error("Error saving shapes to localStorage:", error);
//             }
//         }
//     };

//     if (socket !== null && !isDummyToken) {
//         socket.on("shape:created", (shape: Shape) => {

//             console.log("shape moved");
//             existingShapes.push(shape);
//             clearCanvas(existingShapes, ctx, canvas, socket, roomId);
//         });

//         socket.on("shape:clear", (data) => {

//             existingShapes = [];
//             ctx.clearRect(0, 0, canvas.width, canvas.height);
//             if (isDummyToken) {
//                 saveToLocalStorage();
//             }
//         });


//         socket.on("shape:update", (data) => {
//             existingShapes[data.index] = data.shape;
//             clearCanvas(existingShapes, ctx, canvas, socket, roomId);
//         });

//         socket.on("shape:remove", (data) => {
//             existingShapes.splice((data.idx), 1);
//             clearCanvas(existingShapes, ctx, canvas, socket, roomId);
//         });
//     }





//     // Check if point is inside a shape
//     const isPointInShape = (x: number, y: number, shape: Shape): boolean => {
//         if (shape.type === "rect") {
//             return x >= shape.x && x <= shape.x + shape.width &&
//                 y >= shape.y && y <= shape.y + shape.height;
//         } else if (shape.type === "circle") {
//             const dist = Math.sqrt((x - shape.x) ** 2 + (y - shape.y) ** 2);
//             return dist <= shape.radius;
//         } else if (shape.type === "line") {
//             // Check if point is near the line (within 5 pixels)
//             const dist = distanceToLine(x, y, shape.x, shape.y, shape.mx, shape.my);
//             return dist < 10;
//         } else if (shape.type === "arrow") {
//             const dist = distanceToLine(x, y, shape.x, shape.y, shape.mx, shape.my);
//             return dist < 10;
//         } else if (shape.type === "pencil") {
//             // Check if point is near any line segment
//             for (let i = 0; i < shape.points.length - 1; i++) {
//                 const dist = distanceToLine(
//                     x, y,
//                     shape.points[i].x, shape.points[i].y,
//                     shape.points[i + 1].x, shape.points[i + 1].y
//                 );
//                 if (dist < 10) return true;
//             }
//             return false;
//         }
//         return false;
//     };

//     // Helper: distance from point to line segment
//     const distanceToLine = (px: number, py: number, x1: number, y1: number, x2: number, y2: number): number => {
//         const A = px - x1;
//         const B = py - y1;
//         const C = x2 - x1;
//         const D = y2 - y1;

//         const dot = A * C + B * D;
//         const lenSq = C * C + D * D;
//         let param = -1;
//         if (lenSq != 0) param = dot / lenSq;

//         let xx, yy;

//         if (param < 0) {
//             xx = x1;
//             yy = y1;
//         } else if (param > 1) {
//             xx = x2;
//             yy = y2;
//         } else {
//             xx = x1 + param * C;
//             yy = y1 + param * D;
//         }

//         const dx = px - xx;
//         const dy = py - yy;
//         return Math.sqrt(dx * dx + dy * dy);
//     };

//     const handleMouseDown = (e: MouseEvent) => {

//         console.log("clicked bro");
//         clicked = true;
//         startX = e.clientX;
//         startY = e.clientY;



//         // Check if clicking on existing shape (in reverse order to get top-most)
//         if (currentTool === "eraser") {
//             for (let i = existingShapes.length - 1; i >= 0; i--) {
//                 if (isPointInShape(e.clientX, e.clientY, existingShapes[i])) {
//                     existingShapes.splice(i, 1);
//                     if (socket !== null && !isDummyToken) {
//                         socket.emit("shape:remove", { idx: i, roomId });
//                     }
//                     if (isDummyToken) {
//                         saveToLocalStorage();
//                     }
//                     break;
//                 }
//             }
//         }

//         if (currentTool === "select") {
//             for (let i = existingShapes.length - 1; i >= 0; i--) {
//                 if (isPointInShape(e.clientX, e.clientY, existingShapes[i])) {
//                     isDragging = true;
//                     draggedShapeIndex = i;
//                     const shape = existingShapes[i];

//                     // Calculate offset based on shape type
//                     if (shape.type === "rect") {
//                         dragOffsetX = e.clientX - shape.x;
//                         dragOffsetY = e.clientY - shape.y;
//                     } else if (shape.type === "circle") {
//                         dragOffsetX = e.clientX - shape.x;
//                         dragOffsetY = e.clientY - shape.y;
//                     } else if (shape.type === "line" || shape.type === "arrow") {
//                         dragOffsetX = e.clientX - shape.x;
//                         dragOffsetY = e.clientY - shape.y;
//                     } else if (shape.type === "pencil") {
//                         dragOffsetX = e.clientX - shape.points[0].x;
//                         dragOffsetY = e.clientY - shape.points[0].y;
//                     }
//                     break;
//                 }
//             }
//         }
//     };

//     const handleMouseUp = (e: MouseEvent) => {
//         clicked = false;

//         if (currentTool === "rect") {
//             existingShapes.push({
//                 type: "rect",
//                 x: startX,
//                 y: startY,
//                 width: e.clientX - startX,
//                 height: e.clientY - startY
//             });
//         } else if (currentTool === "line") {
//             existingShapes.push({
//                 type: "line",
//                 x: startX,
//                 y: startY,
//                 mx: e.clientX,
//                 my: e.clientY
//             });
//         } else if (currentTool === "arrow") {
//             if (e.clientX != startX) {
//                 const angle = Math.atan2(e.clientY - startY, e.clientX - startX);
//                 const headLength = 15;

//                 let _l1x = e.clientX - headLength * Math.cos(angle - Math.PI / 6);
//                 let _l1y = e.clientY - headLength * Math.sin(angle - Math.PI / 6);

//                 let _l2x = e.clientX - headLength * Math.cos(angle + Math.PI / 6);
//                 let _l2y = e.clientY - headLength * Math.sin(angle + Math.PI / 6);

//                 existingShapes.push({
//                     type: "arrow",
//                     x: startX,
//                     y: startY,
//                     mx: e.clientX,
//                     my: e.clientY,
//                     l1x: _l1x,
//                     l1y: _l1y,
//                     l2x: _l2x,
//                     l2y: _l2y,
//                     header: 15
//                 })
//             }
//         } else if (currentTool === "circle") {
//             let radius = Math.sqrt((e.clientX - startX) * (e.clientX - startX) + (e.clientY - startY) * (e.clientY - startY));
//             existingShapes.push({
//                 type: "circle",
//                 x: startX,
//                 y: startY,
//                 radius
//             })
//         } else if (currentTool === "pencil") {
//             if (coordinates.length > 0) {
//                 existingShapes.push({
//                     type: "pencil",
//                     points: [...coordinates]
//                 });
//                 coordinates = [];
//             }
//         }


//         if (!isDragging && currentTool != "eraser" && existingShapes.length > 0) {
//             const shape = existingShapes[existingShapes.length - 1];
//             if (socket !== null && !isDummyToken) {
//                 socket.emit("shape:create", {
//                     roomId,
//                     type: shape.type.toUpperCase(),
//                     data: shape,
//                 });
//             }
//             if (isDummyToken) {
//                 saveToLocalStorage();
//             }
//         }

//         isDragging = false;
//         draggedShapeIndex = null;

//         clearCanvas(existingShapes, ctx, canvas, socket, roomId);
//     };

//     const handleMouseMove = (e: MouseEvent) => {
//         console.log("mouse moved")

//         if (clicked) {
//             // Handle dragging
//             if (isDragging && draggedShapeIndex !== null) {
//                 const shape = existingShapes[draggedShapeIndex];
//                 const dx = e.clientX - dragOffsetX;
//                 const dy = e.clientY - dragOffsetY;

//                 if (shape.type === "rect") {
//                     shape.x = dx;
//                     shape.y = dy;
//                 } else if (shape.type === "circle") {
//                     shape.x = dx;
//                     shape.y = dy;
//                 } else if (shape.type === "line") {
//                     const width = shape.mx - shape.x;
//                     const height = shape.my - shape.y;
//                     shape.x = dx;
//                     shape.y = dy;
//                     shape.mx = dx + width;
//                     shape.my = dy + height;
//                 } else if (shape.type === "arrow") {
//                     const width = shape.mx - shape.x;
//                     const height = shape.my - shape.y;
//                     shape.x = dx;
//                     shape.y = dy;
//                     shape.mx = dx + width;
//                     shape.my = dy + height;

//                     // Recalculate arrowhead
//                     const angle = Math.atan2(shape.my - shape.y, shape.mx - shape.x);
//                     const headLength = 15;
//                     shape.l1x = shape.mx - headLength * Math.cos(angle - Math.PI / 6);
//                     shape.l1y = shape.my - headLength * Math.sin(angle - Math.PI / 6);
//                     shape.l2x = shape.mx - headLength * Math.cos(angle + Math.PI / 6);
//                     shape.l2y = shape.my - headLength * Math.sin(angle + Math.PI / 6);
//                 } else if (shape.type === "pencil") {
//                     const offsetX = e.clientX - (shape.points[0].x + dragOffsetX);
//                     const offsetY = e.clientY - (shape.points[0].y + dragOffsetY);
//                     shape.points = shape.points.map(p => ({
//                         x: p.x + offsetX,
//                         y: p.y + offsetY
//                     }));
//                 }

//                 if (socket !== null && !isDummyToken) {
//                     socket.emit("shape:update", {
//                         roomId,
//                         index: draggedShapeIndex,
//                         shape: existingShapes[draggedShapeIndex]
//                     });
//                 }
//                 if (isDummyToken) {
//                     saveToLocalStorage();
//                 }
//                 clearCanvas(existingShapes, ctx, canvas, socket, roomId); // re draw
//                 return;
//             }

//             // Regular drawing
//             clearCanvas(existingShapes, ctx, canvas, socket, roomId);
//             ctx.strokeStyle = "rgb(0,0,0)";
//             ctx.lineWidth = 2;

//             if (currentTool === "line") {
//                 ctx.beginPath();
//                 ctx.moveTo(startX, startY);
//                 ctx.lineTo(e.clientX, e.clientY);
//                 ctx.stroke();
//             } else if (currentTool === "rect") {
//                 ctx.strokeRect(startX, startY, e.clientX - startX, e.clientY - startY);
//             } else if (currentTool === "arrow") {
//                 ctx.beginPath();
//                 ctx.moveTo(startX, startY);
//                 ctx.lineTo(e.clientX, e.clientY);
//                 ctx.stroke();

//                 const angle = Math.atan2(e.clientY - startY, e.clientX - startX);
//                 const headLength = 15;

//                 ctx.beginPath();
//                 ctx.moveTo(e.clientX, e.clientY);
//                 ctx.lineTo(
//                     e.clientX - headLength * Math.cos(angle - Math.PI / 6),
//                     e.clientY - headLength * Math.sin(angle - Math.PI / 6)
//                 );

//                 ctx.moveTo(e.clientX, e.clientY);
//                 ctx.lineTo(
//                     e.clientX - headLength * Math.cos(angle + Math.PI / 6),
//                     e.clientY - headLength * Math.sin(angle + Math.PI / 6)
//                 );
//                 ctx.stroke();
//             } else if (currentTool === "circle") {
//                 let radius = Math.sqrt((e.clientX - startX) * (e.clientX - startX) + (e.clientY - startY) * (e.clientY - startY));
//                 ctx.beginPath();
//                 ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
//                 ctx.stroke();
//             } else if (currentTool === "pencil") {
//                 coordinates.push({ x: e.clientX, y: e.clientY });
//                 ctx.beginPath();
//                 ctx.moveTo(coordinates[0].x, coordinates[0].y);
//                 for (let i = 1; i < coordinates.length; i++) {
//                     ctx.lineTo(coordinates[i].x, coordinates[i].y);
//                 }
//                 ctx.stroke();
//             }
//         }
//     };

//     canvas.addEventListener('mousedown', handleMouseDown);
//     canvas.addEventListener('mouseup', handleMouseUp);
//     canvas.addEventListener('mousemove', handleMouseMove);

//     // Draw existing shapes on initialization
//     clearCanvas(existingShapes, ctx, canvas, socket, roomId);

//     return {
//         setTool: (tool: TSelectedTool) => {
//             currentTool = tool;
//         },
//         cleanup: () => {
//             canvas.removeEventListener('mousedown', handleMouseDown);
//             canvas.removeEventListener('mouseup', handleMouseUp);
//             canvas.removeEventListener('mousemove', handleMouseMove);
//         },
//         redraw: () => {
//             clearCanvas(existingShapes, ctx, canvas, socket, roomId);
//         },
//         getShapes: () => existingShapes,
//         clearAll: () => {
//             if (socket != null && !isDummyToken) {
//                 socket.emit("shape:clear", { roomId });
//             }
//             existingShapes = [];
//             ctx.clearRect(0, 0, canvas.width, canvas.height);
//             if (isDummyToken) {
//                 if (typeof window !== 'undefined') {
//                     localStorage.removeItem(storageKey);
//                 }
//             }
//         }
//     };
// }


import { TSelectedTool } from "@/components/CanvasRoom";
import { Socket } from "socket.io-client";

export type Shape = {
    type: "rect",
    x: number,
    y: number,
    width: number,
    height: number
} | {
    type: "circle",
    x: number,
    y: number,
    radius: number
} | {
    type: "line",
    x: number,
    y: number,
    mx: number,
    my: number
} | {
    type: "arrow",
    x: number,
    y: number,
    mx: number,
    my: number,
    l1x: number,
    l1y: number,
    l2x: number,
    l2y: number,
    header: number
} | {
    type: "pencil",
    points: { x: number, y: number }[]
}

function
    clearCanvas(existingShapes: Shape[], ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, socket: Socket | null, roomId: number) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    existingShapes.forEach((shape) => {
        ctx.strokeStyle = "rgb(0,0,0)";
        ctx.lineWidth = 2;

        if (shape.type === "rect") {
            ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        } else if (shape.type === "line") {
            ctx.beginPath();
            ctx.moveTo(shape.x, shape.y);
            ctx.lineTo(shape.mx, shape.my);
            ctx.stroke();
        } else if (shape.type === "arrow") {
            ctx.beginPath();
            ctx.moveTo(shape.x, shape.y);
            ctx.lineTo(shape.mx, shape.my)
            ctx.stroke();

            const angle = Math.atan2(shape.my - shape.y, shape.mx - shape.x);
            const headLength = 15;

            ctx.beginPath();
            ctx.moveTo(shape.mx, shape.my);
            ctx.lineTo(
                shape.mx - headLength * Math.cos(angle - Math.PI / 6),
                shape.my - headLength * Math.sin(angle - Math.PI / 6)
            );

            ctx.moveTo(shape.mx, shape.my);
            ctx.lineTo(
                shape.mx - headLength * Math.cos(angle + Math.PI / 6),
                shape.my - headLength * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
        } else if (shape.type === "circle") {
            ctx.beginPath();
            ctx.arc(shape.x, shape.y, shape.radius, 0, 360);
            ctx.stroke();
        } else if (shape.type === "pencil") {
            ctx.beginPath();
            ctx.moveTo(shape.points[0].x, shape.points[0].y);
            for (let i = 1; i < shape.points.length; i++) {
                ctx.lineTo(shape.points[i].x, shape.points[i].y);
            }
            ctx.stroke();
        }
    });
}


export default function CanvasDraw(canvas: HTMLCanvasElement, width: number, height: number, initialTool: TSelectedTool, socket: Socket | null, roomId: number, existingShapes: Shape[], token?: string) {
    console.log("you are in canvasDraw")

    const isDummyToken = token === "dummy";
    const storageKey = `canvas_shapes_${roomId}`;

    let clicked = false;
    let startX = 0, startY = 0;
    let currentTool = initialTool;
    let coordinates: { x: number, y: number }[] = [];

    // Dragging state
    let isDragging = false;
    let draggedShapeIndex: number | null = null;
    let dragOffsetX = 0;  // how far from the shape origin we 
    let dragOffsetY = 0;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Load shapes from localStorage if dummy token (replace existingShapes)
    if (isDummyToken && typeof window !== 'undefined') {
        try {
            const savedShapes = localStorage.getItem(storageKey);
            if (savedShapes) {
                const parsed = JSON.parse(savedShapes);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    // Replace existingShapes with localStorage data
                    existingShapes.length = 0;
                    existingShapes.push(...parsed);
                }
            }
        } catch (error) {
            console.error("Error loading shapes from localStorage:", error);
        }
    }

    // Save shapes to localStorage
    const saveToLocalStorage = () => {
        if (isDummyToken && typeof window !== 'undefined') {
            try {
                localStorage.setItem(storageKey, JSON.stringify(existingShapes));
            } catch (error) {
                console.error("Error saving shapes to localStorage:", error);
            }
        }
    };

    if (socket !== null && !isDummyToken) {
        socket.on("shape:created", (shape: Shape) => {

            console.log("shape created");
            existingShapes.push(shape);
            clearCanvas(existingShapes, ctx, canvas, socket, roomId);
        });

        socket.on("shape:clear", (data) => {
            existingShapes.length = 0;  // Clear array without losing reference
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (isDummyToken) {
                saveToLocalStorage();
            }
        });


        socket.on("shape:update", (data) => {
            existingShapes[data.index] = data.shape;
            clearCanvas(existingShapes, ctx, canvas, socket, roomId);
        });

        socket.on("shape:remove", (data) => {
            existingShapes.splice((data.idx), 1);
            clearCanvas(existingShapes, ctx, canvas, socket, roomId);
        });

        socket.on("shape:saved", (data: { roomId: number; shapes: Shape[] }) => {
            console.log("Received saved shapes:", data.shapes.length);
            // Replace all shapes with saved ones
            existingShapes.length = 0;
            existingShapes.push(...data.shapes);
            clearCanvas(existingShapes, ctx, canvas, socket, roomId);
        });
    }





    // Check if point is inside a shape
    const isPointInShape = (x: number, y: number, shape: Shape): boolean => {
        if (shape.type === "rect") {
            return x >= shape.x && x <= shape.x + shape.width &&
                y >= shape.y && y <= shape.y + shape.height;
        } else if (shape.type === "circle") {
            const dist = Math.sqrt((x - shape.x) ** 2 + (y - shape.y) ** 2);
            return dist <= shape.radius;
        } else if (shape.type === "line") {
            // Check if point is near the line (within 5 pixels)
            const dist = distanceToLine(x, y, shape.x, shape.y, shape.mx, shape.my);
            return dist < 10;
        } else if (shape.type === "arrow") {
            const dist = distanceToLine(x, y, shape.x, shape.y, shape.mx, shape.my);
            return dist < 10;
        } else if (shape.type === "pencil") {
            // Check if point is near any line segment
            for (let i = 0; i < shape.points.length - 1; i++) {
                const dist = distanceToLine(
                    x, y,
                    shape.points[i].x, shape.points[i].y,
                    shape.points[i + 1].x, shape.points[i + 1].y
                );
                if (dist < 10) return true;
            }
            return false;
        }
        return false;
    };

    // Helper: distance from point to line segment
    const distanceToLine = (px: number, py: number, x1: number, y1: number, x2: number, y2: number): number => {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        if (lenSq != 0) param = dot / lenSq;

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const handleMouseDown = (e: MouseEvent) => {

        console.log("clicked bro");
        clicked = true;
        startX = e.clientX;
        startY = e.clientY;



        // Check if clicking on existing shape (in reverse order to get top-most)
        if (currentTool === "eraser") {
            for (let i = existingShapes.length - 1; i >= 0; i--) {
                if (isPointInShape(e.clientX, e.clientY, existingShapes[i])) {
                    existingShapes.splice(i, 1);
                    if (socket !== null && !isDummyToken) {
                        socket.emit("shape:remove", { idx: i, roomId });
                    }
                    if (isDummyToken) {
                        saveToLocalStorage();
                    }
                    clearCanvas(existingShapes, ctx, canvas, socket, roomId);
                    break;
                }
            }
        }

        if (currentTool === "select") {
            for (let i = existingShapes.length - 1; i >= 0; i--) {
                if (isPointInShape(e.clientX, e.clientY, existingShapes[i])) {
                    isDragging = true;
                    draggedShapeIndex = i;
                    const shape = existingShapes[i];

                    // Calculate offset based on shape type
                    if (shape.type === "rect") {
                        dragOffsetX = e.clientX - shape.x;
                        dragOffsetY = e.clientY - shape.y;
                    } else if (shape.type === "circle") {
                        dragOffsetX = e.clientX - shape.x;
                        dragOffsetY = e.clientY - shape.y;
                    } else if (shape.type === "line" || shape.type === "arrow") {
                        dragOffsetX = e.clientX - shape.x;
                        dragOffsetY = e.clientY - shape.y;
                    } else if (shape.type === "pencil") {
                        dragOffsetX = e.clientX - shape.points[0].x;
                        dragOffsetY = e.clientY - shape.points[0].y;
                    }
                    break;
                }
            }
        }
    };

    const handleMouseUp = (e: MouseEvent) => {
        clicked = false;

        // Don't create new shapes if we were dragging
        if (isDragging) {
            isDragging = false;
            draggedShapeIndex = null;
            clearCanvas(existingShapes, ctx, canvas, socket, roomId);
            return;
        }

        if (currentTool === "rect") {
            existingShapes.push({
                type: "rect",
                x: startX,
                y: startY,
                width: e.clientX - startX,
                height: e.clientY - startY
            });
        } else if (currentTool === "line") {
            existingShapes.push({
                type: "line",
                x: startX,
                y: startY,
                mx: e.clientX,
                my: e.clientY
            });
        } else if (currentTool === "arrow") {
            if (e.clientX != startX) {
                const angle = Math.atan2(e.clientY - startY, e.clientX - startX);
                const headLength = 15;

                let _l1x = e.clientX - headLength * Math.cos(angle - Math.PI / 6);
                let _l1y = e.clientY - headLength * Math.sin(angle - Math.PI / 6);

                let _l2x = e.clientX - headLength * Math.cos(angle + Math.PI / 6);
                let _l2y = e.clientY - headLength * Math.sin(angle + Math.PI / 6);

                existingShapes.push({
                    type: "arrow",
                    x: startX,
                    y: startY,
                    mx: e.clientX,
                    my: e.clientY,
                    l1x: _l1x,
                    l1y: _l1y,
                    l2x: _l2x,
                    l2y: _l2y,
                    header: 15
                })
            }
        } else if (currentTool === "circle") {
            let radius = Math.sqrt((e.clientX - startX) * (e.clientX - startX) + (e.clientY - startY) * (e.clientY - startY));
            existingShapes.push({
                type: "circle",
                x: startX,
                y: startY,
                radius
            })
        } else if (currentTool === "pencil") {
            if (coordinates.length > 0) {
                existingShapes.push({
                    type: "pencil",
                    points: [...coordinates]
                });
                coordinates = [];
            }
        }


        if (currentTool != "eraser" && currentTool != "select" && existingShapes.length > 0) {
            const shape = existingShapes[existingShapes.length - 1];
            if (socket !== null && !isDummyToken) {
                socket.emit("shape:create", {
                    roomId,
                    type: shape.type.toUpperCase(),
                    data: shape,
                });
            }
            if (isDummyToken) {
                saveToLocalStorage();
            }
        }

        clearCanvas(existingShapes, ctx, canvas, socket, roomId);
    };

    const handleMouseMove = (e: MouseEvent) => {
        console.log("mouse moved")

        if (clicked) {
            // Handle dragging
            if (isDragging && draggedShapeIndex !== null) {
                const shape = existingShapes[draggedShapeIndex];
                const dx = e.clientX - dragOffsetX;
                const dy = e.clientY - dragOffsetY;

                if (shape.type === "rect") {
                    shape.x = dx;
                    shape.y = dy;
                } else if (shape.type === "circle") {
                    shape.x = dx;
                    shape.y = dy;
                } else if (shape.type === "line") {
                    const width = shape.mx - shape.x;
                    const height = shape.my - shape.y;
                    shape.x = dx;
                    shape.y = dy;
                    shape.mx = dx + width;
                    shape.my = dy + height;
                } else if (shape.type === "arrow") {
                    const width = shape.mx - shape.x;
                    const height = shape.my - shape.y;
                    shape.x = dx;
                    shape.y = dy;
                    shape.mx = dx + width;
                    shape.my = dy + height;

                    // Recalculate arrowhead
                    const angle = Math.atan2(shape.my - shape.y, shape.mx - shape.x);
                    const headLength = 15;
                    shape.l1x = shape.mx - headLength * Math.cos(angle - Math.PI / 6);
                    shape.l1y = shape.my - headLength * Math.sin(angle - Math.PI / 6);
                    shape.l2x = shape.mx - headLength * Math.cos(angle + Math.PI / 6);
                    shape.l2y = shape.my - headLength * Math.sin(angle + Math.PI / 6);
                } else if (shape.type === "pencil") {
                    const offsetX = e.clientX - (shape.points[0].x + dragOffsetX);
                    const offsetY = e.clientY - (shape.points[0].y + dragOffsetY);
                    shape.points = shape.points.map(p => ({
                        x: p.x + offsetX,
                        y: p.y + offsetY
                    }));
                }

                if (socket !== null && !isDummyToken) {
                    socket.emit("shape:update", {
                        roomId,
                        index: draggedShapeIndex,
                        shape: existingShapes[draggedShapeIndex]
                    });
                }
                if (isDummyToken) {
                    saveToLocalStorage();
                }
                clearCanvas(existingShapes, ctx, canvas, socket, roomId); // re draw
                return;
            }

            // Regular drawing
            clearCanvas(existingShapes, ctx, canvas, socket, roomId);
            ctx.strokeStyle = "rgb(0,0,0)";
            ctx.lineWidth = 2;

            if (currentTool === "line") {
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(e.clientX, e.clientY);
                ctx.stroke();
            } else if (currentTool === "rect") {
                ctx.strokeRect(startX, startY, e.clientX - startX, e.clientY - startY);
            } else if (currentTool === "arrow") {
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(e.clientX, e.clientY);
                ctx.stroke();

                const angle = Math.atan2(e.clientY - startY, e.clientX - startX);
                const headLength = 15;

                ctx.beginPath();
                ctx.moveTo(e.clientX, e.clientY);
                ctx.lineTo(
                    e.clientX - headLength * Math.cos(angle - Math.PI / 6),
                    e.clientY - headLength * Math.sin(angle - Math.PI / 6)
                );

                ctx.moveTo(e.clientX, e.clientY);
                ctx.lineTo(
                    e.clientX - headLength * Math.cos(angle + Math.PI / 6),
                    e.clientY - headLength * Math.sin(angle + Math.PI / 6)
                );
                ctx.stroke();
            } else if (currentTool === "circle") {
                let radius = Math.sqrt((e.clientX - startX) * (e.clientX - startX) + (e.clientY - startY) * (e.clientY - startY));
                ctx.beginPath();
                ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
                ctx.stroke();
            } else if (currentTool === "pencil") {
                coordinates.push({ x: e.clientX, y: e.clientY });
                ctx.beginPath();
                ctx.moveTo(coordinates[0].x, coordinates[0].y);
                for (let i = 1; i < coordinates.length; i++) {
                    ctx.lineTo(coordinates[i].x, coordinates[i].y);
                }
                ctx.stroke();
            }
        }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);

    // Draw existing shapes on initialization
    clearCanvas(existingShapes, ctx, canvas, socket, roomId);

    return {
        setTool: (tool: TSelectedTool) => {
            currentTool = tool;
        },
        cleanup: () => {
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('mousemove', handleMouseMove);
        },
        redraw: () => {
            clearCanvas(existingShapes, ctx, canvas, socket, roomId);
        },
        getShapes: () => existingShapes,
        // saveShapes: () => {
        //     if (socket !== null && !isDummyToken) {
        //         console.log("Saving shapes:", existingShapes.length);
        //         socket.emit("shape:save", {
        //             roomId,
        //             shapes: existingShapes
        //         });
        //     }
        // },
        clearAll: () => {
            if (socket != null && !isDummyToken) {
                socket.emit("shape:clear", { roomId });
            }
            existingShapes.length = 0;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (isDummyToken) {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem(storageKey);
                }
            }
        }
    };
}