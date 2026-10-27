import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PawPrint } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { registerUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import Field from '../components/Field';

const schema = z.object({
  name: z.string().trim().min(2, 'errors.nameRequired'),
  phone: z.string().regex(/^03\d{9}$/, 'errors.phone'),
  pin: z.string().regex(/^\d{4}$/, 'errors.pin'),
});

export default function Register() {
  const { t } = useTranslation();
  const { token, signIn } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      signIn(data);
      toast.success(t('auth.registered'));
      navigate('/');
    },
    onError: (err) => toast.error(err.message),
  });

  if (token) return <Navigate to="/" replace />;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-6">
      <div className="mb-6 flex flex-col items-center text-earth">
        <PawPrint className="h-14 w-14" />
        <h1 className="mt-2 text-3xl font-bold">{t('app.name')}</h1>
        <p className="mt-1 text-stone-500">{t('auth.registerTitle')}</p>
      </div>

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="card space-y-4">
        <Field label={t('auth.name')} error={errors.name}>
          <input className="input" type="text" {...register('name')} />
        </Field>
        <Field label={t('auth.phone')} error={errors.phone}>
          <input className="input" type="tel" inputMode="numeric" placeholder="03XXXXXXXXX" {...register('phone')} />
        </Field>
        <Field label={t('auth.pin')} error={errors.pin}>
          <input className="input" type="password" inputMode="numeric" maxLength={4} {...register('pin')} />
        </Field>
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          {t('auth.register')}
        </button>
      </form>

      <Link to="/login" className="mt-4 text-center text-sm text-brand">
        {t('auth.haveAccount')}
      </Link>
    </div>
  );
}
