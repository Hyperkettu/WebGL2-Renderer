import { vec2, vec3, mat3 } from 'gl-matrix';
import { Texture } from '../texture';
import { Container } from './container';

export class Sprite extends Container {
    constructor(name: string, texture: Texture) {
        super(name);
        this.texture = texture;
        this.size = vec2.fromValues(this.texture.width, this.texture.height);
        this.tintColor = vec3.fromValues(1, 1, 1);
    }

    // affects anchor
    setPivot(x: number, y: number) {
        this.pivot = vec2.fromValues(x,y);
        vec2.set(this.anchor, x / this.size[0], y / this.size[1]);
        vec2.set(this.invPivot, -x, -y);
    }

    // affects anchor
    setAnchor(x: number, y: number) {
        vec2.set(this.anchor, x, y);
        this.setPivot(this.anchor[0] * this.size[0], this.anchor[1] * this.size[1] );
    }


    // affects scale
    setSize(width: number, height: number) {
        vec2.set(this.size, width, height);
        vec2.set(this.scale, width/this.texture.width, height/this.texture.height);
        this.setPivot(this.anchor[0] * this.size[0], this.anchor[1] * this.size[1]);
    }

    setScale(x: number, y: number) {
        vec2.set(this.scale, x, y);
        vec2.set(this.size, this.texture.width * this.scale[0], this.texture.height * this.scale[1]);
    }

    updateLocalTransform() {
        if(this.localDirty) {
            this.localDirty = false;
            mat3.identity(this.localTransform);
            mat3.translate(this.localTransform, this.localTransform, this.position);
            mat3.rotate(this.localTransform, this.localTransform, this.angle);
            mat3.translate(this.localTransform, this.localTransform, this.invPivot);
            mat3.scale(this.localTransform, this.localTransform, this.size);
            return true;
        }
        return false;
    }

    size: vec2;
    tintColor: vec3;
    
    texture: Texture; // TODO Subtexture with texcoords, textureatlas best fit
}