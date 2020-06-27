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
import { AnimationSystem, Animation } from './animationsystem';
import { TextureAtlas } from '../textureatlas';
import { UILayout } from './ui/layout';
 
export class Overlay {
    
    static SPRITE_BATCH_SIZE = 3000;

    constructor(gl: WebGL2RenderingContext) {
        this.stage = new OverlaySceneGraph();
        this.sprites = [];
        this.mesh = new OverlayMesh(gl, Overlay.SPRITE_BATCH_SIZE);
        this.camera = new OverlayCamera();
        this.animationSystem = new AnimationSystem();
        this.textureAtlas = new TextureAtlas(null);

        this.textureAtlas.addTextures([
            'images/A.png',
            'images/B.png',
            'images/C.png',
            'images/D.png',
            'images/E.png',
            'images/F.png',
            'images/G.png',
            'images/H.png',
            'images/I.png',
            'images/J.png',
            'images/K.png',
            'images/L.png',
            'images/M.png',
            'images/N.png',
            'images/O.png',
            'images/P.png',
            'images/Q.png',
            'images/R.png',
            'images/S.png',
            'images/T.png',
            'images/U.png',
            'images/W.png',
            'images/V.png',
            'images/Z.png',
            'images/Y.png',
            'images/Z.png'
        ]);
        this.textureAtlas.generateJson();
    }

    startAnimation(animationSequence: Animation[]) {
        this.animationSystem.startAnimation(animationSequence);
    }

    setAtlas(texture: Texture) {
        this.textureAtlas.texture = texture;
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

    renderSprite(gl: WebGL2RenderingContext, sprite: Sprite) {
        // add sprite to stage with texcoords |0,1]
        // set pos, rotation, scale and this.render(gl,0);
        //const currentTexture = this.textureAtlas.texture;
        this.setAtlas(sprite.texture.texture);
        this.stage.root.addChild(sprite);
        this.render(gl, 0);
        this.stage.root.removeChild(sprite);
        //this.setAtlas(currentTexture);
    }

    render(gl: WebGL2RenderingContext, dt: number) {

        this.animationSystem.updateAnimations(dt);

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
        overlayShader.setSamplerTexture(gl, 'atlasTexture', this.textureAtlas.texture, 0);

        ConstantBuffers.overlayMatrices.update(gl, 'view', this.camera.view);
        ConstantBuffers.overlayMatrices.update(gl, 'ortho', this.camera.orthoProjection);
        ConstantBuffers.overlayMatrices.sendToGPU(gl);

        gl.bindVertexArray(this.mesh.vao.vao);
        gl.drawElements(gl.TRIANGLES, 6 * this.sprites.length, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);
    }

    textureAtlas: TextureAtlas;
    sprites: Sprite[];
    stage: OverlaySceneGraph;
    mesh: OverlayMesh;
    depthFuncBeforeOverlay: number;
    camera: OverlayCamera;

    animationSystem: AnimationSystem;

    currentLayout: UILayout;
}