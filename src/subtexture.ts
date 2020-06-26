import { Texture } from "./texture";
import { vec2 } from "gl-matrix";

export enum TextureCoordinate {
    TOP_LEFT = 0,
    TOP_RIGHT,
    BOTTOM_LEFT,
    BOTTOM_RIGHT
}

export class Subtexture {
    constructor(texture: Texture, x: number, y: number, width: number, height: number) {
        this.texture = texture;
        this.textureCoordinates = [];

        for(let index = 0; index < 4; index++) {
            this.textureCoordinates[index] = vec2.create();
        }

        this.getSubTexture(x, y, width, height);
    }

    getSubTexture(x: number, y: number, width: number, height: number) {
        const topleftX = x / this.texture.width;
        const topleftY = y / this.texture.height;

        const toprightX = (x + width) / this.texture.width;
        const toprightY = y / this.texture.height;

        const bottomleftX = x / this.texture.width;
        const bottomleftY = (y + height)  / this.texture.height;

        const bottomrightX = (x + width) / this.texture.width;
        const bottomrightY = (y + height) / this.texture.height;

        this.textureCoordinates[TextureCoordinate.TOP_LEFT] = vec2.fromValues(topleftX, topleftY);
        this.textureCoordinates[TextureCoordinate.TOP_RIGHT] = vec2.fromValues(toprightX, toprightY);
        this.textureCoordinates[TextureCoordinate.BOTTOM_LEFT] = vec2.fromValues(bottomleftX, bottomleftY);
        this.textureCoordinates[TextureCoordinate.BOTTOM_RIGHT] = vec2.fromValues(bottomrightX, bottomrightY);
        this.width = width;
        this.height = height;
    }
 
    texture: Texture;
    width: number; 
    height: number;
    textureCoordinates: vec2[];
}