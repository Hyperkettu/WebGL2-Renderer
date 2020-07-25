import { Submesh } from "./submesh";
import { VertexBase } from "./vertex";
import { StaticMesh } from "./mesh";
import { VertexBuffer } from "./vertexbuffer";
import { mat4 } from "gl-matrix";
import * as shader from './shadermanager';
import { ShaderType } from "./shader";
import { Renderer } from "./glrenderer";
import * as material from "./material";
import { Shader } from './shader';
import { PointLight } from './pointlight';
import * as texture from './texturemanager';
import { ConstantBuffers } from "./constantbuffers";

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

        this.updateBuffer(gl, worldMatrices);

        const mat = material.GetMaterial('bark1-with-displacement');

        const instancedStaticPbrShader = shader.GetShader(ShaderType.INSTANCE_STATIC_PBR, 'ANRMAD');
        instancedStaticPbrShader.use(gl);

        for(let index = 0; index < mat.textures.length; index++) {
            instancedStaticPbrShader.setSamplerTexture(gl, Shader.uniformSamplers[index], mat.textures[index], index);
        }

        instancedStaticPbrShader.setSamplerTexture(gl, 'prefilterMap', texture.GetTexture('prefilterMap'), 7);
        instancedStaticPbrShader.setSamplerTexture(gl, 'irradianceMap', texture.GetTexture('irradianceMap'), 8);
        instancedStaticPbrShader.setSamplerTexture(gl, 'brdfLUT', texture.GetTexture('brdfLUT'), 9);

		for (let index = 1; index <= PointLight.NUM_LIGHTS; index++) {
			instancedStaticPbrShader.setSamplerTexture(gl, `pointLightShadowMap${index}`, texture.GetDepthTexture(`pointLightShadowMap${index}`), 10 + (index - 1));
		}

		instancedStaticPbrShader.setSamplerTexture(gl, 'dirLightShadowMap', texture.GetDepthTexture('dirLightShadowMap'), 11);

        for(let instanceBuffer of this.data) {
            gl.bindVertexArray(instanceBuffer.submesh.vertexArrayObject.vao);
            gl.drawElementsInstanced(gl.TRIANGLES, instanceBuffer.submesh.indices.length, 
                gl.UNSIGNED_SHORT, 0, instanceBuffer.instanceCount);
            gl.bindVertexArray(null);
        }

        for(let index = 0; index < mat.textures.length; index++) {
            instancedStaticPbrShader.setSamplerTexture(gl, Shader.uniformSamplers[index], null, index);
        }
    }

    data: InstanceData[];
}