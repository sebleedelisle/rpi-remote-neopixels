dotstar=require("dotstar"); 
SPI = require('pi-spi');
Color = require("color"); 
Gpio = require("pigpio").Gpio;


var server, 
	io, 
	spi,
	ledStrip,
	hue=15, 
	sat=80,
	light=40,
	currentLight = 0,
	on = false, 
	outPin = 20,
	inPin = 21, 
	start; 
	
var capInput = new Gpio(inPin, {
		mode: Gpio.INPUT,
		pullUpDown: Gpio.PUD_OFF,
		edge: Gpio.EITHER_EDGE
	}),
	capOutput = new Gpio(outPin, {
		mode: Gpio.OUTPUT
	});
	
capOutput.digitalWrite(0); 
capInput.on('interrupt', inputTriggered);
var touchcount = 0; 

const ledStripLength = 48;

initPixels(); 

function initPixels() { 
	console.log("initialising pixels..."); 
	spi = SPI.initialize('/dev/spidev0.0');
	spi.clockSpeed(16e6);
	ledStrip = new dotstar.Dotstar(spi, {
	  length: ledStripLength
	});
	ledStrip.all(0,0,0,1);
	ledStrip.sync();
	console.log("done."); 
}

process.on('SIGINT', exit);

//var interval = setInterval(update, 2); 

//setInterval(checkTouch, 100); 
checkTouch();
console.log('CTRL-C to exit');
function update() { 

	
	
//	checkTouch();
	
}

function checkTouch() { 
	touchcount = 0; 
	var t=0, timeout = 100000; 
	//console.log("touch on"); 

	start = process.hrtime(); 
	capOutput.digitalWrite(1); 
	
		// 
		// while(capInput.digitalRead() != 1) {
		// 	t++; 
		// 	if(t>timeout) return -1; 
		// }
		// 
		// capInput.mode(Gpio.OUTPUT); 
		// capInput.digitalWrite(1); 
		// capInput.mode(Gpio.INPUT); 
		// capOutput.digitalWrite(0); 
		// while(capInput.digitalRead()==0) { 
		// 	t++; 
		// 	if(t>timeout) return -1; 
		// } 
		// 
		// return process.hrtime(start);  
		// 
	//while((capInput.digitalRead()==0) && (!timeout))
	//	timeout = counter++>1000;
	//if(!timeout) console.log(process.hrtime(start)); 
	setTimeout(touchTimeout, 200); 
	
}

// 
function touchTimeout() { 
	
	capOutput.digitalWrite(0);	
	if(touchcount>0) {} //console.log("touch");
	else console.log("touch timeout"); 
	setTimeout(checkTouch,200); 
}
// 
function inputTriggered(level) {
	if(level==0) {
		console.log("fall"); 
	 	return; 
	} else console.log("rise");
	touchcount++; 
	if(touchcount==1) { 
	//	console.log("touch registered"); 
		console.log(touchcount, process.hrtime(start)[1]/10000); 
		//capOutput.digitalWrite(0);
	}
}


function exit() { 
	clearInterval(interval);
	ledStrip.all(0,0,0,1);
	ledStrip.sync();
	ledStrip.off();
	process.exit()
}
