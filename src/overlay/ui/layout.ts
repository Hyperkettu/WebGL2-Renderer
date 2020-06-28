import { Overlay } from "../overlay";
import { Text } from './text';
import { vec2 } from "gl-matrix";
import { Container } from "../container";
import { Renderer } from "../../glrenderer";
import { Button } from "./button";
import { Element } from "./element";
import * as math from '../../util/math';

export class UILayout {
    constructor(renderer: Renderer, overlay: Overlay, logicalSize: vec2) {
        this.renderer = renderer;
        this.overlay = overlay;
        this.logicalSize = logicalSize;
        this.children = [];
        this.root = new Container('root');
        this.overlay.stage.root.addChild(this.root);

        this.size = vec2.create();
        const size = vec2.fromValues(window.innerWidth, window.innerHeight);
        this.resize(size);

    }

    addElement<T extends Element>(element: T) {
        this.root.addChild(element.container);
        this.children.push(element);
    }
    
    find(name: string) {
        for(let child of this.children) {
            if(child.name === name) {
                return child;
            }
            const element = child.find(name);

            if(element) {
                return element;
            }
        }

        return undefined;
    }

    mapToScreen(vector: vec2, size: vec2) {
        const screenSize = vec2.create();
        const scale = Math.min(size[0] / this.logicalSize[0], size[1] / this.logicalSize[1]);
        vec2.scale(screenSize, vector, scale);
        return screenSize;
    }

    mapToLogical(vector: vec2, size: vec2) {
        const scale = this.mapToScreen(vec2.fromValues(1,1), size);
        const logical = vec2.create();
        vec2.scale(logical, vector, 1 / scale[0]);
        return logical;
    }

    resize(size: vec2) {
        if(this.size[0] !== size[0] || this.size[1] !== size[1]) {
            this.size = size;
            const scale = this.mapToScreen(vec2.fromValues(1,1), this.size);
            this.root.setScale(scale);

            for(let child of this.children) {
                
                const position = this.mapToLogical(child.position, this.size);
                child.container.setPosition(position);
            }
        }
    }

    renderer: Renderer;

    size: vec2;

    children: Element[];

    root: Container;
    logicalSize: vec2;
    overlay: Overlay;
}