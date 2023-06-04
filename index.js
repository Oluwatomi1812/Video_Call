// Install required dependencies:
// npm install express socket.io

// Import necessary modules
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Serve static files
app.use(express.static('public'));

// Handle WebSocket connections
io.on('connection', (socket) => {
  console.log('New WebSocket connection:', socket.id);

  // Handle signaling messages
  socket.on('offer', (data) => {
    // Process the received offer and send it to the intended recipient
    // You may store the offer in a database or use other techniques to route it

    // Example: Broadcasting the offer to all connected sockets
    socket.broadcast.emit('offer', data);
  });

  socket.on('answer', (data) => {
    // Process the received answer and send it to the intended recipient
    // You may store the answer in a database or use other techniques to route it

    // Example: Broadcasting the answer to all connected sockets
    socket.broadcast.emit('answer', data);
  });

  socket.on('ice-candidate', (data) => {
    // Process the received ICE candidate and send it to the intended recipient
    // You may store the candidate in a database or use other techniques to route it

    // Example: Broadcasting the ICE candidate to all connected sockets
    socket.broadcast.emit('ice-candidate', data);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('WebSocket disconnected:', socket.id);
  });
});

// JavaScript
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;//stores local media stream(video and audio)
let remoteStream;//stores the other person's media stream
let peerConnection;//object responsible for establishing a peer-to-peer connection


// Start the video call
startButton.addEventListener('click', startCall);

function startCall() {
  navigator.mediaDevices.getUserMedia({ video: true, audio: true })//access video and audio
    .then((stream) => {
      localStream = stream;//stores media stream in variable
      localVideo.srcObject = localStream;//tthe video source object is the local stream

      createPeerConnection();//creates a connection between participants
      addLocalStreamToPeerConnection();//add video and audio to the connection
      startNegotiation();//agree of settings
    })
    .catch((error) => {
      console.error('Error accessing media devices:', error);
    });
}

// Stop the video call
stopButton.addEventListener('click', stopCall);

function stopCall() {
  if (peerConnection) {
    peerConnection.close();//if peerConnection is active, end the connection
    peerConnection = null;//set variable to null to stay inactive
  }
  localVideo.srcObject = null;//ends local video stream
  remoteVideo.srcObject = null;//ends participants video stream
}

// Create the peer connection
function createPeerConnection() {
  peerConnection = new RTCPeerConnection();//create new connection object

  peerConnection.addEventListener('track', (event) => {//track event is triggered when participant streams video
    remoteStream = event.streams[0];//extracts the first stream of video and audio from the participant
    remoteVideo.srcObject = remoteStream;
  });
}

// Add the local stream to the peer connection
function addLocalStreamToPeerConnection() {
  localStream.getTracks().forEach((track) => {//calls all tracks from the localStream, iterates through them
    peerConnection.addTrack(track, localStream);//adds the track to the peerConnection object
  });
}

// Start the negotiation process
function startNegotiation() {
  peerConnection.createOffer()
    .then((offer) => {
      return peerConnection.setLocalDescription(offer);//sets offer as local description
    })
    .then(() => {
      // Send the offer to the remote participant using the signaling mechanism
    })
    .catch((error) => {
      console.error('Error creating offer:', error);
    });
}

// Handle the received offer from the remote participant
function handleOffer(offer) {
  peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
    .then(() => {
      return peerConnection.createAnswer();
    })
    .then((answer) => {
      return peerConnection.setLocalDescription(answer);
    })
    .then(() => {
      // Send the answer to the remote participant using the signaling mechanism
    })
    .catch((error) => {
      console.error('Error handling offer:', error);
    });
}

// Handle the received answer from the remote participant
function handleAnswer(answer) {
  peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
    .catch((error) => {
      console.error('Error handling answer:', error);
    });
}

// Handle ICE candidates received from the remote participant
function handleIceCandidate(candidate) {
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
    .catch((error) => {
      console.error('Error handling ICE candidate:', error);
    });
}

// Set up the necessary signaling mechanism to exchange messages between participants
// Implement functions to send and receive messages containing offers, answers, and ICE candidates
// Example WebSocket-based signaling mechanism:
const signalingSocket = new WebSocket('wss://signaling-server-url');

signalingSocket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);

  if (message.type === 'offer') {
    handleOffer(message.offer);
  } else if (message.type === 'answer') {
    handleAnswer(message.answer);
  } else if (message.type === 'iceCandidate') {
    handleIceCandidate(message.candidate);
  }
});

function sendOffer(offer) {
  const message = { type: 'offer', offer };
  signalingSocket.send(JSON.stringify(message));
}

function sendAnswer(answer) {
  const message = { type: 'answer', answer };
  signalingSocket.send(JSON.stringify(message));
}

function sendIceCandidate(candidate) {
  const message = { type: 'iceCandidate', candidate };
  signalingSocket.send(JSON.stringify(message));
}

// Start the server
const port = 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
