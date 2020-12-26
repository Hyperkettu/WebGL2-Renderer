import { BoundingVolume } from "./boundingvolume";
import { Frustum } from "../../frustum";
import { Ray } from "../../ray";
import { vec4, vec3, mat4 } from "gl-matrix";
import { VertexBase, PositionVertexType, PositionVertex } from "../../vertex";
import { AABB } from "../../aabb";
import { HitInfo } from "../../raycast";
import { rayIntersectsAABB } from "../math";
import { LineMesh } from "../../mesh";
import * as shader from '../../shadermanager';
import { ShaderType } from "../../shader";
import { ConstantBuffers } from "../../constantbuffers";

export class BoundingAABB extends BoundingVolume {

    constructor(gl: WebGL2RenderingContext, vertices: PositionVertexType[]) {
        super();
        this.color = vec4.fromValues(1, 0, 1, 1);
        this.create(gl, vertices as unknown as VertexBase[]);
    }

    create(gl: WebGL2RenderingContext, vertices: VertexBase[]) {

        const largeNumber = Number.MAX_SAFE_INTEGER;
        const min = vec3.fromValues(largeNumber, largeNumber, largeNumber);
        const max = vec3.fromValues(-largeNumber, -largeNumber, -largeNumber);

        const verts = vertices as unknown as PositionVertex[];

        for(let vertex of verts) {
            for(let axis = 0; axis < 3; axis++) {
                if(vertex.position[axis] < min[axis]) {
                    min[axis] = vertex.position[axis];
                }
                if(vertex.position[axis] > max[axis]) {
                    max[axis] = vertex.position[axis];
                }
            }
        }
        this.aabb = new AABB(min, max);

        this.createMesh(gl);

    }

    createMesh(gl: WebGL2RenderingContext) {
        this.lineMesh = new LineMesh('axisAABB');

        const vertices: PositionVertex[] = [
            {
                position: vec3.fromValues(this.aabb.min[0], this.aabb.min[1], this.aabb.min[2]),
            },
            {
                position: vec3.fromValues(this.aabb.min[0], this.aabb.max[1], this.aabb.min[2]),
            },
            {
                position: vec3.fromValues(this.aabb.max[0], this.aabb.max[1], this.aabb.min[2]),
            },
            {
                position: vec3.fromValues(this.aabb.max[0], this.aabb.min[1], this.aabb.min[2]),
            },
            {
                position: vec3.fromValues(this.aabb.min[0], this.aabb.min[1], this.aabb.max[2]),
            },
            {
                position: vec3.fromValues(this.aabb.min[0], this.aabb.max[1], this.aabb.max[2]),
            },
            {
                position: vec3.fromValues(this.aabb.max[0], this.aabb.max[1], this.aabb.max[2]),
            },
            {
                position: vec3.fromValues(this.aabb.max[0], this.aabb.min[1], this.aabb.max[2]),
            }
        ];



        const indices: number[] = [
            0, 1, 2, 3, 0,
            4, 5, 6, 7, 4
        ];

        this.lineMesh.createSubmesh(gl, 'aabb', vertices, indices, '');
    }

    intersectsFrustum(frustum: Frustum, world: mat4) {
     //   return frustum.intersectsAABB(this.aabb, world);
    }

    intersects(ray: Ray, info: HitInfo): boolean {
        return rayIntersectsAABB(ray, this.aabb, info);
    }

    render(gl: WebGL2RenderingContext) {
        const lineShader = shader.GetShader(ShaderType.LINES);
        lineShader.use(gl);
        const submesh = this.lineMesh.getSubmesh('aabb');

        ConstantBuffers.generalData.update(gl, 'dataVec1', this.color);
        ConstantBuffers.generalData.sendToGPU(gl);
        
        gl.bindVertexArray(submesh.vertexArrayObject.vao);
        gl.drawElements(gl.LINE_STRIP, submesh.indices.length, gl.UNSIGNED_INT, 0);
        gl.bindVertexArray(null);
    }

    aabb: AABB;
    lineMesh: LineMesh;
}