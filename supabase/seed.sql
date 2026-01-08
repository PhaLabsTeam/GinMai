-- GinMai Seed Data
-- Test data for local development

-- Note: In production, users are created via auth flow
-- These are test users for development only

-- Insert test users
INSERT INTO users (id, phone, first_name, phone_verified, verified_at, meals_hosted, meals_joined)
VALUES
  ('00000000-0000-0000-0000-000000000001', '+66812345001', 'Maya', true, now(), 5, 3),
  ('00000000-0000-0000-0000-000000000002', '+66812345002', 'James', true, now(), 2, 7),
  ('00000000-0000-0000-0000-000000000003', '+66812345003', 'Sara', true, now(), 3, 5),
  ('00000000-0000-0000-0000-000000000004', '+66812345004', 'Alex', true, now(), 1, 2),
  ('00000000-0000-0000-0000-000000000005', '+66812345005', 'Kim', true, now(), 0, 1)
ON CONFLICT (id) DO NOTHING;

-- Insert test moments in Chiang Mai area
-- Nimman area: ~18.7969, 98.9677
-- Old City: ~18.7875, 98.9915
-- Maya Mall: ~18.8028, 98.9674

INSERT INTO moments (
  id, host_id, host_name, starts_at, duration, expires_at,
  lat, lng, place_name, area_name,
  seats_total, seats_taken, note, status
)
VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Maya',
    now() + interval '30 minutes',
    'normal',
    now() + interval '2 hours 30 minutes',
    18.7969, 98.9677,
    'Khao soi place', 'Nimman',
    2, 0,
    'Working remotely, first week in CM. Just want some company for lunch.',
    'active'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'James',
    now() + interval '1 hour',
    'long',
    now() + interval '4 hours',
    18.8028, 98.9674,
    'Coffee & coworking', 'Maya Mall',
    3, 1,
    'Getting some work done, happy to chat over coffee.',
    'active'
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000003',
    'Sara',
    now() + interval '45 minutes',
    'quick',
    now() + interval '1 hour 45 minutes',
    18.7875, 98.9915,
    'Street food hunt', 'Old City',
    4, 0,
    'Exploring the old city food scene. Join me!',
    'active'
  )
ON CONFLICT (id) DO NOTHING;

-- Insert a test connection (James has 1 guest)
INSERT INTO connections (moment_id, user_id, status)
VALUES
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000004', 'confirmed')
ON CONFLICT (moment_id, user_id) DO NOTHING;

-- Insert test relationships (Maya and James have eaten together before)
INSERT INTO relationships (user_a, user_b)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
ON CONFLICT (user_a, user_b) DO NOTHING;

-- Insert test feedback
INSERT INTO feedback (moment_id, from_user, about_user, rating, eat_again)
VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'great', true),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'great', true)
ON CONFLICT (moment_id, from_user, about_user) DO NOTHING;
