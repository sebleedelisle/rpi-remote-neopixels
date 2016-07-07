dotstar=require("dotstar"); 
http = require('http'); 
socketio = require('socket.io'); 
SPI = require('pi-spi');
Color = require("color"); 
Gpio = require("pigpio").Gpio;
express = require('express');  //web server
app = express();

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
		edge: Gpio.RISING_EDGE
	}),
	capOutput = new Gpio(outPin, {
		mode: Gpio.OUTPUT
	});
	
capOutput.digitalWrite(0); 
//capInput.on('interrupt', inputTriggered);
var touchcount = 0; 

const ledStripLength = 48;

initPixels(); 

initServer(); 

function initServer() {
	console.log("initialising web server..."); 
	server = http.createServer(app);
	io = socketio.listen(server);	//web socket server
	server.listen(80); //start the webserver on port 8101
	app.use(express.static('public')); //tell the server that ./public/ contains the static webpages
	console.log("done."); 
}

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

io.sockets.on('connection', function (socket) { //gets called whenever a client connects
	socket.emit('colour', {hue:hue, sat:sat, light:light}); //send the new client the current state
	socket.emit('switch', on);
	socket.on('colour', function (data) { //makes the socket react to 'led' packets by calling this function
		//ledOn = data.value;  //updates brightness from the data object
		console.log(data); 
		//led.digitalWrite(ledOn);
		hue = data.hue; 
		sat = data.sat; 
		light = currentLight = data.light;

	//	console.log(ledOn); 
		socket.broadcast.emit('colour', data); //sends the updated brightness to all connected clients
	});
	socket.on('switch', function (data) { //makes the socket react to 'led' packets by calling this function
		console.log(data); 
		if(data==true) {
			on = true; 
		} else if(data==false) { 
			on = false; 
		}
		
		socket.broadcast.emit('switch', data); //sends the updated brightness to all connected clients
	});
});

var lastColour = -1; 
process.on('SIGINT', exit);

var interval = setInterval(update, 2); 

//setInterval(checkTouch, 100); 

console.log('CTRL-C to exit');
function update() { 
	
	var speed = light/100; 
	
	if((on)&&(currentLight<light)) {
		currentLight+=speed; 
	}
	
	if((!on)&&(currentLight>0)) {
		currentLight-=speed; 
	} 

	var c = Color().hsv(hue,sat,currentLight); 
	if(c.rgbNumber()!=lastColour) { 
		var r = c.red()/255; 
		var g = c.green()/255; 
		var b = c.blue()/255; 
		
		//white balance
		r*=0.8;
		b*=150/255; 
		
		// gamma
		r*=r; 
		g*=g; 
		b*=b;
		
		r*=255; 
		g*=255; 
		b*=255; 
		console.log(Math.round(r), Math.round(g), Math.round(b)); 
		for(var i = 0; i<ledStripLength;i+=3) { 
			ledStrip.set(i,r,g,b);
		}
		
		ledStrip.sync();
		lastColour = c.rgbNumber(); 
	}
	
	console.log(checkTouch());
}

function checkTouch() { 
	touchcount = 0; 
	var t=0, timeout = 100000; 
	//console.log("touch on"); 
	capInput.mode(Gpio.INPUT); 
	start = process.hrtime(); 
	capOutput.digitalWrite(1); 
	
	while(capInput.digitalRead() != 1) {
		t++; 
		if(t>timeout) return -1; 
	}
	
	capInput.mode(Gpio.OUTPUT); 
	capInput.digitalWrite(1); 
	capInput.mode(Gpio.INPUT); 
	capOutput.digitalWrite(0); 
	while(capInput.digitalRead()==0) { 
		t++; 
		if(t>timeout) return -1; 
	} 
	
	return process.hrtime(start);  
	
	//while((capInput.digitalRead()==0) && (!timeout))
	//	timeout = counter++>1000;
	//if(!timeout) console.log(process.hrtime(start)); 
	//setTimeout(touchTimeout, 100); 
	
}

// 
// function touchTimeout() { 
// //	console.log("touch timeout"); 
// 	capOutput.digitalWrite(0);	
// 	if(touchcount>0) console.log("touch");
// }
// 
// function inputTriggered() { 
// 	touchcount++; 
// 	//if(touchcount==1) { 
// 	//	console.log("touch registered"); 
// 	//	console.log(process.hrtime(start)); 
// 		capOutput.digitalWrite(0);
// //	}
// }


function exit() { 
	clearInterval(interval);
	ledStrip.all(0,0,0,1);
	ledStrip.sync();
	ledStrip.off();
	process.exit()
}
