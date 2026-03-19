alter table public.transactions
  add column if not exists category_slug text;

alter table public.recurring_incomes
  add column if not exists category_slug text;

update public.transactions
set category_slug = case lower(trim(category))
  when 'spesa alimentare' then 'groceries'
  when 'spesa' then 'groceries'
  when 'alimentari' then 'groceries'
  when 'supermercato' then 'groceries'
  when 'spesa alimentari' then 'groceries'
  when 'mangiare fuori' then 'dining'
  when 'ristorante' then 'dining'
  when 'cena' then 'dining'
  when 'pranzo' then 'dining'
  when 'bar' then 'dining'
  when 'food' then 'dining'
  when 'aperitivo' then 'dining'
  when 'trasporti' then 'transport'
  when 'benzina' then 'transport'
  when 'taxi' then 'transport'
  when 'mezzi' then 'transport'
  when 'carburante' then 'transport'
  when 'treno' then 'transport'
  when 'metro' then 'transport'
  when 'auto' then 'transport'
  when 'casa' then 'housing'
  when 'affitto' then 'housing'
  when 'mutuo' then 'housing'
  when 'rent' then 'housing'
  when 'home' then 'housing'
  when 'bollette' then 'utilities'
  when 'utenze' then 'utilities'
  when 'luce' then 'utilities'
  when 'gas' then 'utilities'
  when 'internet' then 'utilities'
  when 'salute' then 'health'
  when 'farmacia' then 'health'
  when 'medico' then 'health'
  when 'shopping' then 'shopping'
  when 'acquisti' then 'shopping'
  when 'abbigliamento' then 'shopping'
  when 'vestiti' then 'shopping'
  when 'amazon' then 'shopping'
  when 'svago' then 'entertainment'
  when 'entertainment' then 'entertainment'
  when 'cinema' then 'entertainment'
  when 'hobby' then 'entertainment'
  when 'viaggi' then 'travel'
  when 'vacanze' then 'travel'
  when 'travel' then 'travel'
  when 'abbonamenti' then 'subscriptions'
  when 'subscription' then 'subscriptions'
  when 'streaming' then 'subscriptions'
  when 'netflix' then 'subscriptions'
  when 'spotify' then 'subscriptions'
  when 'formazione' then 'education'
  when 'corso' then 'education'
  when 'education' then 'education'
  when 'libri' then 'education'
  when 'famiglia' then 'family'
  when 'bambini' then 'family'
  when 'tasse' then 'taxes'
  when 'imposte' then 'taxes'
  when 'f24' then 'taxes'
  when 'agenzia entrate' then 'taxes'
  when 'cura personale' then 'personal-care'
  when 'beauty' then 'personal-care'
  when 'benessere' then 'personal-care'
  when 'regali' then 'gifts'
  when 'gift' then 'gifts'
  when 'stipendio' then 'salary'
  when 'salary' then 'salary'
  when 'busta paga' then 'salary'
  when 'freelance' then 'freelance'
  when 'consulenza' then 'freelance'
  when 'attivita' then 'business'
  when 'business' then 'business'
  when 'azienda' then 'business'
  when 'bonus' then 'bonus'
  when 'premio' then 'bonus'
  when 'premio produzione' then 'bonus'
  when 'rimborso' then 'refund'
  when 'refund' then 'refund'
  when 'restituzione' then 'refund'
  when 'investimenti' then 'investments'
  when 'investment' then 'investments'
  when 'dividendi' then 'investments'
  when 'cedola' then 'investments'
  when 'affitti' then 'rental'
  when 'locazione' then 'rental'
  when 'affitto attivo' then 'rental'
  when 'regalo ricevuto' then 'gift-income'
  when 'gift income' then 'gift-income'
  when 'regalo' then 'gift-income'
  when 'pensione' then 'pension'
  when 'pension' then 'pension'
  when 'altro' then case when transaction_type = 'income' then 'other-income' else 'other-expense' end
  when 'uncategorized' then case when transaction_type = 'income' then 'other-income' else 'other-expense' end
  when 'uncategorised' then case when transaction_type = 'income' then 'other-income' else 'other-expense' end
  when 'income' then 'other-income'
  when 'other' then case when transaction_type = 'income' then 'other-income' else 'other-expense' end
  else category_slug
end
where category_slug is null
  and category is not null
  and trim(category) <> '';

update public.recurring_incomes
set category_slug = case lower(trim(category))
  when 'stipendio' then 'salary'
  when 'salary' then 'salary'
  when 'busta paga' then 'salary'
  when 'freelance' then 'freelance'
  when 'consulenza' then 'freelance'
  when 'attivita' then 'business'
  when 'business' then 'business'
  when 'azienda' then 'business'
  when 'bonus' then 'bonus'
  when 'premio' then 'bonus'
  when 'premio produzione' then 'bonus'
  when 'rimborso' then 'refund'
  when 'refund' then 'refund'
  when 'restituzione' then 'refund'
  when 'investimenti' then 'investments'
  when 'investment' then 'investments'
  when 'dividendi' then 'investments'
  when 'cedola' then 'investments'
  when 'affitti' then 'rental'
  when 'rent' then 'rental'
  when 'locazione' then 'rental'
  when 'affitto attivo' then 'rental'
  when 'regalo ricevuto' then 'gift-income'
  when 'gift income' then 'gift-income'
  when 'regalo' then 'gift-income'
  when 'pensione' then 'pension'
  when 'pension' then 'pension'
  when 'altro' then 'other-income'
  when 'income' then 'other-income'
  when 'other' then 'other-income'
  else category_slug
end
where category_slug is null
  and category is not null
  and trim(category) <> '';

create index if not exists idx_transactions_category_slug
  on public.transactions (user_id, transaction_type, category_slug)
  where category_slug is not null;

create index if not exists idx_recurring_incomes_category_slug
  on public.recurring_incomes (user_id, category_slug)
  where category_slug is not null;
