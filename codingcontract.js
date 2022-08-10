/** @param {NS} ns */
export async function main(ns) {
	for(;;) {
		const contractExtension = ["cct"];
		const contractTypes = [{'grid':"Shortest Path in a Grid",'arrayjump':"Array Jumping Game",'arrayjumptwo':"Array Jumping Game II"
			,'rlecompression':"Compression I: RLE Compression",'lzdecompression':"Compression II: LZ Decompression",
			'spiralmatrix':"Spiralize Matrix",'largestprimefactor':"Find Largest Prime Factor",'triangleminpathsum':"Minimum Path Sum in a Triangle"}];

		let serverList = ["home"];
		let purchasedList = ns.getPurchasedServers()
		ns.disableLog("scan");
		ns.disableLog("sleep");
		ns.clearLog();

		let amountOfContracts = 0;
		for (let i = 0; i < serverList.length; i++) {
			let scanList = ns.scan(serverList[i]);
			for (let a = 0; a < scanList.length; a++) {
				let selectedServer = scanList[a];
				if (serverList.indexOf(selectedServer) !== -1 || purchasedList.indexOf(selectedServer) !== -1) {
					continue;
				}
				serverList.push(selectedServer);
				let filesOnServer = ns.ls(selectedServer);
				if(filesOnServer.length < 1) continue;
				let contractFiles = filesOnServer.filter(oFile => {
					if (contractExtension.indexOf(oFile.split(".")[1]) !== -1) { //if the extension of file in allowed array return true
						return true;
					}
				})
				if(contractFiles.length < 1) continue;
				ns.print("\n" + selectedServer + " contractFiles: " + contractFiles)
				for (let j = 0; j < contractFiles.length; j++) {
					let contractType = ns.codingcontract.getContractType(contractFiles[j], selectedServer);
					let contractData = ns.codingcontract.getData(contractFiles[j], selectedServer);
					let contractDescription = ns.codingcontract.getDescription(contractFiles[j], selectedServer); 
					ns.print("contractType: " + contractType)
					for (let type of contractTypes) {
						if(type.grid == contractType) {
							//await gridGame(ns, selectedServer, contractData); // unfinished
							amountOfContracts++;
						}
						else if(type.arrayjump == contractType && arrayJumpGame(ns, contractData, contractDescription, contractFiles, j, selectedServer)) {
							arrayJumpGame(ns, contractData, contractDescription, contractFiles, j, selectedServer); // Works!!! I am happy. :)
						}
						else if(type.arrayjumptwo == contractType) {
							arrayJumpGameTwo(ns, contractData, contractDescription, contractFiles, j, selectedServer); // Works!!! I am happy. :)
						}
						else if(type.rlecompression == contractType) {
							rleCompression(ns, contractDescription, contractData, contractFiles, j, selectedServer); // Tested and seems to work
						}
						else if(type.lzdecompression == contractType) {
							//lzDecompression(ns, contractDescription, contractData, selectedServer); // unfinished
							amountOfContracts++;
						}
						else if(type.spiralmatrix == contractType) {
							await spiralizeMatrix(ns, contractData, contractDescription, contractFiles, j, selectedServer); // Works!!! I am happy. :)
						}
						else if(type.largestprimefactor == contractType) {
							await largestPrimeFactor(ns, contractData, contractDescription, contractFiles, j, selectedServer); // Works!!! I am happy. :)
						}
						else if(type.triangleminpathsum == contractType) {
							await triangleMinPathSum(ns, contractData, contractDescription, contractFiles, j, selectedServer); // Works!!! I am happy. :)
						}
						else {
							amountOfContracts++;
						}
					}
				}
			}
			await ns.sleep(50);
		}
		ns.print("\nTotal amount of contracts: " + amountOfContracts)
		await ns.sleep(30000);
	}
}

async function largestPrimeFactor(ns, contractData, contractDescription, contractFiles, j, selectedServer) {

	// I didn't make the function

	ns.print("Largest Prime Factor");
	ns.print(contractDescription);
	ns.print("contractData: " + contractData);

	let num = contractData;
    //initialize the variable that will represent the divider
    let i = 2;

    //initialize the variable that will represent the quotient
    let numQuot = num;

    //array that will keep all the dividers
    let primeFactors = [];

    //execute until the quotient is equal to 1
        while(numQuot != 1) {

    //check if the division between the number and the divider has no reminder, if yes then do the division keeping the quotient in numQuot, the divider in primeFactors and proceed to restart the divider to 2, if not then increment i by one an check again the condition.
            if(numQuot % i == 0){
                numQuot /= i;
                primeFactors.push(i);
                i = 2;
            } else {
                i++;
            }
        }

    //initialize the variable that will represent the biggest prime factor. biggest is equal to the last position of the array, that is the biggest prime factor (we have to subtract 1 of .length in order to obtain the index of the last item)
    let answer = primeFactors[primeFactors.length - 1];

    //write the resutl
    ns.print(answer);
	let reward = ns.codingcontract.attempt(answer, contractFiles[j], selectedServer, { returnReward: true });
	if (reward) {
		ns.tprint("Reward of contract: " + reward);
		return true;
	}
}

