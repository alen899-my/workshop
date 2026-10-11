import type { ServiceBlock } from '../components/ServiceBlockEditor';

export interface JobTask {
  text: string;
  fixed: boolean;
  failed?: boolean;
  reason?: string;
}

export interface JobList {
  type: string;
  tasks: JobTask[];
}

function parseBlocks(raw: unknown): any[] {
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return typeof raw === 'string' && raw.trim() ? [{ type: 'Repair', tasks: [{ text: raw }] }] : [];
  }
}

function cleanTask(task: any): JobTask | null {
  const text = String(task?.text || '').trim();
  if (!text) return null;
  return {
    text,
    fixed: Boolean(task?.fixed),
    ...(task?.failed ? { failed: true } : {}),
    ...(task?.reason ? { reason: String(task.reason) } : {}),
  };
}

/** Flatten any stored complaints (single/multi block, string, legacy) into one Jobs-to-do list. */
export function toJobList(raw: unknown, fallbackType = 'Repair'): JobList {
  const blocks = parseBlocks(raw);
  const tasks: JobTask[] = [];
  let type = fallbackType;
  for (const block of blocks) {
    if (block && typeof block === 'object' && Array.isArray((block as any).tasks)) {
      if (tasks.length === 0) {
        const label = String((block as any).type || '').trim();
        if (label) type = label;
      }
      for (const task of (block as any).tasks) {
        const clean = cleanTask(task);
        if (clean) tasks.push(clean);
      }
    } else if (typeof block === 'string' && block.trim()) {
      tasks.push({ text: block.trim(), fixed: false });
    } else if (block && typeof block === 'object' && String((block as any).text || '').trim()) {
      const clean = cleanTask(block);
      if (clean) tasks.push(clean);
    }
  }
  return { type, tasks };
}

/** Wrap one Jobs-to-do list back into the stored block shape. */
export function toBlocks(type: string, tasks: JobTask[]): ServiceBlock[] {
  return [{ type: type.trim() || 'Repair', tasks: tasks.map((t) => ({ text: t.text, fixed: !!t.fixed })) }];
}
