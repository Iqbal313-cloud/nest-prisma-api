import { Resend } from 'resend';

const RESEND_API_KEY = 're_Ui7YdbZq_FkLPArsmtkCddCNyoNdm9vXk';

const resend = new Resend(RESEND_API_KEY);

export const sendResetEmail = async ({
  email,
  name,
  url,
}: {
  email: string;
  name: string;
  url: string;
}) => {
  const { data, error } = await resend.emails.send({
    from: 'Ecommerce <onboarding@resend.dev>',
    to: email,
    subject: 'Reset Your Password',
    html: `
      <h2>Hello ${name || 'User'}</h2>
      <p>Click below to reset your password.</p>
      <a href="${url}">Reset Password</a>
      <p>This link expires in 30 minutes.</p>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

