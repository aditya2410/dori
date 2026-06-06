alter table public.product_series add column display_order integer not null default 0;

-- Set initial order for all existing rows (stable, per-series)
with numbered as (
  select product_id, series_id,
         (row_number() over (partition by series_id order by product_id) - 1) as rn
  from product_series
)
update product_series ps
set display_order = n.rn
from numbered n
where ps.product_id = n.product_id
  and ps.series_id  = n.series_id;
