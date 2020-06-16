export function createCanvas() {
	const canvas = document.createElement('canvas');
	canvas.style.position = 'absolute';
	canvas.style.left = '0px';
	canvas.style.top = '0px';
	canvas.style.border = '0px';
	canvas.style.padding = '0px';
	canvas.style.margin = '0px';
	canvas.style.width = '100%';
	canvas.style.height = '100%';
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	return canvas;
}

let seconds = 0;
let fps = 0;


