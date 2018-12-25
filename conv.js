"use strict";

const WRAPPING_MODES = ["wrap_zeros", "wrap_around", "wrap_stretch"];

class Convolution {
	constructor(kernel, kernelShape, wrappingMode){		
		// validate and default wrapping mode
		if (wrappingMode == undefined){
			this.wrappingMode = "wrap_zeros"
		}else if (WRAPPING_MODES.indexOf(wrappingMode) > -1){
			throw "Invalid Wrapping Mode"
		} else {
			this.wrappningMode = wrappingMode
		}
		
		// defaults
		if(kernel == undefined || kernel.length == undefined || kernelShape == undefined){
			kernelShape = [5,5]
			kernel = function(pos){
				return Math.hypot(pos[0] - 2, pos[1] - 2)
			}
		}
		
		// allow kernel to be the values of the function that generates the values
		if (typeof kernel == "function"){
			kernel = buildTensor(kernelShape, kernel)
		} 
		
		// validate the kernelShape
		if(kernelShape.length < 2){
			throw "Kernel size is invalid, number of dimentions must be >= 2"
		} else if (kernelShape.length > 4) {
			throw "Kernel size is invalid, number of dimentions must be <= 4"
		} else { // number of dimentions is valid, now validate each dimention
			const colorDim = kernelShape[2] || 1
			const forceDim = kernelShape[3] || 1

			if(!(colorDim == 1 || colorDim == 3 || colorDim == 4)){
				throw "Number of color dimentions " + colorDim + " is invalid, color can only be 1, 3 or 4 dimentional"
			}
			if(!(forceDim == 1 || forceDim == 2)){
				throw "Number of force dimentions " + forceDim + " is invalid, it must be either a scalar or vector (1 or 2)"
			}
		}
		
		// check that the kernel matches the kernelShape
		let expectedLength = kernelShape.length == 0 ? 0 : 1
		for(let i = 0; i < kernelShape.length; i ++){
			expectedLength *= kernelShape[i]
		}
		
		if (expectedLength != kernel.length){
			throw "The number of elements in kernel and kernelShape don't match"
		}
		
		// standardise the shape of the kernel
		if(kernelShape.length != 4){
			this.kernelShape = [kernelShape[0], kernelShape[1], 4, 2]
			this.kernel = buildTensor(this.kernelShape, function(pos){
				const x = pos[0];
				const y = pos[1];
				
				const correctCell = kernel[x][y];
				
				const col = pos[2];
				const force = pos[3];
				
				console.log(pos)
				
				let correctColor;
				if(kernelShape[2] == undefined){
					correctColor = correctCell;
				} else if (kernelShape[2] == 1){
					correctColor = correctCell[0]
				} else if (kernelShape[2] == 3) {
					if (col == 3){ // ignore alpha
						return 0
					} else {
						correctColor = correctCell[col]
					}
				} else { // kernelShape[2] == 4
					correctColor = correctColor[col]
				}
				
				if (kernelShape[3] == undefined) {
					return correctColor
				} else if(kernelShape[3] == 1){
					let value = correctColor[0]
					
					let xVec = x - kernelShape[0] / 2 + .5
					let yVec = y - kernelShape[1] / 2 + .5
					
					const mag = (xVec ** 2 + yVec ** 2) ** .5
										
					if (force == 0){
						xVec *= value / mag
						return xVec
					} else {
						yVec *= value / mag
						return yVec
					}
					
				} else {
					return correctColor[force]
				}
			})
		} else {
			this.kernel = kernel
			this.kernelShape = kernelShape
		}
		
	}
	
}

function buildTensor(dims, generator){
	const result = []
	let cells = dims.length == 0 ? 0 : 1
	for (let d = 0; d < dims.length; d ++){
		cells *= dims[d]
	}
	for(let cell = 0; cell < cells; cell ++){
		let loc = [0,0,0,0]
		let rem = cell
		for (let d = 0; d < dims.length; d ++){
			let a = rem % dims[d]
			loc.push(a)
			rem = Math.floor(rem / dims[d])
		}		
		result[cell] = generator(loc)
	}	
	return result
}

let test = function(){
	
	let kernel = buildTensor([5,5,2], function(cell){
		let x = cell[0] - 2
		let y = cell[1] - 2
		let z = cell[2]
		
		let mag = Math.pow(x * x + y * y,.5)
		x /= mag
		y /= mag
		
		if(z == 0){
			return y
		} else {
			return -x
		}
		
	})
	const conv = new Convolution(kernel)
	
	console.log(conv)
	
}

test()
