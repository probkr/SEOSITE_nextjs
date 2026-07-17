import RequirementForm from '@/components/RequirementForm';
import { SITE_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return {
    title: 'Submit Your Property Requirement | PRObroker',
    description: "Tell us what you're looking for and we'll match you with the right property in Ahmedabad or Gandhinagar.",
    alternates: { canonical: `${SITE_URL}/submit-requirement/` },
  };
}

export default function SubmitRequirementPage() {
  return (
    <div className="container-px py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Submit Your Requirement</h1>
      <RequirementForm />
    </div>
  );
}
