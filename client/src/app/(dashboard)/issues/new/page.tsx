'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { issueService } from '@/services/issue.service';
import { useNotice } from '@/context/NoticeContext';
import PageHeading from '@/components/ui/PageHeading';
import IssueForm from '@/components/issues/IssueForm';
export default function NewIssuePage() {
  const router = useRouter();
  const notify = useNotice();
  return (
    <div className="form-page">
      <Link href="/issues" className="back-link">
        <ArrowLeft size={15} />
        Back to issues
      </Link>
      <PageHeading
        eyebrow="NEW WORK"
        title="Create an issue"
        description="Capture the details. Give your team a clear next step."
      />
      <section className="panel form-panel">
        <IssueForm
          onSubmit={async (input) => {
            const issue = await issueService.create(input);
            notify('Issue created successfully.');
            router.push(`/issues/${issue._id}`);
          }}
        />
      </section>
    </div>
  );
}
