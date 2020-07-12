import { TextureAtlas } from "../../textureatlas";
import { vec2 } from "gl-matrix";
import { Sprite } from "../sprite";
import { Container } from "../container";
import { Overlay } from "../overlay";
import * as math from '../../util/math';
import { Animation } from "../animationsystem";
import { Element } from "./element";
import { TextData, UILayout } from "./layout";

export type TextAnimation = 'none' | 'bounce' | 'one-by-one';

export interface AtlasTextSettings {
    gapInPixels: number;
    atlas: TextureAtlas;
    style: 'normal' | 'tilted';
    lineWidth: number;
    lineHeight: number;
    textAppearAnimation: TextAnimation;
    animationSpeed?: number;
    delay?: number;
}

export class Text extends Element {
    constructor(name: string, overlay: Overlay, layout: UILayout, settings?: AtlasTextSettings) {
        super(name, overlay, layout);
        this.atlas = settings ? settings.atlas : null;
        this.style = settings ? settings.style : 'normal';
        this.gapBetweenLettersInPixels = settings?.gapInPixels;
        this.sprites = [];
        this.lineWidth = settings?.lineWidth;
        this.lineHeight = settings?.lineHeight;
        this.textAppearAnimation = settings?.textAppearAnimation;
        this.animationSpeed = settings?.animationSpeed;
        this.delay = settings?.delay;
    }

    show() {
        if(this.textAppearAnimation === 'bounce') {
            this.appearTextBounceAnimation();
        } else if(this.textAppearAnimation === 'one-by-one') {
            this.appearTextOneByOne();
        } else if(this.textAppearAnimation === 'none') {
            this.sprites.forEach(sprite => sprite.setAlpha(1));
        }
    }

    private appearTextOneByOne() {
        const animations: Animation[] = [];

        this.sprites.forEach(sprite => {
            const animation = new Animation('text-appear-one-by-one', sprite, 'alpha', 'easeInOutCubic', this.delay, 'animate', 0);
            animation.setFrom([0]);
            animation.setTo([1]);
            animations.push(animation);
        });

        this.overlay.startAnimation(animations, false);
    }

    private appearTextBounceAnimation() {
        const animations: Animation[] = [];
        let animation: Animation = null;
        let delay = 0;
        this.sprites.forEach(sprite => {
            const duration = 100 / this.animationSpeed;
            animation = new Animation('text-appear', sprite, 'position', 'easeOutBounce', duration , 'animate', delay);
            animation.setTo([sprite.position[0], sprite.position[1]]);
            animation.setFrom([ sprite.position[0], sprite.position[1] - 200 ]);
            delay += (duration * this.delay);

            animation.setStartCallback(() => {
                sprite.setAlpha(1);
            });

            this.overlay.startAnimation([animation], false);
        });

        this.overlay.startAnimation(animations, false);
    }

    hide() {
        this.sprites.forEach(sprite => {
            sprite.setAlpha(0);
        });
    }

    setPosition(position: vec2) {
        this.position = position;
        this.container.setPosition(this.position);
    }

    setScale(scale: vec2) {
        this.scale = scale;
        this.container.setScale(this.scale);
    }

    getContentSize() {
        this.contentSize = vec2.fromValues(this.maxLineWidth, this.numLines * this.lineHeight);
        return this.contentSize;
    }

    getSize() {
        const contentSize = this.getContentSize();
        return { x: this.scale[0] * contentSize[0], y: this.scale[1] * contentSize[1] };
    }

    setAnchor(anchor: vec2) {
        this.anchor = anchor;
        const contentSize = this.getContentSize();
        this.container.setAnchor(anchor[0], anchor[1]);
        this.container.setPivot(this.anchor[0] * contentSize[0], this.anchor[1] * contentSize[1]);
    }

    setText(text: string) {

        this.container.children = [];

        this.text = text;

        let heightOffset = 0;
        let offsetX = 0;
        this.numLines = 0;
        this.maxLineWidth = 0;

        let words = this.text.split(' ');

        const lineWidths: number[] = [];

        for(let index = 0; index < words.length; index++) {
            const word = words[index];

            if(offsetX + word.length * this.gapBetweenLettersInPixels > this.lineWidth) {
                offsetX = 0;
                lineWidths.push(offsetX + this.gapBetweenLettersInPixels);
                heightOffset += this.lineHeight;
                this.numLines++;
            }

            for(let i = 0; i < word.length; i++) {
                const char = word.charAt(i);
                const subtexture = this.atlas.subtextures[`images/${char.toUpperCase()}.png`];
                const sprite = new Sprite('text-' + char + index, subtexture);
                sprite.setPosition(vec2.fromValues(offsetX, heightOffset));
                this.container.addChild(sprite);
                this.container.setPosition(this.position);
                this.sprites.push(sprite);

                offsetX += this.gapBetweenLettersInPixels

                if(this.style === 'tilted') {
                    if(math.randomFloat(0, 100) < 25) {
                        sprite.setAngle(math.DEG_TO_RAD * math.randomFloat(-7, 7));
                    }
                }
            }
            
            offsetX += this.gapBetweenLettersInPixels

        }

        for(let width of lineWidths) {
            if(width > this.maxLineWidth) {
                this.maxLineWidth = width;
            }
        }

        this.maxLineWidth = Math.max(this.maxLineWidth, offsetX);
        this.numLines = Math.max(this.numLines, 1);

       
    }

    toJson() {
        const data: TextData = {
            name: this.name,
            position: this.position,
            rotation: this.rotation,
            scale: this.scale,
            text: this.text,
            type: 'text',
            atlasText: {
                letterStyle: this.style,
                letterWidth: this.gapBetweenLettersInPixels,
                letterHeight: this.lineHeight,
                lineWidth: this.maxLineWidth,
                textAppearAnimation: this.textAppearAnimation
            }
        };
        return data;
    }

    text: string;

    sprites: Sprite[];
    atlas: TextureAtlas;

    style: 'normal' | 'tilted';

    gapBetweenLettersInPixels: number;
    lineWidth: number;
    lineHeight: number;

    animationSpeed: number;
    delay: number;

    numLines: number;
    maxLineWidth: number;

    textAppearAnimation: TextAnimation;
}