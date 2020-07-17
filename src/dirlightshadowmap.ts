import { DepthTexture } from "./depthtexture";
import { Camera } from "./camera";
import { Renderer } from "./glrenderer";
import { mat4, vec3, vec4 } from "gl-matrix";
import * as shader from './shadermanager';
import { ShaderType } from "./shader";
import { RenderTargetState } from "./rendertarget";
import { Layer } from "./batchrenderer";
import { ConstantBuffers } from "./constantbuffers";
import { Texture } from "./texture";
import * as texture from './texturemanager';

export class DirLightShadowMap {
    constructor(gl: WebGL2RenderingContext, direction: vec3, width: number, height: number, near: number, far:number) {
        this.width = width;
        this.height = height;;
        this.direction = direction;
        this.near = near;
        this.far = far;
        this.projection = mat4.create();
        mat4.ortho(this.projection, -10.0, 10.0, -10.0, 10.0, this.near, this.far);
        this.view = mat4.create();
        mat4.lookAt(this.view, vec3.fromValues(-this.direction[0] * 10, -this.direction[1] * 10, -this.direction[2] * 10), 
        vec3.fromValues(0, 0, 0), vec3.fromValues(0, 1, 0));

        this.lightSpaceMatrix = mat4.create();
        mat4.multiply(this.lightSpaceMatrix, this.projection, this.view);

        this.shadowMap = [];
        this.shadowMap[0] = DepthTexture.create(gl, this.width, this.height);

        this.colorBuffer = Texture.createRenderTarget(gl, gl.RGBA, gl.RGBA, width, height, gl.UNSIGNED_BYTE, gl.LINEAR, false, gl.LINEAR);

    }


    render(renderer: Renderer) {

        const gl = renderer.gl;

        gl.colorMask(false, false, false, false);

        const rts = new RenderTargetState(gl, { x: 0, y: 0, width: this.width, height: this.height });
        rts.addColorTarget(gl, 0, this.colorBuffer);
        rts.addDepthStencilTarget(gl, this.shadowMap[0]);
		renderer.context.renderTargetBegin(rts);
        renderer.resolveVisibility(renderer.currentScene);
        gl.clear(gl.DEPTH_BUFFER_BIT);

        ConstantBuffers.matricesPerFrame.update(gl, 'projection', this.projection);
		ConstantBuffers.matricesPerFrame.update(gl, 'view', this.view);
        ConstantBuffers.matricesPerFrame.sendToGPU(gl);

        renderer.batchRenderer.flushSortedArray(renderer, Layer.OPAQUE, true);
        renderer.batchRenderer.flushSortedArray(renderer, Layer.TRANSPARENT, true);

        renderer.context.renderTargetEnd();

        renderer.shaderTech = null;
		renderer.shader = null;
		renderer.materialID = null;

		gl.colorMask(true, true, true, true);

        texture.setDepthTexture('dirLightShadowMap', this.shadowMap[0]);
    }

    width: number;
    height: number;

    direction: vec3;
    near: number;
    far: number;

    projection: mat4;
    view: mat4;
    lightSpaceMatrix: mat4;
    colorBuffer: Texture;
    shadowMap: DepthTexture[];
}

