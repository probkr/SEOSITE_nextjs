import AuthLayout from '@/components/auth/AuthLayout';
import AuthForm from '@/components/auth/AuthForm';
import { SITE_URL } from '@/lib/config';

export const metadata = {
  title: 'Sign up | AllFlats',
  description: 'Create a free AllFlats account to post properties in Ahmedabad and Gandhinagar and hear directly from buyers.',
  alternates: { canonical: `${SITE_URL}/auth/signup/` },
  robots: { index: false, follow: true },
};

export default function SignupPage({ searchParams }) {
  return (
    <AuthLayout mode="signup">
      <AuthForm mode="signup" next={searchParams?.next} />
    </AuthLayout>
  );
}
