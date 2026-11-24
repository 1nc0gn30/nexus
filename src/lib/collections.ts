import { KeyValueItem } from './curlParser';
import { DEFAULT_WORKFLOWS, WorkflowDefinition } from './workflowEngine';

export interface SavedRequest {
  id: string;
  name: string;
  method: string;
  baseUrl: string;
  queryParams: KeyValueItem[];
  headers: KeyValueItem[];
  body: string;
  updatedAt: number;
}

export interface SavedCollection {
  id: string;
  name: string;
  requests: SavedRequest[];
}

export interface RequestHistoryItem {
  id: string;
  method: string;
  url: string;
  status: number | null;
  durationMs: number | null;
  timestamp: number;
}

export interface WorkspaceExportBundle {
  version: 1;
  exportedAt: string;
  collections: SavedCollection[];
  workflows: WorkflowDefinition[];
}

export const COLLECTIONS_STORAGE_KEY = 'nexus_saved_collections_v1';
export const WORKFLOWS_STORAGE_KEY = 'nexus_saved_workflows_v1';
export const HISTORY_STORAGE_KEY = 'nexus_request_history_v1';

export const DEFAULT_COLLECTIONS: SavedCollection[] = [
  {
    id: 'col-quickstart',
    name: 'Quickstart Public APIs',
    requests: [
      {
        id: 'req-jsonplaceholder-todo',
        name: 'JSONPlaceholder — Get Todo #1',
        method: 'GET',
        baseUrl: 'https://jsonplaceholder.typicode.com/todos/1',
        queryParams: [],
        headers: [{ id: 'h-1', key: 'Accept', value: 'application/json', enabled: true }],
        body: '',
        updatedAt: 1735689600000,
      },
      {
        id: 'req-jsonplaceholder-post',
        name: 'JSONPlaceholder — Create Post',
        method: 'POST',
        baseUrl: 'https://jsonplaceholder.typicode.com/posts',
        queryParams: [],
        headers: [
          { id: 'h-2', key: 'Content-Type', value: 'application/json', enabled: true },
          { id: 'h-3', key: 'Accept', value: 'application/json', enabled: true },
        ],
        body: JSON.stringify(
          { title: 'Nexus API Test', body: 'Verified from browser IDE', userId: 1 },
          null,
          2,
        ),
        updatedAt: 1735689600000,
      },
      {
        id: 'req-open-meteo',
        name: 'Open-Meteo — Berlin Forecast',
        method: 'GET',
        baseUrl: 'https://api.open-meteo.com/v1/forecast',
        queryParams: [
          { id: 'qp-1', key: 'latitude', value: '52.52', enabled: true },
          { id: 'qp-2', key: 'longitude', value: '13.41', enabled: true },
          { id: 'qp-3', key: 'current_weather', value: 'true', enabled: true },
        ],
        headers: [{ id: 'h-4', key: 'Accept', value: 'application/json', enabled: true }],
        body: '',
        updatedAt: 1735689600000,
      },
      {
        id: 'req-github-octocat',
        name: 'GitHub — Octocat Profile',
        method: 'GET',
        baseUrl: 'https://api.github.com/users/octocat',
        queryParams: [],
        headers: [{ id: 'h-5', key: 'Accept', value: 'application/vnd.github+json', enabled: true }],
        body: '',
        updatedAt: 1735689600000,
      },
    ],
  },
];

export function loadCollections(): SavedCollection[] {
  if (typeof window === 'undefined') return DEFAULT_COLLECTIONS;
  try {
    const raw = window.localStorage.getItem(COLLECTIONS_STORAGE_KEY);
    if (!raw) return DEFAULT_COLLECTIONS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as SavedCollection[];
    }
  } catch {
    // ignore corrupted localStorage
  }
  return DEFAULT_COLLECTIONS;
}

export function saveCollections(collections: SavedCollection[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(collections));
  } catch {
    // ignore storage quota errors
  }
}

export function loadWorkflows(): WorkflowDefinition[] {
  if (typeof window === 'undefined') return DEFAULT_WORKFLOWS;
  try {
    const raw = window.localStorage.getItem(WORKFLOWS_STORAGE_KEY);
    if (!raw) return DEFAULT_WORKFLOWS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as WorkflowDefinition[];
    }
  } catch {
    // ignore
  }
  return DEFAULT_WORKFLOWS;
}

export function saveWorkflows(workflows: WorkflowDefinition[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(WORKFLOWS_STORAGE_KEY, JSON.stringify(workflows));
  } catch {
    // ignore
  }
}

export function loadHistory(): RequestHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RequestHistoryItem[]) : [];
  } catch {
    return [];
  }
}

export function saveHistory(history: RequestHistoryItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history.slice(0, 25)));
  } catch {
    // ignore
  }
}

export function exportWorkspaceJson(
  collections: SavedCollection[],
  workflows: WorkflowDefinition[],
): string {
  const bundle: WorkspaceExportBundle = {
    version: 1,
    exportedAt: new Date().toISOString(),
    collections,
    workflows,
  };
  return JSON.stringify(bundle, null, 2);
}

export function importWorkspaceJson(raw: string): {
  collections: SavedCollection[];
  workflows: WorkflowDefinition[];
} {
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid JSON file: expected a Nexus workspace object.');
  }

  const collections: SavedCollection[] = Array.isArray(parsed.collections)
    ? parsed.collections.filter(
        (c: unknown): c is SavedCollection =>
          Boolean(c && typeof c === 'object' && 'id' in c && 'name' in c && Array.isArray((c as SavedCollection).requests)),
      )
    : [];

  const workflows: WorkflowDefinition[] = Array.isArray(parsed.workflows)
    ? parsed.workflows.filter(
        (w: unknown): w is WorkflowDefinition =>
          Boolean(w && typeof w === 'object' && 'id' in w && 'name' in w && Array.isArray((w as WorkflowDefinition).steps)),
      )
    : [];

  if (collections.length === 0 && workflows.length === 0) {
    throw new Error('No valid collections or workflows found in imported JSON.');
  }

  return { collections, workflows };
}
