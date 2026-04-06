import { v4 as uuidv4 } from "uuid";
import { query } from "../db/pgClient";
import { getRedis } from "../redis/redisClient";
import { generateRoomToken } from "../livekit/tokenService";
import { config } from "../config";
import type { Fleet, FleetMember } from "@driver-intercom/shared";

const FLEET_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateInviteCode(): string {
  return Array.from(
    { length: 6 },
    () => FLEET_CODE_CHARS[Math.floor(Math.random() * FLEET_CODE_CHARS.length)]
  ).join("");
}

/** Create a new fleet/car club */
export async function createFleet(
  adminSessionId: string,
  name: string,
  description: string | null,
  type: "car_club" | "fleet_business"
): Promise<Fleet> {
  const id = uuidv4();
  const inviteCode = generateInviteCode();
  const roomId = `fleet:${id.slice(0, 8)}`;
  const now = Date.now();

  await query(
    `INSERT INTO fleets (id, name, description, type, admin_session, invite_code, room_id, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, name, description, type, adminSessionId, inviteCode, roomId, now]
  );

  // Add admin as first member
  await query(
    `INSERT INTO fleet_members (fleet_id, session_id, role, joined_at) VALUES ($1, $2, 'admin', $3)`,
    [id, adminSessionId, now]
  );

  // Cache invite code → fleet ID mapping
  await getRedis().set(`fleet_code:${inviteCode}`, id);

  return { id, name, description, type, adminSessionId, inviteCode, roomId, memberCount: 1, createdAt: now };
}

/** Join a fleet using an invite code */
export async function joinFleet(
  sessionId: string,
  inviteCode: string
): Promise<{ fleet: Fleet; token: string }> {
  // Look up fleet
  const fleetId = await getRedis().get(`fleet_code:${inviteCode.toUpperCase()}`);
  if (!fleetId) throw new Error("invite_code_not_found");

  const rows = await query<{
    id: string; name: string; description: string; type: string;
    admin_session: string; invite_code: string; room_id: string; created_at: string;
  }>(
    `SELECT * FROM fleets WHERE id = $1`,
    [fleetId]
  );
  if (rows.length === 0) throw new Error("fleet_not_found");
  const row = rows[0];

  // Check already a member
  const existing = await query(
    `SELECT 1 FROM fleet_members WHERE fleet_id = $1 AND session_id = $2`,
    [fleetId, sessionId]
  );
  if (existing.length === 0) {
    await query(
      `INSERT INTO fleet_members (fleet_id, session_id, role, joined_at) VALUES ($1, $2, 'member', $3)`,
      [fleetId, sessionId, Date.now()]
    );
  }

  const memberCountRows = await query<{ cnt: string }>(
    `SELECT COUNT(*) AS cnt FROM fleet_members WHERE fleet_id = $1`,
    [fleetId]
  );

  const fleet: Fleet = {
    id: row.id,
    name: row.name,
    description: row.description,
    type: row.type as "car_club" | "fleet_business",
    adminSessionId: row.admin_session,
    inviteCode: row.invite_code,
    roomId: row.room_id,
    memberCount: parseInt(memberCountRows[0]?.cnt ?? "1", 10),
    createdAt: parseInt(row.created_at, 10),
  };

  const token = generateRoomToken(sessionId, fleet.roomId);
  return { fleet, token };
}

/** Get all fleets a session belongs to */
export async function getSessionFleets(sessionId: string): Promise<Fleet[]> {
  const rows = await query<{
    id: string; name: string; description: string; type: string;
    admin_session: string; invite_code: string; room_id: string;
    created_at: string; member_count: string;
  }>(
    `SELECT f.*, COUNT(fm2.session_id) AS member_count
     FROM fleets f
     JOIN fleet_members fm ON f.id = fm.fleet_id
     LEFT JOIN fleet_members fm2 ON f.id = fm2.fleet_id
     WHERE fm.session_id = $1
     GROUP BY f.id`,
    [sessionId]
  );

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    type: r.type as "car_club" | "fleet_business",
    adminSessionId: r.admin_session,
    inviteCode: r.invite_code,
    roomId: r.room_id,
    memberCount: parseInt(r.member_count, 10),
    createdAt: parseInt(r.created_at, 10),
  }));
}

/** Get a LiveKit token for a fleet room */
export async function getFleetToken(
  sessionId: string,
  fleetId: string
): Promise<{ token: string; livekitUrl: string }> {
  const member = await query(
    `SELECT 1 FROM fleet_members WHERE fleet_id = $1 AND session_id = $2`,
    [fleetId, sessionId]
  );
  if (member.length === 0) throw new Error("not_a_member");

  const rows = await query<{ room_id: string }>(
    `SELECT room_id FROM fleets WHERE id = $1`,
    [fleetId]
  );
  if (rows.length === 0) throw new Error("fleet_not_found");

  const token = generateRoomToken(sessionId, rows[0].room_id);
  return { token, livekitUrl: config.livekit.url };
}

/** Leave a fleet */
export async function leaveFleet(sessionId: string, fleetId: string): Promise<void> {
  await query(
    `DELETE FROM fleet_members WHERE fleet_id = $1 AND session_id = $2`,
    [fleetId, sessionId]
  );
}
