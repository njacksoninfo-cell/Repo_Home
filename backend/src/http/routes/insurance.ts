import type { FastifyInstance } from "fastify";
import { getSession } from "../../session/sessionStore";
import { query } from "../../db/pgClient";
import type { VehicleProfile } from "@driver-intercom/shared";

// Insurance partners — in production, each would have an affiliate API
const INSURANCE_PARTNERS = [
  { id: "progressive", name: "Progressive", affiliateUrl: "https://progressive.com/auto/?partner=driverintercom" },
  { id: "geico", name: "Geico", affiliateUrl: "https://geico.com/?partner=driverintercom" },
  { id: "statefarm", name: "State Farm", affiliateUrl: "https://statefarm.com/?partner=driverintercom" },
  { id: "allstate", name: "Allstate", affiliateUrl: "https://allstate.com/?partner=driverintercom" },
];

export async function insuranceRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/leads/insurance/partners — list available partners
  app.get("/api/leads/insurance/partners", async (_req, reply) => {
    return reply.send({
      partners: INSURANCE_PARTNERS.map(({ id, name }) => ({ id, name })),
    });
  });

  // POST /api/leads/insurance — submit an insurance lead (opt-in)
  app.post<{
    Body: {
      sessionId: string;
      partnerId: string;
      zipCode?: string;
    };
  }>("/api/leads/insurance", async (req, reply) => {
    const { sessionId, partnerId, zipCode } = req.body ?? {};
    if (!sessionId || !partnerId) {
      return reply.status(400).send({ error: "sessionId and partnerId required" });
    }

    const session = await getSession(sessionId);
    if (!session) return reply.status(404).send({ error: "session not found" });
    if (!session.vehicle) {
      return reply.status(400).send({ error: "vehicle profile required to get a quote" });
    }

    const partner = INSURANCE_PARTNERS.find((p) => p.id === partnerId);
    if (!partner) return reply.status(404).send({ error: "partner not found" });

    // Store the lead for partner reporting / affiliate payout
    await query(
      `INSERT INTO insurance_leads (session_id, vehicle_json, zip_code, partner, submitted_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [sessionId, JSON.stringify(session.vehicle), zipCode ?? null, partner.name, Date.now()]
    );

    // Build a pre-filled affiliate URL with vehicle data
    const params = new URLSearchParams({
      year: session.vehicle.year ?? "",
      make: session.vehicle.make,
      model: session.vehicle.model,
      zip: zipCode ?? "",
    });
    const quoteUrl = `${partner.affiliateUrl}&${params.toString()}`;

    return reply.send({
      partner: partner.name,
      quoteUrl,
      // Real payout: $20–80 per submitted lead (CPA model)
    });
  });
}
