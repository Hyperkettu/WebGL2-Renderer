export function createCanvas(width?: number, height?: number) {
	const canvas = document.createElement('canvas');
	canvas.style.position = 'absolute';
	canvas.style.left = '0px';
	canvas.style.top = '0px';
	canvas.style.border = '0px';
	canvas.style.padding = '0px';
	canvas.style.margin = '0px';
	canvas.style.width = '100%';
	canvas.style.height = '100%';
	canvas.width = width ? width : window.innerWidth;
	canvas.height = width ? width : window.innerHeight;
	return canvas;
}


