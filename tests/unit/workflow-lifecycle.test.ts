import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mounts = vi.hoisted(() => ({
  index: vi.fn(),
  dept: vi.fn(),
  form: vi.fn(),
  toeic: vi.fn(),
  volunteer: vi.fn(),
}));

vi.mock('../../src/workflow-lab/index', () => ({ mount: mounts.index }));
vi.mock('../../src/workflow-lab/dept', () => ({ mount: mounts.dept }));
vi.mock('../../src/workflow-lab/form', () => ({ mount: mounts.form }));
vi.mock('../../src/workflow-lab/toeic', () => ({ mount: mounts.toeic }));
vi.mock('../../src/workflow-lab/volunteer', () => ({ mount: mounts.volunteer }));

import WorkflowLabMount from '../../app/workflow-lab/WorkflowLabMount';

describe('Workflow Lab mount lifecycle', () => {
  beforeEach(() => {
    for (const mount of Object.values(mounts)) {
      mount.mockReset();
      mount.mockImplementation(() => vi.fn());
    }
  });

  it('mounts the selected deck into the managed root and cleans it up on unmount', async () => {
    const cleanup = vi.fn();
    mounts.dept.mockReturnValueOnce(cleanup);
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(createElement(WorkflowLabMount, { deck: 'dept' }));
    });

    const mountRoot = host.querySelector('[data-workflow-lab-root]');
    expect(mountRoot).toBeInstanceOf(HTMLElement);
    expect(mounts.dept).toHaveBeenCalledWith(mountRoot);
    expect(mounts.index).not.toHaveBeenCalled();

    await act(async () => {
      root.unmount();
    });

    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('cleans up the old deck before mounting a changed deck and falls back to index', async () => {
    const deptCleanup = vi.fn();
    const indexCleanup = vi.fn();
    mounts.dept.mockReturnValueOnce(deptCleanup);
    mounts.index.mockReturnValueOnce(indexCleanup);
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);

    await act(async () => {
      root.render(createElement(WorkflowLabMount, { deck: 'dept' }));
    });
    const mountRoot = host.querySelector('[data-workflow-lab-root]');

    await act(async () => {
      root.render(createElement(WorkflowLabMount, { deck: 'unknown' }));
    });

    expect(deptCleanup).toHaveBeenCalledOnce();
    expect(mounts.index).toHaveBeenCalledWith(mountRoot);

    await act(async () => {
      root.unmount();
    });

    expect(indexCleanup).toHaveBeenCalledOnce();
  });
});
