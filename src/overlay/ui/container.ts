import { Element } from './element';
import { Overlay } from '../overlay';
import { UILayout } from './layout';
import { Size } from '../../app/statemachine';
import { vec2 } from 'gl-matrix';

export class Container extends Element {
    constructor(name: string, overlay: Overlay, layout: UILayout, parent?: Element) {
        super(name, overlay, layout, parent);
    }

    addChild(element: Element) {
        this.children.push(element);
        this.container.addChild(element.container);
        this.computeBounds();
        this.setAnchor(this.anchor);
    }

    getContentSize() {
        if(this.contentSize) {
            return this.contentSize;
        } else {
            this.computeBounds();
            return this.contentSize;
        }
    }

    private computeBounds() {
        const min: Size = { x: 0, y: 0};
        const max: Size = { x: 0, y: 0};
        this.getSizeFromChildren(min, max);
        const width = max.x - min.x;
        const height = max.y - min.y;
        this.contentSize = vec2.fromValues(width, height);
    }

    setAnchor(anchor: vec2) {
        this.anchor = anchor;
        const contentSize = this.getContentSize();
        this.container.setAnchor(anchor[0], anchor[0]);
        this.container.setPivot(this.anchor[0] * contentSize[0], this.anchor[1] * contentSize[1]);
    }

    getSize() {
        const contentSize = this.getContentSize();
        return { x: this.scale[0] * contentSize[0], y: this.scale[1] * contentSize[1] };
    }

    getSizeFromChildren(min: Size, max: Size) {
        for(let child of this.children) {
            const size = child.getSize();
            const maxX = child.position[0] + size.x;
            const minX = child.position[0] - size.x;
            const maxY = child.position[1] + size.y;
            const minY = child.position[1] - size.y;
            max.x = Math.max(max.x, maxX);
            max.y = Math.max(max.y, maxY);
            min.x = Math.min(min.x, minX);
            min.y = Math.min(min.y, minY);
        }
    }
}