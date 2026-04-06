import type { FastifyInstance } from "fastify";
import { getSession } from "../../session/sessionStore";
import { generateRoomToken } from "../../livekit/tokenService";
import { config } from "../../config";

export async function tokenRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: { sessionId: string; roomId: string } }>(
    "/api/token",
    async (req, reply) => {
      const { sessionId, roomId } = req.body ?? {};
      if (!sessionId || !roomId) {
        return reply.status(400).send({ error: "sessionId and roomId required" });
      }

      const session = await getSession(sessionId);
      if (!session) {
        return reply.status(404).send({ error: "session not found" });
      }

      const token = generateRoomToken(sessionId, roomId);
      return reply.send({
        token,
        livekitUrl: config.livekit.url,
        expiresAt: Date.now() + 15 * 60 * 1000,
      });
    }
  );
}
