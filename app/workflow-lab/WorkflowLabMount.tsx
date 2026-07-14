'use client';

import React, { useEffect, useRef } from 'react';
import { mount as mountIndex } from '../../src/workflow-lab/index';
import { mount as mountDept } from '../../src/workflow-lab/dept';
import { mount as mountForm } from '../../src/workflow-lab/form';
import { mount as mountToeic } from '../../src/workflow-lab/toeic';
import { mount as mountVolunteer } from '../../src/workflow-lab/volunteer';

type DeckMount = (root: HTMLElement) => () => void;

const MOUNTS: Record<string, DeckMount> = {
  index: mountIndex,
  dept: mountDept,
  form: mountForm,
  toeic: mountToeic,
  volunteer: mountVolunteer,
};

export default function WorkflowLabMount({ deck = 'index' }: { deck?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const mount = MOUNTS[deck] ?? MOUNTS.index;
    return mount(root);
  }, [deck]);

  return <div ref={rootRef} data-workflow-lab-root="true" />;
}
