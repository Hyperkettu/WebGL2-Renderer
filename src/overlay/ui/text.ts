import { TextureAtlas } from "../../textureatlas";
import { vec2 } from "gl-matrix";
import { Sprite } from "../sprite";
import { Container } from "../container";
import { Overlay } from "../overlay";
import * as math from '../../util/math';

export interface AtlasTextSettings {
    gapInPixels: number;
    atlas: TextureAtlas;
    style: 'normal' | 'tilted';
    lineWidth: number;
    lineHeight: number;
}

export class Text {
    constructor(overlay: Overlay, settings?: AtlasTextSettings) {
        this.overlay = overlay;
        this.atlas = settings ? settings.atlas : null;
        this.style = settings ? settings.style : 'normal';
        this.gapBetweeenLettersInPixels = settings?.gapInPixels;
        this.sprites = [];
        this.position = vec2.create();
        this.scale = vec2.create();
        this.container = new Container('text');
        this.overlay.stage.root.addChild(this.container);
        this.lineWidth = settings?.lineWidth;
        this.lineHeight = settings?.lineHeight;
    }

    setPosition(position: vec2) {
        this.position = position;
        this.container.setPosition(this.position);
    }

    setScale(scale: vec2) {
        this.scale = scale;
        this.container.setScale(this.scale);
    }

    setText(text: string) {
        this.text = text;

        let widthCounter = 0;
        let heightOffset = 0;
        let offsetX = 0;

        let words = this.text.split(' ');

        for(let index = 0; index < words.length; index++) {
            const word = words[index];

            if(offsetX + word.length * this.gapBetweeenLettersInPixels > this.lineWidth) {
                offsetX = 0;
                heightOffset += this.lineHeight;
            }

            for(let i = 0; i < word.length; i++) {
                const char = word.charAt(i);
                const subtexture = this.atlas.subtextures[`images/${char.toUpperCase()}.png`];
                const sprite = new Sprite('text-' + char, subtexture);
                sprite.setPosition(vec2.fromValues(offsetX, heightOffset));
                this.container.addChild(sprite);
                this.container.setPosition(this.position);
                this.sprites.push(sprite);

                widthCounter += this.gapBetweeenLettersInPixels;
                offsetX += this.gapBetweeenLettersInPixels

                if(this.style === 'tilted') {
                    if(math.randomFloat(0, 100) < 25) {
                        sprite.setAngle(math.DEG_TO_RAD * math.randomFloat(-7, 7));
                    }
                }
            }
            
            offsetX += this.gapBetweeenLettersInPixels

        }

    }

    container: Container;
    text: string;

    position: vec2;
    scale: vec2;
    rotation: number;

    sprites: Sprite[];
    atlas: TextureAtlas;

    style: 'normal' | 'tilted';

    gapBetweeenLettersInPixels: number;
    lineWidth: number;
    lineHeight: number;

    overlay: Overlay;
}