import { Submesh } from "./submesh";
import { VertexBase } from "./vertex";
import { StaticMesh } from "./mesh";
import { VertexBuffer } from "./vertexbuffer";
import { mat4 } from "gl-matrix";
import * as shader from './shadermanager';
import { ShaderType } from "./shader";
import * as material from "./material";
import { Shader } from './shader';
import { PointLight } from './pointlight';
import * as texture from './texturemanager';

export interface InstanceData {
    submesh: Submesh<VertexBase>;
    instanceCount: number;
    buffer: WebGLBuffer;
    data: Float32Array;
}

export class InstanceBuffer {

    constructor() {
    }

    create(gl: WebGL2RenderingContext, mesh: StaticMesh, instanceCount: number) {
        this.data = VertexBuffer.createInstanceVertexBuffer(gl, mesh, instanceCount);
    }

    updateBuffer(gl: WebGL2RenderingContext, worldMatrices: mat4[]) {
        
        for(let index = 0; index < this.data[0].instanceCount; index++) {
            const matrix = worldMatrices[index];
            this.data[0].data.set(matrix, 16 * index);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.data[0].buffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.data[0].data);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    render(gl: WebGL2RenderingContext, worldMatrices: mat4[]) {

        for(let instanceBuffer of this.data) {

            this.updateBuffer(gl, worldMatrices);

            const mat = material.GetMaterial(instanceBuffer.submesh.materialID);

            const instanceShader = shader.GetShader(ShaderType.INSTANCE_STATIC_PBR, mat.tech);
            instanceShader.use(gl);

            for(let index = 0; index < mat.textures.length; index++) {
                instanceShader.setSamplerTexture(gl, Shader.uniformSamplers[index], mat.textures[index], index);
            }

            instanceShader.setSamplerTexture(gl, 'prefilterMap', texture.GetTexture('prefilterMap'), 7);
            instanceShader.setSamplerTexture(gl, 'irradianceMap', texture.GetTexture('irradianceMap'), 8);
            instanceShader.setSamplerTexture(gl, 'brdfLUT', texture.GetTexture('brdfLUT'), 9);

            for (let index = 1; index <= PointLight.NUM_LIGHTS; index++) {
                instanceShader.setSamplerTexture(gl, `pointLightShadowMap${index}`, texture.GetDepthTexture(`pointLightShadowMap${index}`), 10 + (index - 1));
            }

            instanceShader.setSamplerTexture(gl, 'dirLightShadowMap', texture.GetDepthTexture('dirLightShadowMap'), 11);

            
            gl.bindVertexArray(instanceBuffer.submesh.vertexArrayObject.vao);
            gl.drawElementsInstanced(gl.TRIANGLES, instanceBuffer.submesh.indices.length, 
                gl.UNSIGNED_INT, 0, instanceBuffer.instanceCount);
            gl.bindVertexArray(null);

            for(let index = 0; index < mat.textures.length; index++) {
                instanceShader.setSamplerTexture(gl, Shader.uniformSamplers[index], null, index);
            }
        }
    }

    data: InstanceData[];
}