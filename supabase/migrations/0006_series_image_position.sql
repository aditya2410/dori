-- Allow admin to control focal point of series cover images
alter table public.series
  add column image_position text not null default 'center'
  check (image_position in ('top', 'center', 'bottom', 'left', 'right'));
