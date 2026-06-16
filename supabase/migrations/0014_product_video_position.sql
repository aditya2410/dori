-- Position of the product video within the combined media list (photos + video).
-- Index into the merged array; null means "show the video last" (back-compat).
alter table products add column video_position smallint;
