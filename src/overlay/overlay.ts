import { Texture } from '../texture';
import { mat3 } from 'gl-matrix';
import { OverlaySceneGraph } from './scenegraph';
import { Sprite } from './sprite';
import { OverlayMesh } from './mesh';
import * as shader from '../shadermanager';
import { ShaderType } from '../shader';
import { ConstantBuffers } from '../constantbuffers';
import { OverlayCamera } from './overlaycamera';
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
            'images/X.png',
            'images/Y.png',
            'images/Z.png'
        ]);
        this.textureAtlas.generateJson();
    }

    startAnimation(animationSequence: Animation[], instant: boolean) {
        this.animationSystem.startAnimation(animationSequence, instant);
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
        this.setAtlas(sprite.texture.texture);
        this.stage.root.addChild(sprite);
        this.render(gl, 0);
        this.stage.root.removeChild(sprite);
    }

    renderSingleSprite(gl: WebGL2RenderingContext, sprite: Sprite) {
        const currentTexture = this.textureAtlas.texture;
        this.setAtlas(sprite.texture.texture);
        sprite.updateWorldTransform(mat3.create(), true);

        this.mesh.updateMesh(gl, [ sprite ]);

        const overlayShader = shader.GetShader(ShaderType.OVERLAY, 'default');
        overlayShader.use(gl);
        overlayShader.setSamplerTexture(gl, 'atlasTexture', this.textureAtlas.texture, 0);

        ConstantBuffers.overlayMatrices.update(gl, 'view', this.camera.view);
        ConstantBuffers.overlayMatrices.update(gl, 'ortho', this.camera.orthoProjection);
        ConstantBuffers.overlayMatrices.sendToGPU(gl);

        gl.bindVertexArray(this.mesh.vao.vao);
        gl.drawElements(gl.TRIANGLES, 6 * this.sprites.length, gl.UNSIGNED_SHORT, 0);
        gl.bindVertexArray(null);

        this.setAtlas(currentTexture);
    }

    render(gl: WebGL2RenderingContext, dt: number) {

        this.animationSystem.updateAnimations(dt);

        this.sprites = [];
        this.stage.forEach((node, worldTransform, transformUpdated) => {
            const updated = node.updateWorldTransform(worldTransform, transformUpdated);
            node.updateAlpha(node.parent ? node.parent?.totalAlpha : 1)
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

   async setAsCurrent(layout: UILayout, animate: boolean = false) {
        if(animate) {
            if(this.currentLayout) {
                await this.currentLayout.event('exit');
                this.stage.root.removeChild(this.currentLayout.root);
                this.currentLayout = layout;
                this.currentLayout.event('exit', { instant: true });
                this.stage.root.addChild(this.currentLayout.root);
                await this.currentLayout.event('enter');
            } else {
                this.currentLayout = layout;
                this.stage.root.addChild(this.currentLayout.root);
            }
        } else {
            if(this.currentLayout) {
                this.stage.root.removeChild(this.currentLayout.root);
            }
            this.currentLayout = layout;
            this.stage.root.addChild(this.currentLayout.root);
       
        }
        
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