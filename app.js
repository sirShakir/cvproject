 import * as cocoSsd from '@tensorflow-models/coco-ssd';
 import "regenerator-runtime/runtime";
 import * as tf from '@tensorflow/tfjs-node';
import { func } from '@tensorflow/tfjs-data';
 const { createCanvas, createImageData } = require('canvas');

var videoshow = require('videoshow')
var express = require('express');
var path = require('path');
const fs = require('fs');
const pug = require('pug');
var app = express();
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'pug');
var http = require('http').Server(app);
app.use(express.static(path.resolve('./public')));
const cv = require('opencv4nodejs');
var io = require('socket.io')(http);//require socket.io module and pass the http object (server)


app.get('/', function(req, res, next) {
    res.sendFile(path.join(__dirname, 'index.html'));
});

http.listen(3000, function(){
console.log('listening on *:3000');
});

io.sockets.on('connection', function (socket) {// (socketIO) Connection
    console.log("connect coneccted client");
      socket.on('mode_switch', function (mode_num) {
        console.log("mode is switching!!!!!")
        modes[0][1] = false;
        modes[1][1] = false;
        modes[2][1] = false;
        modes[3][1] = false;
        modes[0][2] = "deactivated";
        modes[1][2] = "deactivated";
        modes[2][2] = "deactivated";
        modes[3][2] = "deactivated";
        switch(mode_num) {
            case 1:
                modes[0][1] = true;
              break;
            case 2:
                    modes[1][1] = true;
              break;
            case 3:
                    modes[2][1] = true;
              break;
        }
      });
      socket.on('md_Activate', function () {
        console.log("motion_detection has been activated");
        modes[0][2] = "activated";
      });
      socket.on('md_Dectivate', function () {
        console.log("motion_detection has been deactivated");
        modes[0][2] = "deactivated";
      });
      socket.on('od_Activate', function () {
        console.log("object_detection has been activated");
        modes[1][2] = "activated";
      });
      socket.on('od_Dectivate', function () {
        console.log("object_detection has been deactivated");
        modes[1][2] = "deactivated";
      });
      socket.on('update_thresh', function (thresh_value) {
        console.log("New threshold value is " + thresh_value);
        threshold = thresh_value;
      });
      socket.on('update_sensitivity', function (sensitivity_value) {
        console.log("New sensitivity' value is " + sensitivity_value);
        sensitiviy = sensitivity_value;
      });
      // socket.on('requestFrame', function (thresh_value) {
      //    if (frame != null & frame != undefined){
      //      //frame = frame.resize(30,30);
      //      //const matAsBuffer = frame.getData(); 
      //      //let buffer = Buffer.from(matAsBuffer); console.log(buffer);
      //      let outBase64 =  cv.imencode('.jpg', frame).toString('base64'); // Perform base64 encoding
      //      io.emit('sendImage', outBase64); 
      //    }

      //  });    
});//end of socketio for robot controls

const modes = [
    ["Motion_Detection", true, "deactivated"],
    ["Object_Detection", false,  "deactivated"],
    ["Manual_Detection", false,  "deactivated"],
    ["Stream_Recording", false, "deactivated"]
]
const devicePort = 0;
const vCap = new cv.VideoCapture(devicePort);
vCap.set(cv.CAP_PROP_FRAME_WIDTH, 640)
vCap.set(cv.CAP_PROP_FRAME_HEIGHT, 360)
const delay = 100;
var frame;
var gray;
var previous_frame;
var pframe_delay = true;
//var frameDelta;
//var thresh;
//var cnts;
var threshold = 10;// # area of contour min size
var sensitiviy = 3; // #amount of contour(object) needed for min detection found
function intervalFunc(){
    for(let mode in modes){
        if(modes[mode][0] == "Motion_Detection" && modes[mode][1] == true){
            motion_Detection(); 
        }
        if(modes[mode][0] == "Object_Detection" && modes[mode][1] == true){
            object_Detection();
        }
        if(modes[mode][0] == "Manual_Detection" && modes[mode][1] == true){
            manual_Detection();
        }
        if(modes[mode][0] == "Stream_Recording" && modes[mode][1] == true){
            recordStream();     
        }
    }  
}
//1000/10
setInterval(intervalFunc,200);//200


