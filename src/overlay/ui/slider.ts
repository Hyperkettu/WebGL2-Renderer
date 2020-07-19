import { Overlay } from "../overlay";
import { Element } from "./element";
import { Rectangle } from "../rectangle";
import { Sprite } from "../sprite";
import { vec2, mat3 } from "gl-matrix";
import { Animation } from "../animationsystem";
import { Text } from "./text";
import { ButtonData, UILayout, SliderData } from "./layout";
import { Container } from '../container';
import { clamp, lerpNumber } from "../../util/math";

export class Slider extends Element {
    constructor(name: string, overlay: Overlay, background: Sprite, hold: Sprite, layout: UILayout) {
        super(name, overlay, layout);
        this.invWorld = mat3.create();
        this.point = vec2.create();
        this.centerContainer = new Container('center');
        this.container.addChild(this.centerContainer);
        this.centerContainer.setAnchor(0.5, 0.5);
        this.background = background;
        this.centerContainer.addChild(background);
        this.centerContainer.addChild(hold);
        hold.setPosition(vec2.fromValues(0, 0));
        this.hold = hold;
        this.rect = new Rectangle(0, 0, 1, 1);
        this.isDragged = false;
        this.value = 0;
        this.minValue = -1; 
        this.maxValue = 2;
    }

    setValues(min: number, value: number, max: number) {
        this.value = value;
        this.minValue = min;
        this.maxValue = max;

        const range = this.maxValue - this.minValue;
        const val = (this.value - this.minValue) / range;

        this.updateHoldPosition(val);
    }



    setAnchor(anchor: vec2) {
        this.anchor = anchor;
        const size = this.getContentSize();
        this.container.setAnchor(anchor[0], anchor[1]);
        this.container.setPivot((1 - this.anchor[0]) * size[0] * this.background.scale[0], ( 1 - this.anchor[1]) * size[1] * this.background.scale[1]);
    }

    getContentSize() {
        return vec2.fromValues(this.background.texture.width, this.background.texture.height);
    }

    getSize() {
        return { x: this.background.size[0] * this.container.scale[0], y: this.background.size[1] * this.container.scale[1] };
    }

    updateHoldPosition(value: number) {
        const contentSize = this.getContentSize();
                const xPos = lerpNumber(-contentSize[0] * 0.5, contentSize[0] * 0.5, value);
                this.hold.setPosition(vec2.fromValues(xPos, 0));
    }

    onDrag(callback: (value: number) => void) {

        this.layout.clickHandlers.push((x: number, y: number ) => {
            vec2.set(this.point,  x, y);
            mat3.invert(this.invWorld, this.background.worldTransform);
            vec2.transformMat3(this.point, this.point, this.invWorld);
            if(!this.isDragged && this.rect.containsPoint(this.point)) {
                this.isDragged = true;
                return true;
            }

            return false;

        });

        this.layout.releaseClickHandlers.push((x: number, y: number) => {
            this.isDragged = false;
            return false;
        })

        this.layout.dragHandlers.push((x: number, y: number) => {

            if(this.isDragged) {
                vec2.set(this.point,  x, y);
                mat3.invert(this.invWorld, this.background.worldTransform);
                vec2.transformMat3(this.point, this.point, this.invWorld);

                const value = clamp(this.point[0], 0, 1);
                this.value = lerpNumber(this.minValue, this.maxValue, value);

                this.updateHoldPosition(value);

                callback(this.value);
            }

            return this.value;
        });
    }



    toJson() {
        const data: SliderData = {
            type: 'slider',
            name: this.name,
            position: this.position,
            rotation: this.rotation,
            scale: this.scale,
            holdData: {
                name: this.hold.name,
                path: this.hold.texture.path,
                position: this.hold.position,
                rotation: this.hold.angle,
                scale: this.hold.scale,
                type: 'sprite',
                anchor: this.hold.anchor,
            },
            backgroundData: {
                name: this.background.name,
                path: this.background.texture.path,
                position: this.background.position,
                rotation: this.background.angle,
                scale: this.background.scale,
                type: 'sprite',
                anchor: this.background.anchor,
            }
        };

        return data;
    }

    centerContainer: Container;

    invWorld: mat3;
    point: vec2;

    background: Sprite;
    hold: Sprite;

    rect: Rectangle;
    isDragged: boolean;

    value: number;
    minValue: number;
    maxValue: number;

}