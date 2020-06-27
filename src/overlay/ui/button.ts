import { Overlay } from "../overlay";
import { Element } from "./element";
import { Rectangle } from "../rectangle";
import { Sprite } from "../sprite";
import { vec2, mat3 } from "gl-matrix";
import { Animation } from "../animationsystem";
import { Text } from "./text";

export class Button extends Element {
    constructor(overlay: Overlay, sprite: Sprite, text: Text) {
        super(overlay);
        this.invWorld = mat3.create();
        this.point = vec2.create();
        this.container.setAnchor(0.5, 0.5);
        this.sprite = sprite;
        this.container.addChild(sprite);
        this.container.addChild(text.container);
        text.setPosition(vec2.fromValues(-0.5 * text.maxLineWidth * text.scale[0], -0.5 * text.numLines * text.lineHeight * text.scale[1]));

        this.rect = new Rectangle(0, 0, 1, 1);
        this.isClicked = false;
    }

    onClick(callback: (x: number, y: number) => void) {
        addEventListener('mousedown', event => {
            const x = event.x;
            const y = window.innerHeight - event.y;

            vec2.set(this.point,  x, y);

            mat3.invert(this.invWorld, this.sprite.worldTransform);
            vec2.transformMat3(this.point, this.point, this.invWorld);
            
            if(!this.isClicked && this.rect.containsPoint(this.point)) {
                this.isClicked = true;
                this.click();
                callback(x, y);
            }
        });
        addEventListener('mouseup', event => {
            if(this.isClicked) {
                this.isClicked = false;
                this.release();
            }
        });

    }

    click() {
        const animation = new Animation(this.container, 'scale', 'easeInOutCubic', 0.3, 'animate', 0);
        animation.setFrom([this.container.scale[0], this.container.scale[1]]);
        const clickedScale = 0.8;
        animation.setTo([this.container.scale[0] * clickedScale, this.container.scale[1] * clickedScale]);
        this.overlay.animationSystem.startAnimation([animation]);
    }

    release() {
        const animation = new Animation(this.container, 'scale', 'easeInOutCubic', 0.15, 'animate', 0);
        animation.setFrom([this.container.scale[0], this.container.scale[1]]);
        const releaseScale = this.scale[0];
        animation.setTo([releaseScale, releaseScale]);
        this.overlay.animationSystem.startAnimation([animation]);
    }

    invWorld: mat3;
    point: vec2;

    sprite: Sprite;
    text: Text;

    rect: Rectangle;
    isClicked: boolean;
}