declare interface Config {
  host: string;
  port: number;
}

const config: Config = require('./config.json');

const io = require('socket.io')(3000);
const net = require('net');

process.on('uncaughtException', console.error);

io.on('connection', socket => {

  const connection = new net.Socket().connect(config.port, config.host);
  const addr = socket.handshake.headers['x-real-ip'] || socket.conn.remoteAddress.split(':')[3];
  connection.write(`PROXY TCP4 ${addr} 127.0.0.1 25565 25565\r\n`);

  connection.on('close', () => socket.disconnect());
  socket.on('disconnect', () => connection.end());

  connection.on('data', data => socket.emit('msg', data));

  socket.on('msg', data => {
    if (data instanceof Buffer) {
      connection.write(data);
    } else {
      socket.disconnect();
      connection.end();
    }
  });

});
