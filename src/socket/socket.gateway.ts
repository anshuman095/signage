import { Injectable } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface UserSocketMap {
  [userId: string]: string;
}

@WebSocketGateway()
@Injectable()
export class SocketService implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private userSocketMap: UserSocketMap = {};

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId;
    // if (userId) {
    //   this.userSocketMap[userId] = client.id;
    // }
    // this.server.emit('getOnlineUsers', Object.keys(this.userSocketMap));
  }

  handleDisconnect(client: Socket) {
    const userId = Object.keys(this.userSocketMap).find(
      (key) => this.userSocketMap[key] === client.id,
    );
    if (userId) {
      delete this.userSocketMap[userId];
      this.server.emit('getOnlineUsers', Object.keys(this.userSocketMap));
    }
  }

  getReceiverSocketId(receiverId: string) {
    return this.userSocketMap[receiverId];
  }

  emitNewComment(receiverSocketId: string, comment: any) {
    this.server.to(receiverSocketId).emit('newComment', comment);
  }
}
