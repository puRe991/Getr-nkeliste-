alter table public.drinks
  add column category text not null default 'getraenk' check (category in ('getraenk', 'essen'));

create index drinks_category_idx on public.drinks (category);
