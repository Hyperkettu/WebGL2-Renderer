import { LineMesh } from "../mesh";
import { Renderer } from "../glrenderer";
import { vec3, vec4, mat4 } from "gl-matrix";
import { ShaderType } from "../shader";
import * as shader from '../shadermanager';
import { ConstantBuffers } from "../constantbuffers";
import { SceneNode } from "../scenenode";
import { BoundingAABB } from "../util/bvh/boundingvolumeaabb";
import { PositionVertexType } from "../vertex";

export class AxisMesh {

    constructor(renderer: Renderer) {
        this.axisMesh = new LineMesh('axisMesh');
        const axisLength = 1.5;
		this.axisMesh.createSubmesh(renderer.gl, 'x-axis', [ { position: vec3.fromValues(0,0,0) }, { position: vec3.fromValues(axisLength, 0, 0) }], [0, 1], '');
		this.axisMesh.createSubmesh(renderer.gl, 'y-axis', [ { position: vec3.fromValues(0,0,0) }, { position: vec3.fromValues(0, axisLength, 0) }], [0, 1], '');
        this.axisMesh.createSubmesh(renderer.gl, 'z-axis', [ { position: vec3.fromValues(0,0,0) }, { position: vec3.fromValues(0, 0, axisLength) }], [0, 1], '');
        
        const halfDimension = 0.25;

        const xVertices: PositionVertexType[] = [];

        xVertices.push({
            position: vec3.fromValues(0, -halfDimension, -halfDimension)
        });

        xVertices.push({
            position: vec3.fromValues(axisLength, halfDimension, halfDimension)
        });

        const yVertices: PositionVertexType[] = [];

        yVertices.push({
            position: vec3.fromValues(-halfDimension, 0, -halfDimension)
        });

        yVertices.push({
            position: vec3.fromValues(halfDimension, axisLength, halfDimension)
        });

         const zVertices: PositionVertexType[] = [];

         zVertices.push({
            position: vec3.fromValues(-halfDimension, -halfDimension, 0)
        });

        zVertices.push({
            position: vec3.fromValues(halfDimension, halfDimension, axisLength)
        });

        this.aabbs = [
            new BoundingAABB(renderer.gl, xVertices),
            new BoundingAABB(renderer.gl, yVertices),
            new BoundingAABB(renderer.gl, zVertices)
        ];
        
        this.showAABB = false;
    }



    render(gl: WebGL2RenderingContext, node: SceneNode) {

        const lineShader = shader.GetShader(ShaderType.LINES);
        lineShader.use(gl);

        gl.lineWidth(30);

        gl.depthFunc(gl.ALWAYS);

        ConstantBuffers.bufferPerObject.update(gl, 'world', node.transform.world);
        ConstantBuffers.bufferPerObject.sendToGPU(gl);

        let mesh = this.axisMesh.getSubmesh('x-axis');
        gl.bindVertexArray(mesh.vertexArrayObject.vao);
        ConstantBuffers.generalData.update(gl, 'dataVec1', vec4.fromValues(1, 0, 0, 1));
        ConstantBuffers.generalData.sendToGPU(gl);
        gl.drawElements(gl.LINE_STRIP, mesh.indices.length, gl.UNSIGNED_INT, 0);

        mesh = this.axisMesh.getSubmesh('y-axis');
        gl.bindVertexArray(mesh.vertexArrayObject.vao);
        ConstantBuffers.generalData.update(gl, 'dataVec1', vec4.fromValues(0, 1, 0, 1));
        ConstantBuffers.generalData.sendToGPU(gl);
        gl.drawElements(gl.LINE_STRIP, mesh.indices.length, gl.UNSIGNED_INT, 0);
    
        mesh = this.axisMesh.getSubmesh('z-axis');
        gl.bindVertexArray(mesh.vertexArrayObject.vao);
        ConstantBuffers.generalData.update(gl, 'dataVec1', vec4.fromValues(0, 0, 1, 1));
        ConstantBuffers.generalData.sendToGPU(gl);
        gl.drawElements(gl.LINE_STRIP, mesh.indices.length, gl.UNSIGNED_INT, 0);
    
        if(this.showAABB) {
            for(let aabb of this.aabbs) {
                aabb.render(gl);
            }

        }

        gl.depthFunc(gl.LESS);
    }

    axisMesh: LineMesh;

    showAABB: boolean;

    aabbs: BoundingAABB[];

}