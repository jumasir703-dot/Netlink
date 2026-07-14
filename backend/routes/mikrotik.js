import express from 'express';
import mikrotik from '../services/mikrotikService.js';

const router = express.Router();

router.get('/status', async (req, res) => {
  try {
    const status = await mikrotik.getRouterStatus();
    res.json(status);
  } catch (err) {
    res.status(502).json({ online: false, error: err.message });
  }
});

router.get('/active-sessions', async (req, res) => {
  try {
    const sessions = await mikrotik.getActiveHotspotUsers();
    res.json(sessions);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await mikrotik.getAllHotspotUsers();
    res.json(users);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.get('/profiles', async (req, res) => {
  try {
    const profiles = await mikrotik.getHotspotProfiles();
    res.json(profiles);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.post('/users', async (req, res) => {
  try {
    const { username, password, durationLimit, profile, comment } = req.body;
    if (!username || !password || !durationLimit) {
      return res.status(400).json({ error: 'username, password, and durationLimit are required' });
    }
    const result = await mikrotik.createHotspotUser({ username, password, durationLimit, profile, comment });
    res.status(201).json(result);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await mikrotik.removeHotspotUser(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.delete('/active-sessions/:id', async (req, res) => {
  try {
    await mikrotik.disconnectUser(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
