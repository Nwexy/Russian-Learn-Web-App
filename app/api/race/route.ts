import { NextRequest, NextResponse } from "next/server";
import {
  registerPlayer,
  unregisterPlayer,
  joinQueue,
  sendProgress,
  raceComplete,
} from "@/lib/race-hub";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const playerId = searchParams.get("playerId");

  if (!playerId) {
    return new NextResponse("playerId is required", { status: 400 });
  }

  const encoder = new TextEncoder();
  let keepAliveId: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Stream closed
        }
      };

      send({ type: "Connected", playerId });

      keepAliveId = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          if (keepAliveId) clearInterval(keepAliveId);
        }
      }, 10000);

      registerPlayer({
        id: playerId,
        username: "Player",
        send,
        cleanup: () => {
          if (keepAliveId) clearInterval(keepAliveId);
        },
      });
    },
    cancel() {
      if (keepAliveId) clearInterval(keepAliveId);
      unregisterPlayer(playerId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, playerId } = body;

    if (!playerId) {
      return NextResponse.json({ error: "playerId is required" }, { status: 400 });
    }

    if (action === "join") {
      const { username, language } = body;
      joinQueue(playerId, username, language || "russian_1k");
      return NextResponse.json({ success: true });
    }

    if (action === "progress") {
      const { raceId, wpm, progress, charIndex } = body;
      sendProgress(playerId, raceId, wpm, progress, charIndex);
      return NextResponse.json({ success: true });
    }

    if (action === "finish") {
      const { raceId, result } = body;
      raceComplete(playerId, raceId, result);
      return NextResponse.json({ success: true });
    }

    if (action === "leave") {
      unregisterPlayer(playerId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed" }, { status: 500 });
  }
}

