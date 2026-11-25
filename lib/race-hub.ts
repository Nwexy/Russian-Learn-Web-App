import { languageData } from "@/lib/speedtype-words";

export interface PlayerResult {
  wpm: number;
  acc: number;
  raw: number;
}

export interface RacePlayer {
  id: string;
  username: string;
  send: (data: any) => void;
  cleanup?: () => void;
}

export interface RaceRoom {
  id: string;
  language: string;
  player1: { id: string; username: string; result?: PlayerResult };
  player2: { id: string; username: string; result?: PlayerResult };
  words: string[];
  startTime: number;
}

interface RaceManagerGlobal {
  players: Map<string, RacePlayer>;
  queues: Map<string, string[]>; // language -> array of playerId
  rooms: Map<string, RaceRoom>;
  playerToRoom: Map<string, string>; // playerId -> roomId
}

declare global {
  // eslint-disable-next-line no-var
  var __raceManager: RaceManagerGlobal | undefined;
}

if (!globalThis.__raceManager) {
  globalThis.__raceManager = {
    players: new Map(),
    queues: new Map(),
    rooms: new Map(),
    playerToRoom: new Map(),
  };
}

const manager = globalThis.__raceManager;

function generateWordList(langId: string): string[] {
  const isEn = langId.toLowerCase().startsWith("en");
  const dict = languageData.find((l) => (isEn ? l.id.startsWith("english") : l.id.startsWith("russian"))) || languageData[0];
  const source = dict.words;
  const count = 70;
  const list: string[] = [];
  for (let i = 0; i < count; i++) {
    const w = source[Math.floor(Math.random() * source.length)];
    list.push(w);
  }
  return list;
}

export function registerPlayer(player: RacePlayer) {
  // If player already exists, replace
  const existing = manager.players.get(player.id);
  if (existing?.cleanup) {
    existing.cleanup();
  }
  manager.players.set(player.id, player);
}

export function unregisterPlayer(playerId: string) {
  // 1. Remove from all waiting queues
  for (const [lang, queue] of manager.queues.entries()) {
    manager.queues.set(
      lang,
      queue.filter((id) => id !== playerId)
    );
  }

  // 2. If in active room, notify opponent
  const roomId = manager.playerToRoom.get(playerId);
  if (roomId) {
    const room = manager.rooms.get(roomId);
    if (room) {
      const opponentId =
        room.player1.id === playerId ? room.player2.id : room.player1.id;
      const opponent = manager.players.get(opponentId);
      if (opponent) {
        opponent.send({
          type: "OpponentDisconnected",
          message: "Opponent disconnected.",
        });
      }
      manager.rooms.delete(roomId);
      manager.playerToRoom.delete(room.player1.id);
      manager.playerToRoom.delete(room.player2.id);
    }
  }

  manager.players.delete(playerId);
}

export function joinQueue(playerId: string, username: string, language: string) {
  const player = manager.players.get(playerId);
  if (!player) return;
  player.username = username || "Player";

  // Clean previous room or queue if any
  const oldRoomId = manager.playerToRoom.get(playerId);
  if (oldRoomId) {
    manager.playerToRoom.delete(playerId);
  }
  for (const [l, q] of manager.queues.entries()) {
    manager.queues.set(
      l,
      q.filter((id) => id !== playerId)
    );
  }

  const langKey = language.toLowerCase().startsWith("en") ? "english" : "russian";
  let queue = manager.queues.get(langKey);
  if (!queue) {
    queue = [];
    manager.queues.set(langKey, queue);
  }

  // Filter out any disconnected players
  queue = queue.filter((id) => manager.players.has(id) && id !== playerId);
  manager.queues.set(langKey, queue);

  if (queue.length > 0) {
    // Match found!
    const opponentId = queue.shift()!;
    const opponent = manager.players.get(opponentId);

    if (opponent) {
      const roomId = `room_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const words = generateWordList(langKey);

      const room: RaceRoom = {
        id: roomId,
        language: langKey,
        player1: { id: opponent.id, username: opponent.username },
        player2: { id: player.id, username: player.username },
        words,
        startTime: Date.now(),
      };

      manager.rooms.set(roomId, room);
      manager.playerToRoom.set(opponent.id, roomId);
      manager.playerToRoom.set(player.id, roomId);

      // Notify Player 1 (opponent was first)
      opponent.send({
        type: "MatchFound",
        raceId: roomId,
        opponentName: player.username,
        words,
      });

      // Notify Player 2 (current caller)
      player.send({
        type: "MatchFound",
        raceId: roomId,
        opponentName: opponent.username,
        words,
      });
      return;
    }
  }

  // No match yet, push into queue
  queue.push(playerId);
  player.send({
    type: "Waiting",
    message: "Waiting for an opponent to join...",
  });
}

export function sendProgress(
  playerId: string,
  raceId: string,
  wpm: number,
  progress: number,
  charIndex: number
) {
  const room = manager.rooms.get(raceId);
  if (!room) return;

  const opponentId =
    room.player1.id === playerId ? room.player2.id : room.player1.id;
  const opponent = manager.players.get(opponentId);
  if (opponent) {
    opponent.send({
      type: "OpponentProgress",
      wpm,
      progress,
      charIndex,
    });
  }
}

export function raceComplete(
  playerId: string,
  raceId: string,
  result: PlayerResult
) {
  const room = manager.rooms.get(raceId);
  if (!room) return;

  if (room.player1.id === playerId) {
    room.player1.result = result;
  } else if (room.player2.id === playerId) {
    room.player2.result = result;
  }

  const p1 = room.player1;
  const p2 = room.player2;

  if (p1.result && p2.result) {
    // Both finished!
    const client1 = manager.players.get(p1.id);
    const client2 = manager.players.get(p2.id);

    const isWinner1 = p1.result.wpm > p2.result.wpm;
    const isTie = p1.result.wpm === p2.result.wpm;
    const isWinner2 = p2.result.wpm > p1.result.wpm;

    if (client1) {
      client1.send({
        type: "BothFinished",
        yourResult: p1.result,
        oppResult: p2.result,
        isWinner: isWinner1,
        isTie,
      });
    }

    if (client2) {
      client2.send({
        type: "BothFinished",
        yourResult: p2.result,
        oppResult: p1.result,
        isWinner: isWinner2,
        isTie,
      });
    }

    // Cleanup
    manager.rooms.delete(raceId);
    manager.playerToRoom.delete(p1.id);
    manager.playerToRoom.delete(p2.id);
  } else {
    // Single player finished, notify opponent
    const opponentId = p1.id === playerId ? p2.id : p1.id;
    const opponent = manager.players.get(opponentId);
    if (opponent) {
      opponent.send({
        type: "OpponentFinished",
        result,
      });
    }
  }
}

