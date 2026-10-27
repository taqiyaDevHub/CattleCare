import { useMemo } from 'react';
import { ArrowDownLeft, ArrowUpRight, WalletCards } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getTransactions } from '../api/money';
import EmptyState from './EmptyState';
import Skeleton from './Skeleton';

const money = (value) => new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  maximumFractionDigits: 0,
}).format(Number(value || 0));

export default function MoneyTab({ animalId, animal }) {
  const { t } = useTranslation();
  const transactionsQuery = useQuery({
    queryKey: ['transactions', 'animal', animalId],
    queryFn: () => getTransactions({ animalId }),
    enabled: Boolean(animalId),
  });

  const transactions = useMemo(
    () => (transactionsQuery.data || []).filter((record) => record.animalId === animalId),
    [animalId, transactionsQuery.data]
  );
  const totals = useMemo(() => transactions.reduce((sum, record) => {
    const amount = Number(record.amount) || 0;
    if (record.type === 'income') sum.income += amount;
    if (record.type === 'expense') sum.expense += amount;
    return sum;
  }, { income: 0, expense: 0 }), [transactions]);
  const profit = totals.income - totals.expense;

  return (
    <div className="space-y-4">
      {(animal?.purchasePrice != null || animal?.soldPrice != null) && (
        <section className="grid grid-cols-2 gap-3">
          {animal.purchasePrice != null && (
            <div className="card">
              <p className="text-sm text-stone-500">{t('animals.purchasePrice')}</p>
              <p className="mt-1 text-xl font-bold text-earth">{money(animal.purchasePrice)}</p>
            </div>
          )}
          {animal.soldPrice != null && (
            <div className="card">
              <p className="text-sm text-stone-500">{t('animals.soldPrice')}</p>
              <p className="mt-1 text-xl font-bold text-earth">{money(animal.soldPrice)}</p>
            </div>
          )}
        </section>
      )}

      {transactionsQuery.isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      )}

      {transactionsQuery.isError && (
        <EmptyState icon={WalletCards} title={t('common.loadFailed')}>
          <button className="btn-secondary" onClick={() => transactionsQuery.refetch()}>
            {t('common.retry')}
          </button>
        </EmptyState>
      )}

      {transactionsQuery.data && (
        <>
          <section className="grid grid-cols-3 gap-2">
            <div className="card !p-3">
              <p className="break-words text-base font-bold text-brand">{money(totals.income)}</p>
              <p className="text-xs text-stone-500">{t('money.income')}</p>
            </div>
            <div className="card !p-3">
              <p className="break-words text-base font-bold text-accent">{money(totals.expense)}</p>
              <p className="text-xs text-stone-500">{t('money.expense')}</p>
            </div>
            <div className="card !p-3">
              <p className={`break-words text-base font-bold ${profit < 0 ? 'text-danger' : 'text-brand'}`}>
                {money(profit)}
              </p>
              <p className="text-xs text-stone-500">{t('money.profit')}</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-earth">{t('money.records')}</h2>
            {transactions.length === 0 ? (
              <EmptyState icon={WalletCards} title={t('money.noRecords')} />
            ) : transactions.map((record) => (
              <article key={record.id} className="card flex items-start gap-3">
                <div className={`rounded-xl p-2 ${record.type === 'income' ? 'bg-green-50 text-brand' : 'bg-amber-50 text-accent'}`}>
                  {record.type === 'income'
                    ? <ArrowUpRight className="h-5 w-5" />
                    : <ArrowDownLeft className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-earth">
                    {t(`money.categories.${record.category === 'vet_fee' ? 'vetFee' : record.category === 'animal_sale' ? 'animalSale' : record.category}`, { defaultValue: record.category })}
                  </p>
                  <p className="text-xs text-stone-500">
                    {record.date}{record.note ? ` · ${record.note}` : ''}
                  </p>
                </div>
                <p className={`shrink-0 font-bold ${record.type === 'income' ? 'text-brand' : 'text-stone-700'}`}>
                  {record.type === 'income' ? '+' : '−'}{money(record.amount)}
                </p>
              </article>
            ))}
          </section>
          <p className="text-xs text-stone-500">{t('money.milkIncomeNote')}</p>
        </>
      )}
    </div>
  );
}