async function motion_Detection(){
    //console.log("wlecome to motion detection");
    if(pframe_delay == true){
        previous_frame = vCap.read();
        previous_frame = previous_frame.bgrToGray()
        previous_frame = previous_frame.gaussianBlur(new cv.Size(1, 21), 0);
        pframe_delay = false;
    }else{
        previous_frame = gray;
    }

    frame = vCap.read();
    gray = frame.bgrToGray();

    gray = gray.gaussianBlur(new cv.Size(1, 21), 0);
    var frameDelta = gray.absdiff(previous_frame);
    var thresh = frameDelta.threshold( 25, 255, cv.THRESH_BINARY);
    var cnts = thresh.findContours(1,1);

    var count =0;
    for(let zz in cnts){
       if(cnts[zz].area > threshold){
           count++;
           //console.log('There was change: ' + cnts[zz].area);
       }
    }
    if(count > 3 && modes[0][2] == "activated"){
        modes[0][1] = false;
        modes[0][2] = "deactivated";
        modes[3][1] = true;
        modes[3][2] = "activated";
         console.log("motion was detected & counted " + count);
    } 

    let outBase64 =  cv.imencode('.jpg', frame).toString('base64'); // Perform base64 encoding
    io.emit('sendImage', outBase64);
      
    // cv.imshow('a window name', frame);
    // cv.waitKey(delay);
}

function manual_Detection(){
    frame = vCap.read();
    //let outBase64 =  cv.imencode('.jpg', frame).toString('base64'); // Perform base64 encoding
    //io.emit('sendImage', outBase64);  
}
var model =  cocoSsd.load();
async function object_detection_setup(){
   model = await cocoSsd.load();
}
 object_detection_setup();
 async function object_Detection(){
  frame = vCap.read();
  //const model = await cocoSsd.load();

    const matRGBA = frame.channels === 1
    ? frame.cvtColor(cv.COLOR_GRAY2RGBA)
    : frame.cvtColor(cv.COLOR_BGR2RGBA);

    // create new ImageData from raw mat data
    const imgData = createImageData(
    new Uint8ClampedArray(matRGBA.getData()),
    frame.cols,
    frame.rows
    );

    const canvas = createCanvas(frame.cols, frame.rows);
    const ctx = canvas.getContext('2d')
    ctx.putImageData(imgData, 0, 0);
    var theInput = tf.browser.fromPixels(canvas);
      
  // // Classify the image.
  var predictions = await model.detect(theInput);    

  // // console.log('Predictions:');
  // // console.log(predictions);  
      if(predictions != null && predictions != undefined){
        const point1 = new cv.Point(predictions[0]['bbox'][0]  ,predictions[0]['bbox'][1] );
        //const point1 = new cv.Point(200 ,200 );
        //const point2 = new cv.Point(400,400);
        const point2 = new cv.Point(predictions[0]['bbox'][2] + predictions[0]['bbox'][0]   ,predictions[0]['bbox'][3] + predictions[0]['bbox'][1]);
        frame.drawLine(point1, point2);
        frame.drawRectangle(point1, point2);
     }
    let outBase64 =  cv.imencode('.jpg', frame).toString('base64'); // Perform base64 encoding
    io.emit('sendImage', outBase64);
    //cv.imshow("A window2", frame);
    //cv.waitKey(100);     
}







var videoOptions = {
    fps: 25,
    loop: 0.20, // seconds
    transition: false,
    transitionDuration: 0,
    captionDelay: 0,
    useSubRipSubtitles: false,
    subtitleStyle: null,
    videoBitrate: 1024,
    videoCodec: 'libx264',
    size: '640x?',
    audioBitrate: '128k',
    audioChannels: 2,
    format: 'mp4'
  }
var image_Stream = [];
var file_Extension = ".jpg";
var push_Count = 45; //==9 seconds
function recordStream(){
     frame = vCap.read();
    // let outBase64 =  cv.imencode('.jpg', frame).toString('base64'); // Perform base64 encoding
    // io.emit('sendImage', outBase64);

     if(push_Count > sensitiviy){
        cv.imwrite('./saves/save'+ push_Count + file_Extension, frame);
         let file_Name = "./saves/save" + push_Count + file_Extension;
         image_Stream.push(file_Name);
         push_Count --;
         console.log(image_Stream);
    }


    if(push_Count == 0){
         push_Count = -100;
        console.log("System Processing recordStream function---wait for response");
        videoshow(image_Stream, videoOptions)
        .save('product_video.mp4')
        .on('error', function () { 
            console.log("Error has occured during videoshow processing. Check if ffmpeg is installed properly");
        })
        .on('end', function () {console.log("MP4 save was completed; switching back to deactivated motion detetion mode.");
        modes[3][1] = false;
        modes[3][2] = "deactivated";
        modes[0][1] = true;    
        })
    }
}


