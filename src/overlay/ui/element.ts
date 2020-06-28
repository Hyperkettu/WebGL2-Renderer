import { vec2 } from "gl-matrix";
import { Container } from "../container";
import { Overlay } from "../overlay";
import * as layout from './layout';

export class Element {
    constructor(name: string, overlay: Overlay, layout: layout.UILayout, parent?: Element) {
        this.name = name;
        this.overlay = overlay;
        this.position = vec2.create();
        this.scale = vec2.fromValues(1, 1);
        this.rotation = 0;
        this.container = new Container('container');
        this.layout = layout;


        this.parent = parent;
        if(this.parent) {
            this.parent.container.addChild(this.container);
        }
        this.children = [];
    }

    recurse<T extends Element>(name: string, element: Element) {
        for(let child of element.children) {
            if(child.name === name) {
                return child;
            }
            const element = this.recurse(name, child) as T;
            if(element) {
                return element;
            }
        }

        return undefined;
    }

    find<T extends Element>(name: string) {
        return this.recurse(name, this) as T;
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
        this.rotation = angle;
        this.container.setAngle(this.rotation);
    }

    addChild(element: Element) {
        this.children.push(element);
        this.container.addChild(element.container);
    }

    toJson(): layout.ElementData {
        const data: layout.ElementData = {
            name: this.name,
            position: this.position,
            rotation: this.rotation,
            scale: this.scale,
            type: 'text',
            children: []
        };

        for(let child of this.children) {
            data.children.push(child.toJson());
        }
        return data;
    }

    name: string;

    container: Container;

    position: vec2;
    scale: vec2;
    rotation: number;

    parentAlign: vec2;
    
    overlay: Overlay;

    parent: Element;
    children: Element[];

    layout: layout.UILayout;
}