async function triangleMinPathSum(ns, contractData, contractDescription, contractFiles, j, selectedServer) {

	ns.print("Triangle Min Path Sum");
	//ns.print("contractData: " + contractData);
	let rows = contractData.length;
	let reversedData = contractData.reverse();
	let shortestPath = [];
	for(let i = 0; i < reversedData.length; i++) {
		shortestPath[i] = [];
		//ns.print("reversedData: " + reversedData[i]);

		for(let j = 0; j < reversedData[i].length; j++) {
			if( i > 0) {
				shortestPath[i][j] = [];
				let smallestPreviousInteger;
				if(reversedData[i-1][j] == reversedData[i-1][j+1]) {
					let totalPathSumOne = 0;
					let totalPathSumTwo = 0;
					for(let k = 0; k < shortestPath[i-1].length; k++) {
						totalPathSumOne += shortestPath[i-1][j][k];
						totalPathSumTwo += shortestPath[i-1][j+1][k];
					}
					smallestPreviousInteger = totalPathSumOne > totalPathSumTwo ? [i-1,j+1] : [i-1,j];
				}
				else {
					smallestPreviousInteger = (reversedData[i-1][j] > reversedData[i-1][j+1] ? [i-1,j+1] : [i-1,j]);
				}
				shortestPath[i][j].push([reversedData[i][j], shortestPath[smallestPreviousInteger[0]][smallestPreviousInteger[1]]]);
			}
			else {
				shortestPath[i].push(reversedData[i][j]);
			}
			await ns.sleep(50);
		}
		await ns.sleep(50);
	}
    let answer = 0;
    let lastRow = JSON.stringify(shortestPath[shortestPath.length-1][shortestPath[shortestPath.length-1].length-1][0]).replace(/[,[\]]/g, "");
    for(let i = 0; i < lastRow.length; i++) {
        answer += parseInt(lastRow[i]);
    }
    let reward = ns.codingcontract.attempt(answer, contractFiles[j], selectedServer, { returnReward: true });
    if (reward) {
        ns.tprint("Reward of contract: " + reward);
        return true;
    }
}

function lzDecompression(ns, contractDescription, contractData, selectedServer) {
	ns.print(contractDescription);
	ns.print("contractData: " + contractData);
	ns.print("selectedServer: " + selectedServer);
	let chunkLength = -1;
	let chunkDigit = -1;
	let lzString = contractData;
	let currentSymbol = "";
	let nextSymbol = "";
	let builtString = "";
	//let chunkArray = [];
	let cursorIndex = 0;
	for (let t = 0; t < lzString.length; t++) {
		if (builtString == "") {
			currentSymbol = lzString[cursorIndex];
			nextSymbol = lzString[cursorIndex + 1];
		}
		else {
			currentSymbol = builtString[cursorIndex - 1];
			nextSymbol = builtString[cursorIndex];
		}
		ns.print("cursorIndex: " + cursorIndex);
		ns.print("currentSymbol: " + currentSymbol);
		if (currentSymbol > -1) {
			if (currentSymbol == 0) {
				cursorIndex++;
				//continue;
			}
			chunkLength = currentSymbol;
			chunkDigit = nextSymbol;
			if (typeof (chunkDigit) == "number") {
				builtString += builtString.slice(t - chunkDigit, (t - chunkDigit) + currentSymbol);
				cursorIndex += 2;
			}
			else {
				builtString = lzString.slice(t + 1, currentSymbol);
				cursorIndex += parseInt(currentSymbol);
			}
		}
		else {
			builtString += currentSymbol;
			cursorIndex++;
		}
		ns.print("builtString: " + builtString);
		if (t > 5)
			ns.exit();
		if (t == lzString.length - 2) {
			//break;
		}
	}
	/*
	Compression II: LZ Decompression
	You are attempting to solve a Coding Contract. You have 10 tries remaining, after which the contract will self-destruct.


	Lempel-Ziv (LZ) compression is a data compression technique which encodes data using references to earlier parts of the data. 
	In this variant of LZ, data is encoded in two types of chunk. Each chunk begins with a length L, 
	encoded as a single ASCII digit  1 to 9, followed by the chunk data, which is either:

	1. Exactly L characters, which are to be copied directly into the uncompressed data.
	2. A reference to an earlier part of the uncompressed data. To do this, the length is followed by a second ASCII digit X: 
	each of the L output characters is a copy of the character X places before it in the uncompressed data.

	For both chunk types, a length of 0 instead means the chunk ends immediately, and the next character is the start of a new chunk. 
	The two chunk types alternate, starting with type 1, and the final chunk may be of either type.

	You are given the following LZ-encoded string:
	9uP0cUHkSr01M3505757lqcG449YRaf8uluK02NZ755ZlY6r757pnWTMPL9936kk
	Decode it and output the original string.

	Example: decoding '5aaabb450723abb' chunk-by-chunk
	5aaabb           ->  aaabb
	5aaabb45         ->  aaabbaaab
	5aaabb450        ->  aaabbaaab
	5aaabb45072      ->  aaabbaaababababa
	5aaabb450723abb  ->  aaabbaaababababaabb
	*/
}

