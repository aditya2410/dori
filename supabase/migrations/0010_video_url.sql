-- Add video_url to products and series
alter table public.products add column video_url text;
alter table public.series    add column video_url text;

-- Create a public bucket for product videos
insert into storage.buckets (id, name, public, file_size_limit)
values ('product-videos', 'product-videos', true, 524288000)  -- 500 MB limit
on conflict (id) do nothing;

-- Allow service role full access
create policy "service role product-videos"
  on storage.objects for all
  to service_role
  using (bucket_id = 'product-videos');
