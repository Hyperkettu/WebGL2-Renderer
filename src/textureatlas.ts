import { Subtexture, TextureCoordinate } from "./subtexture";
import { Texture } from "./texture";
import { Renderer } from "./glrenderer";
import { RenderTargetState } from "./rendertarget";
import { Overlay } from "./overlay/overlay";
import { Sprite } from "./overlay/sprite";
import * as texture from './texturemanager';
import { loadFile } from "./resource";
import { type } from "os";
import { vec2, vec3 } from "gl-matrix";

interface TextureAtlasFile {
    subtextures?: SubTextureData[];
}

interface SubTextureData {
    textureCoordinates?: Vec2[];
    path: string;
}

interface Vec2 {
    x: number;
    y: number
}

export class TextureAtlas {

    static ATLAS_SIZE: { WIDTH: number, HEIGHT: number } = { WIDTH: 1024, HEIGHT: 1024 };
    static textureSize = 75;

    constructor(file: TextureAtlasFile) {
        this.subtextures = {};
    }

    async loadFromJson(gl: WebGL2RenderingContext, jsonPath: string, renderer: Renderer) {

        let textureDatas: texture.TextureData[] = [];
        this.atlasData = await loadFile<TextureAtlasFile>(jsonPath);
        for(let data of this.atlasData.subtextures.map(data => { const textureData: texture.TextureData = { path: data.path, type: 'albedo' }; return textureData; })) {
            textureDatas.push(data);
        }
        await texture.LoadTextures(gl, textureDatas);
        this.renderAtlasFromJsonData(renderer, renderer.overlay);
    }

    setTexture(texture: Texture) {
        this.texture = texture;
    }

    addTextures(paths: string[]) {
        this.texturePaths = paths;
    }

    renderAtlasFromJsonData(renderer: Renderer, overlay: Overlay) {
        const gl = renderer.gl;
        const context = renderer.getContext();
        const rts = new RenderTargetState(gl, 
            { x: 0, y: 0, width: TextureAtlas.ATLAS_SIZE.WIDTH, 
                height: TextureAtlas.ATLAS_SIZE.HEIGHT });
        this.renderTexture = Texture.createRenderTarget(gl, gl.RGBA, gl.RGBA, TextureAtlas.ATLAS_SIZE.WIDTH,
            TextureAtlas.ATLAS_SIZE.HEIGHT, gl.UNSIGNED_BYTE, gl.NEAREST, false, gl.NEAREST);
        rts.addColorTarget(gl, 0, this.renderTexture);
        context.renderTargetBegin(rts); 
        gl.clearColor(0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        const viewport = context.screenViewPort;
        context.setViewport(rts.viewport);

        overlay.camera.setProjection(0.0, rts.viewport.width, 0, rts.viewport.height, -1.0, 1.0);
        
        for(let subtextureData of this.atlasData.subtextures) {
            
            const tex = texture.GetTexture(subtextureData.path);
            const wholeTexture = new Subtexture(tex, 0, 0, tex.width, tex.height);
            const sprite = new Sprite('temporary', wholeTexture);
            const bottomLeftPos = subtextureData.textureCoordinates[TextureCoordinate.BOTTOM_LEFT];
            const toprightPos = subtextureData.textureCoordinates[TextureCoordinate.TOP_RIGHT];

            sprite.setAnchor(0.5, 0.5);
            sprite.setPosition(vec2.fromValues(0.5 * (bottomLeftPos.x + toprightPos.x), (bottomLeftPos.y + toprightPos.y) * 0.5));
            overlay.renderSprite(gl, sprite); 

            const topleftPos = subtextureData.textureCoordinates[TextureCoordinate.TOP_LEFT];

            this.subtextures[subtextureData.path] = new Subtexture(this.renderTexture, topleftPos.x, topleftPos.y,
                toprightPos.x - bottomLeftPos.x, bottomLeftPos.y - toprightPos.y);
        }

        context.renderTargetEnd();
        console.log(viewport);
        context.setViewport(viewport);
        overlay.camera.setProjection(0.0, window.innerWidth, window.innerHeight, 0, -1.0, 1.0);

        this.texture = this.renderTexture;
    }

    generateJson() {
        // assume textures are same sized for now
        const numTexturesX = Math.floor(TextureAtlas.ATLAS_SIZE.WIDTH / TextureAtlas.textureSize);
        const numTexturesY = Math.floor(TextureAtlas.ATLAS_SIZE.HEIGHT / TextureAtlas.textureSize);

        let index = 0;

        const data: TextureAtlasFile = {};
        data.subtextures = [];

        for(let y = 0; y < numTexturesY; y++) {

            if(this.texturePaths.length === index) {
                break;
            }

            for(let x = 0; x < numTexturesX; x++) {
                const path = this.texturePaths[index];

                const blX = x * TextureAtlas.textureSize;
                const blY = y * TextureAtlas.textureSize;
                const size = TextureAtlas.textureSize;

                data.subtextures[index] = {
                    path
                };

                data.subtextures[index].textureCoordinates = [];

                data.subtextures[index].textureCoordinates[TextureCoordinate.BOTTOM_LEFT] = 
                {   
                    x: blX,
                    y: blY + size 
                };

                data.subtextures[index].textureCoordinates[TextureCoordinate.BOTTOM_RIGHT] = 
                { 
                    x: blX + size,
                    y: blY + size
                }

                data.subtextures[index].textureCoordinates[TextureCoordinate.TOP_LEFT] = 
                { 
                    x: blX,
                    y: blY
                }

                data.subtextures[index].textureCoordinates[TextureCoordinate.TOP_RIGHT] = 
                { 
                    x: blX + TextureAtlas.textureSize,
                    y: blY
                }
                index++;

                if(this.texturePaths.length === index) {
                    break;
                }
            }
        }

        console.log(JSON.stringify(data));
    }

    renderTexture: Texture;
    texture: Texture;
    texturePaths: string[];
    subtextures: {[name: string]: Subtexture };

    atlasData: TextureAtlasFile;
}