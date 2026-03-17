import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/matches',
})
export class MatchesGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('joinMatch')
  handleJoinMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() matchId: string,
  ) {
    client.join(`match:${matchId}`);
    return { event: 'joined', data: matchId };
  }

  @SubscribeMessage('leaveMatch')
  handleLeaveMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() matchId: string,
  ) {
    client.leave(`match:${matchId}`);
    return { event: 'left', data: matchId };
  }

  emitMatchEvent(matchId: string, event: any) {
    if (this.server) {
      this.server.to(`match:${matchId}`).emit('matchEvent', event);
    }
  }

  emitScoreUpdate(matchId: string, scoreA: number, scoreB: number) {
    if (this.server) {
      this.server.to(`match:${matchId}`).emit('scoreUpdate', { scoreA, scoreB });
    }
  }

  emitStatusUpdate(matchId: string, status: string) {
    if (this.server) {
      this.server.to(`match:${matchId}`).emit('statusUpdate', { status });
    }
  }
}
