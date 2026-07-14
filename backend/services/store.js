import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const PACKAGES_FILE = path.join(DATA_DIR, 'packages.json');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json');

const DEFAULT_PACKAGES = [
  { id: 'pkg-20min', label: '20 Minutes', durationLimit: '20m', price: 5 },
  { id: 'pkg-1hr', label: '1 Hour', durationLimit: '1h', price: 10 },
  { id: 'pkg-2hr', label: '2 Hours', durationLimit: '2h', price: 20 },
  { id: 'pkg-6hr', label: '6 Hours', durationLimit: '6h', price: 30 },
  { id: 'pkg-24hr', label: '24 Hours', durationLimit: '1d', price: 50 },
  { id: 'pkg-weekly', label: 'Weekly', durationLimit: '7d', price: 200 },
  { id: 'pkg-monthly', label: 'Monthly', durationLimit: '30d', price: 800 },
];

function ensureFile(filePath, defaultContent) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2));
  }
}

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

ensureFile(PACKAGES_FILE, DEFAULT_PACKAGES);
ensureFile(TRANSACTIONS_FILE, []);

export const Packages = {
  getAll: () => readJSON(PACKAGES_FILE),
  getById: (id) => readJSON(PACKAGES_FILE).find((p) => p.id === id),
  save: (packages) => writeJSON(PACKAGES_FILE, packages),
  update: (id, updates) => {
    const packages = readJSON(PACKAGES_FILE);
    const idx = packages.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    packages[idx] = { ...packages[idx], ...updates };
    writeJSON(PACKAGES_FILE, packages);
    return packages[idx];
  },
};

export const Transactions = {
  getAll: () => readJSON(TRANSACTIONS_FILE).sort((a, b) => b.createdAt - a.createdAt),
  add: (tx) => {
    const transactions = readJSON(TRANSACTIONS_FILE);
    transactions.push(tx);
    writeJSON(TRANSACTIONS_FILE, transactions);
    return tx;
  },
  updateByCheckoutId: (checkoutRequestId, updates) => {
    const transactions = readJSON(TRANSACTIONS_FILE);
    const idx = transactions.findIndex((t) => t.checkoutRequestId === checkoutRequestId);
    if (idx === -1) return null;
    transactions[idx] = { ...transactions[idx], ...updates };
    writeJSON(TRANSACTIONS_FILE, transactions);
    return transactions[idx];
  },
  findByCheckoutId: (checkoutRequestId) =>
    readJSON(TRANSACTIONS_FILE).find((t) => t.checkoutRequestId === checkoutRequestId),
};
