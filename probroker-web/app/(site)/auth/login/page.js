import AuthLayout from '@/components/auth/AuthLayout';
import AuthForm from '@/components/auth/AuthForm';
import { SITE_URL } from '@/lib/config';

export const metadata = {
  title: 'Log in | PRObroker',
  description: 'Log in to PRObroker with your mobile number to manage your property listings and buyer enquiries.',
  alternates: { canonical: `${SITE_URL}/auth/login/` },
  robots: { index: false, follow: true },
};

export default function LoginPage({ searchParams }) {
  return (
    <AuthLayout mode="login">
      <AuthForm mode="login" next={searchParams?.next} />
    </AuthLayout>
  );
}
