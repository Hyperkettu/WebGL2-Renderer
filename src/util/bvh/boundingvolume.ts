import { Ray } from "../../ray";
import { Frustum } from "../../frustum";
import { VertexBase } from "../../vertex";
import { vec4 } from "gl-matrix";
import { HitInfo } from "../../raycast";

export abstract class BoundingVolume {

    constructor() {
        this.children = [];
        
    }

    abstract create(gl: WebGL2RenderingContext, vertices: VertexBase[]);
    abstract intersectsFrustum(frustum: Frustum): boolean;
    abstract intersects(ray: Ray, info: HitInfo): boolean;
    abstract render(gl: WebGL2RenderingContext);

    children: BoundingVolume[];
    color: vec4;

}