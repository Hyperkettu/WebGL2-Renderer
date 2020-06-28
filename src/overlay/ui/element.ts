import { vec2 } from "gl-matrix";
import { Container } from "../container";
import { Overlay } from "../overlay";

export interface ElementData {
    parentAlign?: vec2;
}

export class Element {
    constructor(name: string, overlay: Overlay, parent?: Element) {
        this.name = name;
        this.overlay = overlay;
        this.position = vec2.create();
        this.scale = vec2.fromValues(1, 1);
        this.angle = 0;
        this.container = new Container('container');
      


        this.parent = parent;
        if(this.parent) {
            this.parent.container.addChild(this.container);
        }
        this.children = [];
    }

    recurse(name: string, element: Element): Element {
        for(let child of element.children) {
            if(child.name === name) {
                return child;
            }
            const element = this.recurse(name, child);
            if(element) {
                return element;
            }
        }

        return undefined;
    }

    find(name: string): Element {
        return this.recurse(name, this);
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

    addChild(element: Element) {
        this.children.push(element);
        this.container.addChild(element.container);
    }

    name: string;

    container: Container;

    angle: number;
    position: vec2;
    scale: vec2;
    rotation: number;

    parentAlign: vec2;
    
    overlay: Overlay;

    parent: Element;
    children: Element[];
}