function rleCompression(ns, contractDescription, contractData, contractFiles, j, selectedServer) {
	ns.print("RLE Compression");
	ns.print("contractData: " + contractData);
	//ns.print("contractDescription: " + contractDescription);
	let dataForCompression = contractData;
	let counter = 0;
	let currentChar = dataForCompression[0];
	let nextChar = dataForCompression[0];
	let answer = "";
	for (var w = 0; w < dataForCompression.length; w++) {
		if (currentChar != nextChar || counter >= 9 || w == dataForCompression.length - 2) {
			answer += counter + currentChar;
			counter = 0;
		}
		if(w + 1 == dataForCompression.length)  {
			counter = 1;
			answer += counter + nextChar;
			break;
		}
		counter++;
		currentChar = dataForCompression[w];
		nextChar = dataForCompression[w + 1];
	}
	ns.print("answer: " + answer);
	let reward = ns.codingcontract.attempt(answer, contractFiles[j], selectedServer, { returnReward: true });
	if (reward) {
		ns.tprint("Reward of contract: " + reward);
		return true;
	}
}

function arrayJumpGame(ns, contractData, contractDescription, contractFiles, j, selectedServer) {
	ns.print("Array Jump");
	//ns.print("contractDescription: " + contractDescription);
	let arrayLength = contractData.length;
	let maxLength = 0;
	for (var k = 0; k < arrayLength; k++) {
		if (maxLength >= k) {
			if (contractData[k] + k >= maxLength) {
				maxLength = contractData[k] + k;
			}
		}
		else {
			break;
		}
	}
	if (maxLength < arrayLength) {
		let answer = 0;
		let reward = ns.codingcontract.attempt(answer, contractFiles[j], selectedServer, { returnReward: true });
		if (reward) {
			ns.tprint("Reward of contract: " + reward);
			return true;
		}
	}
	else {
		let answer = 1;
		let reward = ns.codingcontract.attempt(answer, contractFiles[j], selectedServer, { returnReward: true });
		if (reward) {
			ns.tprint("Reward of contract: " + reward);
			return true;
		}
	}
}

function arrayJumpGameTwo(ns, contractData, contractDescription, contractFiles, j, selectedServer) {
	ns.print("Array Jump 2");
	ns.print("contractData: " + contractData);
	//ns.print("contractDescription: " + contractDescription);
	let arrayLength = contractData.length;
	let maxLength = 0;
	for (var k = 0; k < arrayLength; k++) {
		if (maxLength >= k) {
			if (contractData[k] + k >= maxLength) {
				maxLength = contractData[k] + k;
			}
		}
		else {
			break;
		}
	}
	if (maxLength < arrayLength) {
		let answer = 0;
		let reward = ns.codingcontract.attempt(answer, contractFiles[j], selectedServer, { returnReward: true });
		if (reward) {
			ns.tprint("Reward of contract: " + reward);
			return true;
		}
	}
	else {
		let reversedArray = [];
		reversedArray = contractData;
		reversedArray.reverse();
		let currentIndex = 0;
		let jumpAmount = 0;
		let furthestJump = 0;
		for(let i = 0; i < reversedArray.length; i++) {
			currentIndex++;
			for(let a = 1; a < reversedArray.length; a++) {
				if(currentIndex + a < reversedArray.length) {
					if(reversedArray[currentIndex+a] >= a) {
						furthestJump = a;
					}
				}
			}
			currentIndex += furthestJump;
			jumpAmount++;
			if(currentIndex >= reversedArray.length -1) break;
		}
		let answer = jumpAmount;
		let reward = ns.codingcontract.attempt(answer, contractFiles[j], selectedServer, { returnReward: true });
		if (reward) {
			ns.tprint("Reward of contract: " + reward);
			return true;
		}
	}
}


