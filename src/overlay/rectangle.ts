import { vec2 } from "gl-matrix";

export class Rectangle {
    constructor(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    containsPoint(point: vec2) {
        const x = point[0];
        const y = point[1];
        return x >= this.x && x <= this.width && y >= this.y && y <= this.height;
    }

    x: number;
    y: number;
    width: number;
    height: number;
}