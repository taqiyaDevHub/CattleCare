import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { createAnimal } from '../api/animals';
import Field from '../components/Field';

const schema = z.object({
  tag: z.string().trim().min(1, 'errors.tagRequired'),
  name: z.string().trim().min(1, 'errors.nameRequired'),
  type: z.enum(['cow', 'buffalo', 'goat']),
  gender: z.enum(['female', 'male']),
  ageMonths: z.number().int().min(0).max(360),
  weightKg: z.number().positive().optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.number().min(0).optional(),
  milkingStatus: z.enum(['milking', 'dry', 'none']).optional(),
});

const toNum = (v) => (v === '' || v == null ? undefined : Number(v));

export default function AddAnimal() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { type: 'cow', gender: 'female', milkingStatus: 'none' },
  });

  const gender = watch('gender');

  const mutation = useMutation({
    mutationFn: createAnimal,
    onSuccess: () => {
      toast.success(t('animals.added'));
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      navigate('/animals');
    },
    onError: (err) => toast.error(err.message),
  });

  const onSubmit = (values) =>
    mutation.mutate({
      ...values,
      milkingStatus: values.gender === 'male' ? 'none' : values.milkingStatus,
    });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-earth">{t('animals.addTitle')}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
        <Field label={t('animals.tag')} error={errors.tag}>
          <input className="input" type="text" {...register('tag')} />
        </Field>
        <Field label={t('animals.name')} error={errors.name}>
          <input className="input" type="text" {...register('name')} />
        </Field>
        <Field label={t('animals.type')} error={errors.type}>
          <select className="input" {...register('type')}>
            {['cow', 'buffalo', 'goat'].map((v) => (
              <option key={v} value={v}>{t(`types.${v}`)}</option>
            ))}
          </select>
        </Field>
        <Field label={t('animals.gender')} error={errors.gender}>
          <select className="input" {...register('gender')}>
            {['female', 'male'].map((v) => (
              <option key={v} value={v}>{t(`genders.${v}`)}</option>
            ))}
          </select>
        </Field>
        <Field label={t('animals.ageMonths')} error={errors.ageMonths}>
          <input className="input" type="number" inputMode="numeric" {...register('ageMonths', { valueAsNumber: true })} />
        </Field>
        <Field label={t('animals.weightKg')} error={errors.weightKg}>
          <input className="input" type="number" inputMode="decimal" {...register('weightKg', { setValueAs: toNum })} />
        </Field>
        <Field label={t('animals.purchaseDate')} error={errors.purchaseDate}>
          <input className="input" type="date" {...register('purchaseDate', { setValueAs: (v) => v || undefined })} />
        </Field>
        <Field label={t('animals.purchasePrice')} error={errors.purchasePrice}>
          <input className="input" type="number" inputMode="numeric" {...register('purchasePrice', { setValueAs: toNum })} />
        </Field>
        {gender === 'female' && (
          <Field label={t('animals.milkingStatus')} error={errors.milkingStatus}>
            <select className="input" {...register('milkingStatus')}>
              {['none', 'milking', 'dry'].map((v) => (
                <option key={v} value={v}>{t(`milking.${v}`)}</option>
              ))}
            </select>
          </Field>
        )}
        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
          {t('common.save')}
        </button>
      </form>
    </div>
  );
}
