import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { updateMe } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import Field from '../components/Field';

const schema = z.object({
  name: z.string().trim().min(2, 'errors.nameRequired'),
  milkRatePerLitre: z.number().min(0),
});

export default function Settings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, updateUser, signOut } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name ?? '', milkRatePerLitre: user?.milkRatePerLitre ?? 0 },
  });

  const mutation = useMutation({
    mutationFn: updateMe,
    onSuccess: (data) => {
      updateUser(data);
      toast.success(t('settings.saved'));
    },
    onError: (err) => toast.error(err.message),
  });

  const handleLogout = () => {
    signOut();
    toast.success(t('auth.loggedOut'));
    navigate('/login');
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-earth">{t('settings.title')}</h1>

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="card space-y-4">
        <Field label={t('settings.name')} error={errors.name}>
          <input className="input" type="text" {...register('name')} />
        </Field>
        <p className="text-sm text-stone-500">{user?.phone}</p>
        <Field label={t('settings.milkRate')} error={errors.milkRatePerLitre}>
          <input
            className="input"
            type="number"
            inputMode="decimal"
            {...register('milkRatePerLitre', { valueAsNumber: true })}
          />
        </Field>
        <p className="text-sm text-stone-500">{t('settings.milkRateHelp')}</p>
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          {t('common.save')}
        </button>
      </form>

      <button className="btn-secondary" onClick={handleLogout}>
        <LogOut className="h-5 w-5" />
        {t('auth.logout')}
      </button>
    </div>
  );
}
