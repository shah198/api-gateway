// import express from 'express';

// const app = express();
// const port = 4000;
// app.get('/', (req, res) => {
//   res.send('This is gateway service');
// });
// app.listen(port);

import { DtoBase } from "./submodules/atpl-api-Dtos/submodules/atpl-api-common/DtoBase";
import { ResponseModel } from "./submodules/atpl-api-Dtos/submodules/atpl-api-common/ResponseModel";
import { RequestModel, RequestModelQuery } from "./submodules/atpl-api-Dtos/submodules/atpl-api-common/RequestModel";

const express = require("express");
//var awsIot = require('aws-iot-device-sdk');
const https = require('https');


//const sendRabbitMQ = require('./rabbitMQ');

//const rabbitMq = require('./rabbitMQ');


//import authAPI from "api-auth";

const fs2 = require('fs');

const options = {
  key: fs2.readFileSync('private.key'),
  cert: fs2.readFileSync('certificate.crt'),
  ca: fs2.readFileSync('ca_bundle.crt')
};

const http = require("http");
const cors = require("cors");
const socketIo = require("socket.io");
import  {Dictionary}  from "dictionaryjs";
let environment = process.env.NODE_ENV;
const port = 4000;
const index = require("./routes/index");
const bodyParser = require("body-parser");
//const openApiDocumentation = require('./openApiDocumentation');
const app = express();
//app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocumentation));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(index);
app.options("*", cors());
app.use(cors());
const server = https.createServer(options ,app);

var sockets = [];

let activeConnectionDict = new Dictionary();
let socketAndDeviceDict = new Dictionary();


let configFileName = `config-${environment}`;


console.log(configFileName);
if (!environment) {
  console.log("no environment specified using default i.e local environment");
  configFileName = "config-local";
}




var messageToUi = "";
//var sns = new AWS.SNS({ apiVersion: "2010-03-31" });
//var paramsSnsPublish = {
//Message: JSON.stringify({'ClusterName': process.env.CLUSTER_NAME, 'RecordName':process.env.RECORD_NAME}), /* required */
//ExchangeArn: process.env.UPDATE_RECORD_TOPIC_ARN
//};
//sns.publish(paramsSnsPublish, function (err, data) {
//if (err) console.log(err, err.stack); // an error occurred
//else console.log(data);           // successful response
//});


import { SNS_SQS } from "./submodules/atpl-api-AWS/SNS_SQS";
import { request } from "express";
import { json } from "body-parser";
import { Socket } from "dgram";
import { stringify } from "querystring";
var sns_sqs = SNS_SQS.getInstance();


import { RabbitMQ_Utility } from "./RabbitMQ_Utility";

const serviceHostResolver = {
  IOT_SERVICE: process.env.IOT_SERVICE,
  IOTSERVICE: process.env.IOTSERVICE

};

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "HEAD", "OPTIONS"],
    allowedHeaders: ["my-custom-header"],
    credentials: false,
  },
});



app.get('/connectdevice/:id/:socketid', (req, res) => {
  let deviceid = parseInt(req.params.id);

  console.log(typeof deviceid);


  let socketid = req.params.socketid;

  if (socketAndDeviceDict.contains(deviceid) != true) {
    socketAndDeviceDict.set(socketid, deviceid);
    console.log("connected");
 
    res.send("You're connected");

  }
  else {
    for (

      let [key, value] of socketAndDeviceDict.entries()) {
      if (deviceid === value && socketid === key) {
        res.send("Already connected");
        console.log("Already Connected");

      }
      else { res.send("Cant Connect"); console.log("Cant Connect"); }
    }
  }



});


 

io.on("connection", (socket) => {
  console.log("client connected with id: ", socket.id);

  // console.log("number of client connected : "+ String(activeConnectionDict.length));
  sockets.push(socket);

  var i = 0;

  activeConnectionDict.set(socket.id, socket);
  console.log("number of client connected : "+ String(activeConnectionDict.length));

  activeConnectionDict.set(socket.id, socket);
  console.log("number of client connected : "+ String(activeConnectionDict.length));
  

  
  socket.emit("socketIdFromServer", { socket_id: socket.id });
  socket.on("disconnect", () => {

    console.log("Client disconnected");
    // activeConnectionDict.remove(socket.id);
    activeConnectionDict.remove(socket.id);
    console.log("number of client connected : "+ String(activeConnectionDict.length));

    if (socketAndDeviceDict.has(socket.id) === true) {
      // device.publish(process.env.Request_ARN, JSON.stringify({
      //   "live_data": 0,
      //   "iot_device_id": socketAndDeviceDict.get[socket.id]
      activeConnectionDict.remove(socket.id);
      console.log("number of client connected : "+ String(activeConnectionDict.length));



      }
      //));
      
      socketAndDeviceDict.remove(socket.id);

      //device2.unsubscribe(process.env.Device_ARN);


    // }

    socket.disconnect(true);
  

  });
 });



app.post("/:servicename/:service", async (req:any, res:any) => {


  let requestBody: RequestModel<any> = req.body;
 

  

  let method_name = "POST";
  let service_name = req.params.servicename;
  let exchangeName = req.params.service + "_ADD";
  let id = 5;
  let message = JSON.stringify(requestBody);
  //console.log(message);
  var  myres = sns_sqs.publishMessageToTopics(
    service_name,
    exchangeName,
    method_name,
    message, id
  );
  

  // rabbitmq.publishMessageToExchanges(service_name,exchangeName,method_name,message,id);
//rabbitmq.recieveRabbitMQ(req.params.service+"_ADDED");
  //console.log(myres)
  res.status(200).send({ message: "request has been taken" });
  
});




/**
* Listeing to port
* 
*/

//https.createServer(options, app).listen(port, () => {
server.listen(port, () => {
  console.log(process.env.IOT_SERVICE);
  var noOfSocket = 1;
  sns_sqs.listenToServices(noOfSocket,"IOT_SERVICE", (result: { message: any; }) => {
    let { message } = result;
    console.log(message);
    //getting the browser socket to hom the response needs to be send
    let vSocket: any = activeConnectionDict.get(message.SocketId);
    if (vSocket) {
      console.log("response to client to call call back function", message);
      vSocket.emit("successResponseFromServer", message);
    }
  });
  sns_sqs.listenToServices(noOfSocket,"ERROR_RECEIVER", (result: { message: any; }) => {
    let { message } = result;
    console.log(message);
    let vSocket: any = activeConnectionDict.get(message.SocketId);
    if (vSocket) {
      vSocket.emit("errorResponseFromServer", message);
    }
  });
  console.log(`Listening on port ${port}`);
});


