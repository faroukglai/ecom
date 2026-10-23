alter table public.products alter column brand set default 'Darivo';
update public.products set brand = 'Darivo' where brand = 'Hearth & Hue';