async function spiralizeMatrix(ns, contractData, contractDescription, contractFiles, j, selectedServer) {
	//ns.print("Spiralize Matrix");
	//ns.print("contractDescription: " + contractDescription);
	//ns.print("contractData: " + contractData);
	let matrix = [];
	let answer = [];
	let currentDirection = 0;
	for(let i = 0; i < contractData.length; i++) {
		matrix.push(contractData[i]);
	}
	for(let i = 0; i < matrix.length; i++) {
		ns.print(matrix[i])
	}
	let directionsInRow = [0, +1, 0, -1];
	let directionsInColumn = [+1, 0, -1, 0];
	let row = 0;
	let column = 0;
	let rowStepsUp = 0;
	let columnStepsLeft = 0;
	let rowStepsDown = matrix.length;
	let columnStepsRight = matrix[0].length;
	let maxSteps = rowStepsDown * columnStepsRight;
	let currentStep = 0;
	while(matrix.length > 0 && matrix[0].length > 0) {
		answer.push(matrix[row][column])
		if(ifOutsideOfRowDownBounds(ns, row, directionsInRow, currentDirection, rowStepsDown)
			|| ifOutsideOfRowUpBounds(ns, row, directionsInRow, currentDirection, rowStepsUp)
			|| ifOutsideOfColumnRightBounds(ns, column, directionsInColumn, currentDirection, columnStepsRight)
			|| ifOutsideOfColumnLeftBounds(ns, column, directionsInColumn, currentDirection, columnStepsLeft)) {
			if(currentDirection == 0) {
				rowStepsUp++;
			}
			if(currentDirection == 1) {
				columnStepsRight--;
			}
			if(currentDirection == 2) {
				rowStepsDown--;
			}
			if(currentDirection == 3) {
				columnStepsLeft++;
			}
			currentDirection++;
			if(currentDirection >= 4) {
				currentDirection = 0;
			}
		}
		row += directionsInRow[currentDirection];
		column += directionsInColumn[currentDirection];
		currentStep++;
		if(maxSteps <= currentStep) break;
		await ns.sleep(50)
	}
	//ns.print(answer);
	let reward = ns.codingcontract.attempt(answer, contractFiles[j], selectedServer, { returnReward: true });
	if (reward) {
		ns.tprint("Reward of contract: " + reward);
		return true;
	}
}

function ifOutsideOfColumnLeftBounds(ns, column, directionsInColumn, currentDirection, columnStepsLeft) {
	//ns.print("ifOutsideOfColumnLeftBounds: " + ((column + directionsInColumn[currentDirection] < 0 || column + directionsInColumn[currentDirection] < columnStepsLeft) && currentDirection == 2))
	return ((column + directionsInColumn[currentDirection] < 0 || column + directionsInColumn[currentDirection] < columnStepsLeft) && currentDirection == 2);
}
function ifOutsideOfColumnRightBounds(ns, column, directionsInColumn, currentDirection, columnStepsRight) {
	//ns.print("ifOutsideOfColumnRightBounds: " + ((column + directionsInColumn[currentDirection] < 0 || column + directionsInColumn[currentDirection] >= columnStepsRight) && currentDirection == 0))
	return ((column + directionsInColumn[currentDirection] < 0 || column + directionsInColumn[currentDirection] >= columnStepsRight) && currentDirection == 0);
}

function ifOutsideOfRowDownBounds(ns, row, directionsInRow, currentDirection, rowStepsDown) {
	//ns.print("ifOutsideOfRowDownBounds: " + ((row + directionsInRow[currentDirection] < 0 || row + directionsInRow[currentDirection] >= rowStepsDown) && currentDirection == 1))
	return ((row + directionsInRow[currentDirection] < 0 || row + directionsInRow[currentDirection] >= rowStepsDown) && currentDirection == 1);
}
function ifOutsideOfRowUpBounds(ns, row, directionsInRow, currentDirection, rowStepsUp) {
	//ns.print("ifOutsideOfRowUpBounds: " + ((row + directionsInRow[currentDirection] < 0 || row + directionsInRow[currentDirection] <= rowStepsUp) && currentDirection == 3))
	return ((row + directionsInRow[currentDirection] < 0 || row + directionsInRow[currentDirection] < rowStepsUp) && currentDirection == 3);
}

