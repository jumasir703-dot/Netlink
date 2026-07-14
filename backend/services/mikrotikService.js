import { RouterOSAPI } from 'node-routeros';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Wraps the MikroTik RouterOS API connection.
 * Each call opens a short-lived connection, runs the command, then closes it.
 * This is safer for a web backend than holding one long-lived socket open,
 * since RouterOS API connections can silently drop.
 */
class MikroTikService {
  constructor() {
    this.host = process.env.MIKROTIK_HOST;
    this.user = process.env.MIKROTIK_USER;
    this.password = process.env.MIKROTIK_PASSWORD;
    this.port = Number(process.env.MIKROTIK_PORT) || 8728;
    this.useSSL = process.env.MIKROTIK_USE_SSL === 'true';
  }

  async connect() {
    const conn = new RouterOSAPI({
      host: this.host,
      user: this.user,
      password: this.password,
      port: this.port,
      tls: this.useSSL ? {} : undefined,
      timeout: 8,
    });
    await conn.connect();
    return conn;
  }

  async withConnection(fn) {
    const conn = await this.connect();
    try {
      return await fn(conn);
    } finally {
      conn.close();
    }
  }

  /** Router identity + basic resource info, used for the dashboard health card */
  async getRouterStatus() {
    return this.withConnection(async (conn) => {
      const identity = await conn.write('/system/identity/print');
      const resource = await conn.write('/system/resource/print');
      return {
        online: true,
        identity: identity[0]?.name || 'MikroTik',
        uptime: resource[0]?.uptime,
        cpuLoad: resource[0]?.['cpu-load'],
        freeMemory: resource[0]?.['free-memory'],
        boardName: resource[0]?.['board-name'],
        routerosVersion: resource[0]?.version,
      };
    });
  }

  /** Currently connected hotspot clients — this powers the "Active Sessions" view */
  async getActiveHotspotUsers() {
    return this.withConnection(async (conn) => {
      const active = await conn.write('/ip/hotspot/active/print');
      return active.map((u) => ({
        id: u['.id'],
        user: u.user,
        address: u.address,
        macAddress: u['mac-address'],
        uptime: u.uptime,
        bytesIn: Number(u['bytes-in'] || 0),
        bytesOut: Number(u['bytes-out'] || 0),
        sessionTimeLeft: u['session-time-left'],
      }));
    });
  }

  /** All hotspot user accounts (not necessarily online right now) */
  async getAllHotspotUsers() {
    return this.withConnection(async (conn) => {
      const users = await conn.write('/ip/hotspot/user/print');
      return users.map((u) => ({
        id: u['.id'],
        name: u.name,
        profile: u.profile,
        limitUptime: u['limit-uptime'],
        comment: u.comment,
        disabled: u.disabled === 'true',
      }));
    });
  }

  /**
   * Creates a hotspot user on the router with a time-limited profile.
   * `durationLimit` uses RouterOS time format, e.g. "20m", "1h", "6h", "1d", "7d", "30d".
   */
  async createHotspotUser({ username, password, durationLimit, profile = 'default', comment = '' }) {
    return this.withConnection(async (conn) => {
      const result = await conn.write('/ip/hotspot/user/add', [
        `=name=${username}`,
        `=password=${password}`,
        `=profile=${profile}`,
        `=limit-uptime=${durationLimit}`,
        `=comment=${comment}`,
      ]);
      return result;
    });
  }

  /** Force-disconnects an active hotspot session, e.g. when a package expires or on manual kick */
  async disconnectUser(activeSessionId) {
    return this.withConnection(async (conn) => {
      await conn.write('/ip/hotspot/active/remove', [`=.id=${activeSessionId}`]);
      return { success: true };
    });
  }

  async removeHotspotUser(userId) {
    return this.withConnection(async (conn) => {
      await conn.write('/ip/hotspot/user/remove', [`=.id=${userId}`]);
      return { success: true };
    });
  }

  /** Hotspot user profiles configured on the router (rate limits, shared users, etc.) */
  async getHotspotProfiles() {
    return this.withConnection(async (conn) => {
      const profiles = await conn.write('/ip/hotspot/user/profile/print');
      return profiles.map((p) => ({
        id: p['.id'],
        name: p.name,
        rateLimit: p['rate-limit'],
        sharedUsers: p['shared-users'],
      }));
    });
  }
}

export default new MikroTikService();
