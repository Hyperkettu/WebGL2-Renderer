import { TextureAtlas } from "../../textureatlas";
import { vec2 } from "gl-matrix";
import { Sprite } from "../sprite";
import { Container } from "../container";
import { Overlay } from "../overlay";
import * as math from '../../util/math';
import { Animation } from "../animationsystem";
import { Element } from "./element";
import { TextData, SpriteData, UILayout } from "./layout";
import { Texture } from "../../texture";
import { Subtexture } from "../../subtexture";
import * as texture from '../../texturemanager';

export interface SpriteSettings {
    path: string;
    separate?: boolean;
}

export class UISprite extends Element {
    constructor(name: string, overlay: Overlay, layout: UILayout, settings?: SpriteSettings) {
        super(name, overlay, layout);
        if(settings.separate !== undefined && settings.separate === true) {
            const tex = texture.GetTexture(settings?.path);
            const subtexture = new Subtexture(name, tex, 0, 0, tex.width, tex.height);
            this.sprite = new Sprite(name, subtexture);  
        } else {
            this.sprite = new Sprite(name, overlay.textureAtlas.subtextures[settings?.path]);
        }
        this.container.addChild(this.sprite);
    }

    getSize() {
        return { x: this.sprite.size[0], y: this.sprite.size[1] };
    }

    getContentSize() {
        return vec2.fromValues(this.sprite.texture.width, this.sprite.texture.height);
    }

    setAnchor(anchor: vec2) {
        this.anchor = anchor;
        this.sprite.setAnchor(anchor[0], anchor[1]);
    }

    setPosition(position: vec2) {
        this.position = position;
        this.container.setPosition(this.position);
    }

    setScale(scale: vec2) {
        this.scale = scale;
        this.container.setScale(this.scale);
    }

    setRotation(rotation: number) {
        super.setRotation(rotation);
    }

    addMask(mask: Texture) {
        this.sprite.mask = mask;
    }

    toJson() {
        const data: SpriteData = {
            name: this.name,
            position: this.position,
            rotation: this.rotation,
            scale: this.scale,
            type: 'sprite',
            path: this.sprite.texture.path,
            anchor: this.sprite.anchor,
            children: []
        };

        for(let child of this.children) {
            data.children.push(child.toJson());
        }

        return data;
    }

    anchor: vec2;
    sprite: Sprite;
    atlas: TextureAtlas;

}