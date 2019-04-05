declare interface Config {
  host: string;
  port: number;
}

const config: Config = require('./config.json');

const http = require('http').createServer().listen(3000);
const WebSocketServer = require('websocket').server;
const server = new WebSocketServer({httpServer: http});
const net = require('net');

process.on('uncaughtException', console.error);

server.on('request', request => {

  const wsConnection = request.accept(null, request.origin);

  const mcConnection = new net.Socket().connect(config.port, config.host);
  const addr = request.httpRequest.headers['x-real-ip'] || request.remoteAddress.split(':')[3];
  mcConnection.write(`PROXY TCP4 ${addr} 127.0.0.1 25565 25565\r\n`);

  mcConnection.on('close', () => wsConnection.close());
  wsConnection.on('close', () => mcConnection.end());

  mcConnection.on('data', data => wsConnection.send(data));

  wsConnection.on('message', data => {
    if (data.type === 'binary' && data.binaryData instanceof Buffer) {
      mcConnection.write(data.binaryData);
    } else {
      wsConnection.close();
      mcConnection.end();
    }
  });

});