async function gridGame(ns, selectedServer, contractData) {
	ns.print("Grid game");
	ns.print("contractData: " + contractData);
	//ns.print("contractDescription: " + contractDescription);
	let cellCount = 0;
	let completeGrid = [];
	let columns;
	ns.print(contractData);
	let rows = contractData.length;
	for (let row of contractData) {
		columns = row.length;
		let newRow = [];
		for (let cell of row) {
			if (cell == 1) {
				newRow.push(-1);
				cellCount++;
				//continue;
			}
			newRow.push(cellCount);
			cellCount++;
		}
		completeGrid.push(newRow);
		ns.print(newRow);
	}
	let adjacencyList = [];
	adjacencyList[0] = JSON.parse("{\"row\":[" + 0 + "],\"column\":[" + 0 + "]}");
	ns.print(adjacencyList);
	let directionsInRow = [-1, +1, 0, 0];
	let directionsInColumn = [0, 0, +1, -1];
	let currentRow = 0;
	let currentColumn = 0;
	let nextRow = 0;
	let nextColumn = 0;
	let stepCount = 0;
	let nodesNotVisited = cellCount;
	let endPoint = cellCount;
	let collectedNextColumnMoves = [0];
	let collectedNextRowMoves = [0];
	let visitedTiles = [];
	for (let e = 0; e < cellCount; e++) {
		({ adjacencyList, visitedTiles } = await checkNextStep(stepCount,
			adjacencyList, directionsInRow,
			directionsInColumn, columns, rows, completeGrid, endPoint, visitedTiles,
			ns));
		ns.print("adjacencyList: " + JSON.stringify(adjacencyList));
		if (stepCount > 2)
			ns.exit();
		stepCount++;
	}
	await ns.sleep(50);
	for (let row of adjacencyList) {
		ns.print(row);
	}
}

async function checkNextStep(stepCount, adjacencyList, directionsInRow, directionsInColumn,
		columns, rows, completeGrid, endPoint, visitedTiles,
		ns) {
    let nextRowMoves = [];
    let nextColumnMoves = [];
	for(let steps of adjacencyList) {
		if(steps.column.length > 1) {
			for(var i = 0; i < steps.length; i++) {
				ns.print("step.column: " + steps.row[i]);
				ns.print("step.row: " + steps.column[i]);
				await ns.sleep(5000);
				for (let o = 0; o < 4; o++) {
					let currentRow = steps.row[i];
					let currentColumn = steps.column[i];
					let nextRow = currentRow + directionsInRow[o];
					let nextColumn = currentColumn + directionsInColumn[o];
					if (nextColumn >= columns || nextRow >= rows) continue;
					if (nextColumn < 0 || nextRow < 0) continue;
					if (completeGrid[nextRow][nextColumn] == -1) continue;
					if (completeGrid[nextRow][nextColumn] == endPoint) break;
					let row = currentRow
					let column = currentColumn
					visitedTiles.push({row, column});
					nextRowMoves.push(nextRow);
					nextColumnMoves.push(nextColumn);
					await ns.sleep(50);
				}
			}
		}
		else {
			await ns.sleep(5000);
			for (let o = 0; o < 4; o++) {
				let currentRow = steps.row;
				let currentColumn = steps.column;
				let nextRow = currentRow + directionsInRow[o];
				let nextColumn = currentColumn + directionsInColumn[o];
				if (nextColumn >= columns || nextRow >= rows) continue;
				if (nextColumn < 0 || nextRow < 0) continue;
				if (completeGrid[nextRow][nextColumn] == -1) continue;
				if (completeGrid[nextRow][nextColumn] == endPoint) break;
				let row = currentRow
				let column = currentColumn
				visitedTiles.push({row, column});
				nextRowMoves.push(nextRow);
				nextColumnMoves.push(nextColumn);
				await ns.sleep(50);
			}
		}
	}
	await ns.sleep(50);
	adjacencyList.push(JSON.parse("{\"row\":"+1+",\"column\":"+2+"}"));
	adjacencyList[stepCount].row = nextRowMoves;
	adjacencyList[stepCount].column = nextColumnMoves;
    return { adjacencyList, visitedTiles };
}