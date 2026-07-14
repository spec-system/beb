import WorkflowLabMount from '../WorkflowLabMount';

type WorkflowLabPageProps = {
  params: Promise<{ deck?: string[] }>;
};

export default async function WorkflowLabPage({ params }: WorkflowLabPageProps) {
  const { deck } = await params;
  return <WorkflowLabMount deck={deck?.[0] ?? 'index'} />;
}
