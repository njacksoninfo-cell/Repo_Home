import type { FastifyInstance } from "fastify";
import { v4 as uuidv4 } from "uuid";
import { createSession, getSession } from "../../session/sessionStore";
import { SESSION_TTL_SECONDS } from "@proximity/shared";

export async function sessionRoutes(app: FastifyInstance): Promise<void> {
  // Create a new anonymous session
  app.post("/api/session", async (_req, reply) => {
    const sessionId = uuidv4();
    await createSession(sessionId);
    return reply.status(201).send({
      sessionId,
      expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000,
    });
  });
}
