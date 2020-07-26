import { Submesh } from "./submesh";
import { VertexBase } from "./vertex";
import { StaticMesh } from "./mesh";
import { VertexBuffer } from "./vertexbuffer";
import { mat4 } from "gl-matrix";
import * as shader from './shadermanager';
import { ShaderType, ShaderTech } from "./shader";
import * as material from "./material";
import { Shader } from './shader';
import { PointLight } from './pointlight';
import * as texture from './texturemanager';
import { Layer } from "./batchrenderer";
import { ShadowPass } from "./glrenderer";
import { TextureType } from "./texture";

export interface InstanceData {
    submesh: Submesh<VertexBase>;
    instanceCount: number;
    buffer: WebGLBuffer;
    data: Float32Array;
    matrices?: mat4[];
}

const instanceBuffers: { [name: string]: InstanceBuffer}[] = [];
const opaqueInstanceBuffers:  { [name: string] : InstanceBuffer } = {};
const transparentInstanceBuffers:  { [name: string] : InstanceBuffer } = {};

instanceBuffers.push(opaqueInstanceBuffers);
instanceBuffers.push(transparentInstanceBuffers);

export function getInstanceBuffers(layer: Layer) {
    return Object.values(instanceBuffers[layer]);
}

export function getInstanceBuffer(name: string, layer: Layer) {
    return instanceBuffers[layer][name];
}

export function setInstanceBuffer(name: string, buffer: InstanceBuffer, layer: Layer) {
    if(layer === Layer.OPAQUE) {
        opaqueInstanceBuffers[name] = buffer;
    } else {
        transparentInstanceBuffers[name] = buffer;
    }
}

export class InstanceBuffer {

    constructor(mesh: StaticMesh, name: string, layer: Layer) {
        this.name = name;
        this.mesh = mesh;
        this.instanceCounter = 0;
        setInstanceBuffer(name, this, layer);
    }

    clear() {
        for(let instanceBuffer of this.data) {
            instanceBuffer.matrices = [];
        }
    }

    addInstance() {
        this.instanceCounter++;
    }

    addTransform(submesh: Submesh<VertexBase>, matrix: mat4) {
        for(let instanceBuffer of this.data) {
            instanceBuffer.matrices.push(matrix);
        }
    }

    create(gl: WebGL2RenderingContext) {
        this.data = VertexBuffer.createInstanceVertexBuffer(gl, this.mesh, this.instanceCounter);
        this.clear();
    }

    updateBuffer(submeshIndex: number, gl: WebGL2RenderingContext, worldMatrices: mat4[]) {
        
        for(let index = 0; index < this.data[submeshIndex].instanceCount; index++) {
            const matrix = worldMatrices[index];
            this.data[submeshIndex].data.set(matrix, 16 * index);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.data[0].buffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.data[0].data);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    render(gl: WebGL2RenderingContext, shadowPass?: ShadowPass) {

        let submeshIndex = 0;
        for(let instanceBuffer of this.data) {

            this.updateBuffer(submeshIndex, gl, instanceBuffer.matrices);

            const mat = material.GetMaterial(instanceBuffer.submesh.materialID);

            let shaderType = ShaderType.INSTANCE_STATIC_PBR;
            let tech = mat.tech;

            let instanceShader: ShaderTech = null;

            if(shadowPass !== undefined) {
                if(shadowPass === ShadowPass.POINT_LIGHT) {
                    shaderType = ShaderType.INSTANCE_STATIC_POINT_LIGHT_SHADOW;
                } else if(shadowPass === ShadowPass.DIRECTIONAL_LIGHT) {
                    shaderType = ShaderType.INSTANCE_STATIC_DIR_LIGHT_SHADOW;
                }

                if(mat.textures[TextureType.Displacement]) {    
                    tech = 'AD';
                } else {
                    tech = 'A';
                }

                instanceShader = shader.GetShader(shaderType, tech);
                instanceShader.use(gl);

                instanceShader.setSamplerTexture(gl, Shader.uniformSamplers[TextureType.Albedo], 
                    mat.textures[TextureType.Albedo], TextureType.Albedo);
            

                if(mat.textures[TextureType.Displacement]) {
                    instanceShader.setSamplerTexture(gl, Shader.uniformSamplers[TextureType.Displacement], 
                        mat.textures[TextureType.Displacement], TextureType.Displacement);
                }

            } else {
                instanceShader = shader.GetShader(shaderType, tech);
                instanceShader.use(gl);
            }

            if(shadowPass === undefined) {
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

            }
            
            gl.bindVertexArray(instanceBuffer.submesh.vertexArrayObject.vao);
            gl.drawElementsInstanced(gl.TRIANGLES, instanceBuffer.submesh.indices.length, 
                gl.UNSIGNED_INT, 0, instanceBuffer.instanceCount);
            gl.bindVertexArray(null);

            if(shadowPass === undefined) {
                for(let index = 0; index < mat.textures.length; index++) {
                    instanceShader.setSamplerTexture(gl, Shader.uniformSamplers[index], null, index);
                }
            }
            submeshIndex++;
        }
        this.clear();
    }

    mesh: StaticMesh;
    instanceCounter: number;
    name: string;
    data: InstanceData[];
    bufferId: number;
}