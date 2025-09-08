import MagicLinkForm from '@/components/auth/MagicLinkForm';

export const metadata = {
  title: 'Sign In - Project Based Login',
  description: 'Sign in securely with a magic link. No passwords required.',
};

export default function LoginPage() {
  return <MagicLinkForm />;
}