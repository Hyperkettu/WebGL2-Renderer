import { vec4 } from 'gl-matrix';


export class Color {
    constructor(r: number, g: number, b: number, a: number) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;

        this.rgba = vec4.fromValues(r, g, b, a);
    }

    rgba: vec4;
    hex: string;

    r: number;
    g: number;
    b: number;
    a: number;
}

