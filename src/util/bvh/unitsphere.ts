import { vec3, vec4 } from "gl-matrix";
import { PositionVertex } from "../../vertex";
import { Sphere } from "../../sphere";
import { LineMesh } from "../../mesh";
import * as shader from '../../shadermanager';
import { ShaderType } from "../../shader";
import { ConstantBuffers } from "../../constantbuffers";

export class UnitSphere{

    constructor(gl: WebGL2RenderingContext) {
        this.color = vec4.fromValues(1, 0, 0, 1);
        this.create(gl);
    }

    static initRenderableUnitSphere(gl: WebGL2RenderingContext) {
        UnitSphere.unitSphere = new UnitSphere(gl);
    }

    static getUnitSphere() {
        return UnitSphere.unitSphere;
    }

    create(gl: WebGL2RenderingContext) {
        const center = vec3.fromValues(0,0,0);
        const radius = 1;
        this.sphere = new Sphere(center, radius);
        this.createMesh(gl);
    }

    createMesh(gl: WebGL2RenderingContext) {

        const vertices1: PositionVertex[] = [];
        const vertices2: PositionVertex[] = [];

        for(let angle = 0; angle < 2 * Math.PI; angle += (2.0 * Math.PI / 32.0)) {
            const x = Math.cos(angle) * this.sphere.radius;
            const z = Math.sin(angle) * this.sphere.radius;
            const vertex = new PositionVertex();
            vertex.position = vec3.fromValues(this.sphere.center[0] + x, this.sphere.center[1], this.sphere.center[2] + z);
            vertices1.push(vertex);

            const vertex2 = new PositionVertex();
            vertex2.position = vec3.fromValues(this.sphere.center[0], this.sphere.center[1] + z, this.sphere.center[2] + x);
            vertices2.push(vertex2);
        }

        const indices: number[] = [];

        for(let index = 0; index < vertices1.length; index++) {
            indices.push(index);
        }

        indices.push(0);

        this.lineMesh = new LineMesh('lineMesh');
        this.lineMesh.createSubmesh(gl, 'circle', vertices1, indices, '');

        this.lineMesh.createSubmesh(gl, 'circle2', vertices2, indices, '');

    }

    render(gl: WebGL2RenderingContext) {

        const lineShader = shader.GetShader(ShaderType.LINES);
        lineShader.use(gl);
        const submesh = this.lineMesh.getSubmesh('circle');

        ConstantBuffers.generalData.update(gl, 'dataVec1', this.color);
        ConstantBuffers.generalData.sendToGPU(gl);
        
        gl.bindVertexArray(submesh.vertexArrayObject.vao);
        gl.drawElements(gl.LINE_STRIP, submesh.indices.length, gl.UNSIGNED_INT, 0);
        gl.bindVertexArray(null);

        const submesh2 = this.lineMesh.getSubmesh('circle2');

        gl.bindVertexArray(submesh2.vertexArrayObject.vao);
        gl.drawElements(gl.LINE_STRIP, submesh2.indices.length, gl.UNSIGNED_INT, 0);
        gl.bindVertexArray(null);
    }

    lineMesh: LineMesh;
    lineMesh2: LineMesh;

    sphere: Sphere;

    color: vec4;

    static unitSphere: UnitSphere;;
    
}