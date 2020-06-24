import { vec2, vec3 } from 'gl-matrix';

export function easeInOutElastic(x: number): number {
    const c5 = (2 * Math.PI) / 4.5;
    
    return x === 0
      ? 0
      : x === 1
      ? 1
      : x < 0.5
      ? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * c5)) / 2
      : (Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * c5)) / 2 + 1;
    
}

export function easeInOutSine(x: number): number {
    return -(Math.cos(Math.PI * x) - 1) / 2; 
}

export function easeOutCubic(x: number): number {
    return 1 - Math.pow(1 - x, 3);
}

export function easeInOutCubic(x: number): number {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function easeInOutQuint(x: number): number {
    return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
}

export function easeOutBounce(x: number): number {
    const n1 = 7.5625;
    const d1 = 2.75;
    
    if (x < 1 / d1) {
        return n1 * x * x;
    } else if (x < 2 / d1) {
        return n1 * (x -= 1.5 / d1) * x + 0.75;
    } else if (x < 2.5 / d1) {
        return n1 * (x -= 2.25 / d1) * x + 0.9375;
    } else {
        return n1 * (x -= 2.625 / d1) * x + 0.984375;
    }    
}

export function easeInBounce(x: number): number {
    return 1 - easeOutBounce(1 - x);
}

export function easeInOutBounce(x: number): number {
    return x < 0.5
      ? (1 - easeOutBounce(1 - 2 * x)) / 2
      : (1 + easeOutBounce(2 * x - 1)) / 2;
}

export function easeInBack(x: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    
    return c3 * x * x * x - c1 * x * x;
}

export function easeOutBack(x: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

export function easeInOutBack(x: number): number {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    
    return x < 0.5
      ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
      : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
}

export function lerpNumber(from: number, to: number, t: number, easingFunction?: (x: number) => number) {
    const value = easingFunction ? easingFunction(t) : t;
    return value * to + (1 - value) * from;
}

export function lerpVec2(from: vec2, to: vec2, t: number, easingFunction?: (x: number) => number) {
    const value = easingFunction ? easingFunction(t) : t;
    const returnValue = vec2.create();
    vec2.set(returnValue, lerpNumber(from[0], to[0], value), lerpNumber(from[1], to[1], value));
    return returnValue;
}

export function lerpVec3(from: vec3, to: vec3, t: number, easingFunction?: (x: number) => number) {
    const value = easingFunction ? easingFunction(t) : t;
    const returnValue = vec3.create();
    vec3.set(returnValue, 
        lerpNumber(from[0], to[0], value), 
        lerpNumber(from[1], to[1], value),
        lerpNumber(from[2], to[2], value));
    return returnValue;
}


