ws281x = require('rpi-ws281x-native');
http = require('http'); 
socketio = require('socket.io'); 
Color = require("color"); 
Gpio = require("pigpio").Gpio;
express = require('express');  //web server
app = express();

var server, 
	io, 
	spi,
	hue=48, 
	sat=50,
	light=40,
	currentLight = 0,
	on = true, 
	start; 
	
	
const ledStripLength = 189;
var pixelData = new Uint32Array(ledStripLength);

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

	ws281x.init(ledStripLength);
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
		//var r = c.red()/255; 
		//var g = c.green()/255; 
		//var b = c.blue()/255; 
		
		//white balance
		//r*=0.8;
		//b*=150/255; 
		
		// gamma
		//r*=r; 
		//g*=g; 
		//b*=b;
		
		// r*=255; 
		// 		g*=255; 
		// 		b*=255; 
		//console.log(Math.round(r), Math.round(g), Math.round(b)); 
		for(var i = 0; i<ledStripLength;i++) { 
			//pixelData[i] = ((r & 0xff) << 16) + ((g & 0xff) << 8) + (b & 0xff);
			pixelData[i] = c.rgbNumber();
		}
		
		ws281x.render(pixelData);
		lastColour = c.rgbNumber(); 
	}
	
}


function exit() { 
	ws281x.reset();
	process.nextTick(function () { process.exit(0); });
}
