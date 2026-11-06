import IssueDetails from '@/components/issues/IssueDetails';
export const metadata = { title: 'Issue details' };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <IssueDetails key={id} id={id} />;
}
