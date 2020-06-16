import { Component } from './component';

export class CubeScript extends Component {

	constructor() {
		super();
		this.type = 'script';

		this.angle = 90;
	}

	update(dt: number) {
		this.node.transform.setRotation(0, this.angle, 3 * this.angle);
		// UNCOMMENT THIS TO MAKE CUBE ROTATE
		//	this.angle += dt * 12.0;
	}

	angle: number;

}