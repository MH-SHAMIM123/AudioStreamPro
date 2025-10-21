const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Store connected devices
const connectedDevices = new Map();

// ✅ Homepage - Web Interface
app.get('/', (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Audio Stream Server</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        max-width: 1000px;
        margin: 0 auto;
        padding: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }
      .container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-top: 20px;
      }
      .card {
        background: rgba(255,255,255,0.1);
        padding: 20px;
        border-radius: 15px;
        backdrop-filter: blur(10px);
      }
      .status {
        background: green;
        padding: 10px 20px;
        border-radius: 20px;
        display: inline-block;
        margin: 10px 0;
      }
      .device-list {
        text-align: left;
      }
      .device-item {
        padding: 10px;
        margin: 5px 0;
        background: rgba(255,255,255,0.2);
        border-radius: 5px;
      }
      .android { border-left: 4px solid #4CAF50; }
      .iphone { border-left: 4px solid #2196F3; }
      a {
        color: white;
        text-decoration: none;
        display: block;
        margin: 10px 0;
        padding: 10px;
        background: rgba(255,255,255,0.2);
        border-radius: 5px;
        transition: background 0.3s;
      }
      a:hover {
        background: rgba(255,255,255,0.3);
      }
    </style>
  </head>
  <body>
    <h1>🎵 Universal Audio Stream Server</h1>
    <div class="status">✅ Server Running - PORT 3001</div>
    
    <div class="container">
      <div class="card">
        <h2>📱 Mobile Streaming</h2>
        <p><strong>Connected Devices:</strong> <span id="deviceCount">0</span></p>
        
        <h3>Active Devices:</h3>
        <div id="devices" class="device-list">
          <div id="noDevices">No devices connected</div>
        </div>
      </div>
      
      <div class="card">
        <h2>🌐 Web Player</h2>
        <a href="/audio-player">🎧 Web Audio Player</a>
        <a href="/stream-test">📡 Stream Test Page</a>
        <a href="/status">📊 Server Status API</a>
        
        <h3>Features:</h3>
        <ul>
          <li>Android → iPhone Audio Streaming</li>
          <li>Web Browser Audio Player</li>
          <li>Real-time Connection Monitoring</li>
          <li>Multiple Client Support</li>
        </ul>
      </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
      const socket = io();
      const deviceCount = document.getElementById('deviceCount');
      const devicesDiv = document.getElementById('devices');
      const noDevices = document.getElementById('noDevices');

      function updateDeviceList() {
        fetch('/connected-devices')
          .then(r => r.json())
          .then(devices => {
            deviceCount.textContent = devices.length;
            
            if (devices.length === 0) {
              noDevices.style.display = 'block';
              devicesDiv.innerHTML = '';
              devicesDiv.appendChild(noDevices);
            } else {
              noDevices.style.display = 'none';
              const devicesHTML = devices.map(function(device) {
                return '<div class="device-item ' + device.type + '">' +
                  '<strong>' + (device.type === 'android' ? '📱 Android' : '📱 iPhone') + '</strong><br>' +
                  (device.deviceName || device.userId || 'Unknown') +
                  '<small>(' + device.id + ')</small>' +
                  '</div>';
              }).join('');
              devicesDiv.innerHTML = devicesHTML;
            }
          });
      }

      // Update device list every 2 seconds
      setInterval(updateDeviceList, 2000);
      updateDeviceList();

      // Listen for real-time updates
      socket.on('device_connected', updateDeviceList);
      socket.on('device_disconnected', updateDeviceList);
    </script>
  </body>
  </html>
  `);
});

// ✅ Web Audio Player Page
app.get('/audio-player', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'audio-player.html'));
});

// ✅ Stream Test Page
app.get('/stream-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'stream-test.html'));
});

// ✅ API Routes
app.get('/status', (req, res) => {
  res.json({
    status: 'running',
    port: 3001,
    connectedDevices: connectedDevices.size,
    timestamp: new Date().toISOString(),
    androidDevices: Array.from(connectedDevices.values()).filter(function(d) { return d.type === 'android'; }).length,
    iphoneDevices: Array.from(connectedDevices.values()).filter(function(d) { return d.type === 'iphone'; }).length
  });
});

app.get('/connected-devices', (req, res) => {
  const devices = Array.from(connectedDevices.entries()).map(function(entry) {
    var id = entry[0];
    var device = entry[1];
    return {
      id: id,
      type: device.type,
      deviceName: device.deviceName,
      userId: device.userId,
      deviceId: device.deviceId
    };
  });
  res.json(devices);
});

// ✅ Socket.IO Connection Handling
io.on('connection', function(socket) {
  console.log('🔗 New device connected:', socket.id);

  // Android device registration
  socket.on('register_android', function(deviceInfo) {
    connectedDevices.set(socket.id, {
      type: 'android',
      deviceId: deviceInfo.deviceId,
      deviceName: deviceInfo.deviceName,
      socket: socket
    });
    console.log('📱 Android registered:', deviceInfo.deviceName);
    io.emit('device_connected');
  });

  // iPhone listener registration
  socket.on('register_iphone', function(userInfo) {
    connectedDevices.set(socket.id, {
      type: 'iphone', 
      userId: userInfo.userId,
      socket: socket
    });
    console.log('📱 iPhone listener registered:', userInfo.userId);
    io.emit('device_connected');
  });

  // Audio stream from Android
  socket.on('audio_stream', function(data) {
    console.log('🎵 Received audio from:', data.deviceId, '- Size:', data.chunkSize, 'bytes');
    
    // Broadcast to all iPhone listeners
    connectedDevices.forEach(function(device) {
      if (device.type === 'iphone') {
        device.socket.emit('audio_stream', {
          audioData: data.audioData,
          deviceId: data.deviceId,
          timestamp: data.timestamp,
          chunkSize: data.chunkSize
        });
      }
    });
  });

  // Web client audio streaming
  socket.on('web_audio_stream', function(data) {
    console.log('🌐 Web audio stream received');
    
    // Broadcast to all web clients
    socket.broadcast.emit('web_audio_stream', data);
  });

  socket.on('disconnect', function() {
    console.log('🔴 Device disconnected:', socket.id);
    connectedDevices.delete(socket.id);
    io.emit('device_disconnected');
  });
});

// ✅ Create public directory if not exists
const fs = require('fs');
if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
  console.log('📁 Created public directory');
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, function() {
  console.log('🚀 Universal Audio Stream Server running on port ' + PORT);
  console.log('📡 Access via: http://localhost:' + PORT);
  console.log('🎧 Web Player: http://localhost:' + PORT + '/audio-player');
  console.log('📱 Stream Test: http://localhost:' + PORT + '/stream-test');
  console.log('📊 Status API: http://localhost:' + PORT + '/status');
});