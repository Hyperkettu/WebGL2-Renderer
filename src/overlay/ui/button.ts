import { Overlay } from "../overlay";
import { Element } from "./element";
import { Rectangle } from "../rectangle";
import { Sprite } from "../sprite";
import { vec2, mat3 } from "gl-matrix";
import { Animation } from "../animationsystem";
import { Text } from "./text";
import { ButtonData, UILayout } from "./layout";
import { Container } from '../container';

export class Button extends Element {
    constructor(name: string, overlay: Overlay, sprite: Sprite, text: Text, layout: UILayout) {
        super(name, overlay, layout);
        this.invWorld = mat3.create();
        this.point = vec2.create();
        this.centerContainer = new Container('center');
        this.container.addChild(this.centerContainer);
        this.centerContainer.setAnchor(0.5, 0.5);
        this.sprite = sprite;
        this.text = text;
        this.centerContainer.addChild(sprite);
        this.centerContainer.addChild(text.container);
        text.setPosition(vec2.fromValues(-0.5 * text.maxLineWidth * text.scale[0], -0.5 * text.numLines * text.lineHeight * text.scale[1]));
      //  text.setPosition([0 * 0.5, 0 * 0.5]);
      //  text.setAnchor([0.5, 0.5]);
        this.rect = new Rectangle(0, 0, 1, 1);
        this.isClicked = false;
    }

    setAnchor(anchor: vec2) {
        this.anchor = anchor;
        const size = this.getContentSize();
        this.container.setAnchor(anchor[0], anchor[1]);
        this.container.setPivot((1 - this.anchor[0]) * size[0] * this.sprite.scale[0], ( 1 - this.anchor[1]) * size[1] * this.sprite.scale[1]);
    }

    getContentSize() {
        return vec2.fromValues(this.sprite.texture.width, this.sprite.texture.height);
    }

    getSize() {
        return { x: this.sprite.size[0] * this.container.scale[0], y: this.sprite.size[1] * this.container.scale[1] };
    }

    onClick(callback: (x: number, y: number) => void) {

        this.layout.clickHandlers.push((x: number, y: number ) => {
            vec2.set(this.point,  x, y);
            mat3.invert(this.invWorld, this.sprite.worldTransform);
            vec2.transformMat3(this.point, this.point, this.invWorld);
            if(!this.isClicked && this.rect.containsPoint(this.point)) {
                this.isClicked = true;
                this.click();
                return this.isClicked;
            }
            return false;
        });

        this.layout.releaseClickHandlers.push((x: number, y: number) => {
            if(this.isClicked && (performance.now() - this.clickTime) < 250) {
                this.release();
                callback(x, y);
                return true;
            } else {
                this.isClicked = false;
            }
            return false;
        })
    }

    async click() {
        this.clickTime = performance.now();
    }

    release() {
        const animationPress = new Animation('click', this.container, 'scale', 'easeInOutCubic', 0.35, 'animate', 0);
        animationPress.setFrom([this.container.scale[0], this.container.scale[1]]);
        const clickedScale = 0.8;
        animationPress.setTo([this.container.scale[0] * clickedScale, this.container.scale[1] * clickedScale]);
        const animationRelease = new Animation('unclick', this.container, 'scale', 'easeInOutCubic', 0.2, 'animate', 0);
        animationRelease.setFrom([this.container.scale[0], this.container.scale[1]]);
        const releaseScale = this.scale[0];
        animationRelease.setTo([releaseScale, releaseScale]);
        animationRelease.setEndCallback(() => {
            this.isClicked = false;
        });
        this.overlay.animationSystem.startAnimation([animationPress, animationRelease], false);

    }

    toJson() {
        const data: ButtonData = {
            type: 'button',
            name: this.name,
            position: this.position,
            rotation: this.rotation,
            scale: this.scale,
            textData: this.text.toJson(),
            spriteData: {
                name: this.sprite.name,
                path: this.sprite.texture.path,
                position: this.sprite.position,
                rotation: this.sprite.angle,
                scale: this.sprite.scale,
                type: 'sprite',
                anchor: this.sprite.anchor,
            }
        };

        return data;
    }

    clickTime: number;

    centerContainer: Container;

    invWorld: mat3;
    point: vec2;

    sprite: Sprite;
    text: Text;

    rect: Rectangle;
    isClicked: boolean;
}