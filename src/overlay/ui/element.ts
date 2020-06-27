import { vec2 } from "gl-matrix";
import { Container } from "../container";
import { Overlay } from "../overlay";


export class Element {
    constructor(overlay: Overlay, parent?: Element) {
        this.overlay = overlay;
        this.position = vec2.create();
        this.scale = vec2.fromValues(1, 1);
        this.angle = 0;
        this.container = new Container('container');
      //  this.overlay.stage.root.addChild();
        this.parent = parent;
        if(this.parent) {
            this.parent.container.addChild(this.container);
        }
    }

    setPosition(position: vec2) {
        this.position = position;
        this.container.setPosition(this.position);
    }

    setScale(scale: vec2) {
        this.scale = scale;
        this.container.setScale(this.scale);
    }

    setRotation(angle: number) {
        this.angle = angle;
    }

    container: Container;

    angle: number;
    position: vec2;
    scale: vec2;
    rotation: number;
    
    overlay: Overlay;

    parent: Element;
    children: Element[];
}