import { mat4, vec3 } from 'gl-matrix';
import { DEG_TO_RAD } from '../util/math';

export class OverlayCamera {

    constructor() {
        this.orthoProjection = mat4.create();
        this.setProjection();
        this.view = mat4.create();
     //   mat4.lookAt(this.view, [0, 0, 0], [0, 0, -1], [0, 1, 0]);
    }

    setProjection() {
        mat4.ortho(this.orthoProjection, 0.0, window.innerWidth, window.innerHeight, 0.0, -1.0, 1.0);
    }

    move(dx: number, dy: number) {
        mat4.translate(this.view, this.view, vec3.fromValues(-dx, -dy, 0));
    }

    rotateZ(deltaAngle: number) {
        mat4.rotateZ(this.view, this.view, DEG_TO_RAD * deltaAngle);
    }

    orthoProjection: mat4;
    view: mat4;
}