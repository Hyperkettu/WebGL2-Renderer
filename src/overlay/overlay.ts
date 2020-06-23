import { Texture } from '../texture';
import { VertexArrayObject } from '../vertexarrayobject';
import { ScreenVertex } from '../vertex';
import { vec2, mat4 } from 'gl-matrix';
import { OverlaySceneGraph } from './scenegraph';
import { Sprite } from './sprite';
import { OverlayMesh } from './mesh';
import * as shader from '../shadermanager';
import { ShaderType } from '../shader';
import { ConstantBuffers } from '../constantbuffers';
import { OverlayCamera } from './overlaycamera';
import * as texture from '../texturemanager';
 
export class Overlay {
    
    static SPRITE_BATCH_SIZE = 100;

    constructor(gl: WebGL2RenderingContext) {
        this.stage = new OverlaySceneGraph();
        this.sprites = [];
        this.mesh = new OverlayMesh(gl, Overlay.SPRITE_BATCH_SIZE);
        this.camera = new OverlayCamera();
    }

    setAtlas(texture: Texture) {
        this.textureAtlas = texture;
    }

    overlayBegin(gl: WebGL2RenderingContext) {
      //  this.depthFuncBeforeOverlay = gl.get
        gl.depthFunc(gl.ALWAYS);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    overlayEnd(gl: WebGL2RenderingContext) {
        gl.depthFunc(gl.LESS); // ? 
    }

    render(gl: WebGL2RenderingContext, dt: number) {

        this.sprites = [];
        this.stage.forEach((node, worldTransform, transformUpdated) => {
            const updated = node.updateWorldTransform(worldTransform, transformUpdated);
            if(node instanceof Sprite) {
                this.sprites.push(node);
            }
            return updated;
        });
        this.mesh.updateMesh(gl, this.sprites);

        const overlayShader = shader.GetShader(ShaderType.OVERLAY, 'default');
        overlayShader.use(gl);
        overlayShader.setSamplerTexture(gl, 'atlasTexture', this.textureAtlas, 0);

        ConstantBuffers.overlayMatrices.update(gl, 'view', this.camera.view);
        ConstantBuffers.overlayMatrices.update(gl, 'ortho', this.camera.orthoProjection);
        ConstantBuffers.overlayMatrices.sendToGPU(gl);

        gl.bindVertexArray(this.mesh.vao.vao);
        gl.drawElements(gl.TRIANGLES, 6 * this.sprites.length, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }

    textureAtlas: Texture;
    sprites: Sprite[];
    stage: OverlaySceneGraph;
    mesh: OverlayMesh;
    depthFuncBeforeOverlay: number;
    camera: OverlayCamera;
}