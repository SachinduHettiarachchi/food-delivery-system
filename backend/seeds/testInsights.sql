-- =============================================================================
-- HungryHub — Smart Insights Test Seed
-- Tests: 🔥 Best Seller · ⭐ Top Rated · 📈 Trending · ✨ New · (no tag)
-- Run via:  npm run seed:test  (from /backend)
-- =============================================================================

START TRANSACTION;

-- -----------------------------------------------------------------------------
-- SETUP — Age all existing menu items so none receive the ✨ New tag.
-- Items seeded by seed.js have created_at = NOW(), which would make them all
-- "New" (< 14 days) and override every scenario below.
-- -----------------------------------------------------------------------------
UPDATE menu_items
SET    created_at = DATE_SUB(NOW(), INTERVAL 90 DAY),
       updated_at = DATE_SUB(NOW(), INTERVAL 90 DAY);


-- =============================================================================
-- NEW MENU ITEMS
-- Inserted first so their IDs are captured before orders reference them.
-- All scenario items (except Truffle Fries) are set 90 days old.
-- =============================================================================

-- Scenario 2 · Top Rated ─ Butter Chicken
INSERT INTO menu_items
  (restaurant_id, name, description, price, category, is_available, preparation_time, review_count, created_at, updated_at)
VALUES
  (1, 'Butter Chicken',
   'Slow-cooked tender chicken in a rich, creamy tomato butter sauce',
   1400, 'Mains', 1, 25, 0,
   DATE_SUB(NOW(), INTERVAL 90 DAY), DATE_SUB(NOW(), INTERVAL 90 DAY));
SET @bc_id = LAST_INSERT_ID();

-- Scenario 3 · Trending ─ Pad Thai
INSERT INTO menu_items
  (restaurant_id, name, description, price, category, is_available, preparation_time, review_count, created_at, updated_at)
VALUES
  (1, 'Pad Thai',
   'Stir-fried rice noodles with egg, fresh vegetables, peanuts and lime',
   1100, 'Noodles', 1, 18, 0,
   DATE_SUB(NOW(), INTERVAL 90 DAY), DATE_SUB(NOW(), INTERVAL 90 DAY));
SET @pt_id = LAST_INSERT_ID();

-- Scenario 4 · No Tag (Low Rated) ─ Dry Fried Rice
INSERT INTO menu_items
  (restaurant_id, name, description, price, category, is_available, preparation_time, review_count, created_at, updated_at)
VALUES
  (1, 'Dry Fried Rice',
   'Classic wok-fried rice with seasonal vegetables and egg',
   750, 'Rice', 1, 12, 0,
   DATE_SUB(NOW(), INTERVAL 90 DAY), DATE_SUB(NOW(), INTERVAL 90 DAY));
SET @dfr_id = LAST_INSERT_ID();

-- Scenario 5 · ✨ New ─ Truffle Fries  (created TODAY — must stay < 14 days old)
INSERT INTO menu_items
  (restaurant_id, name, description, price, category, is_available, preparation_time, review_count, created_at, updated_at)
VALUES
  (2, 'Truffle Fries',
   'Crispy golden fries tossed in black truffle oil and shaved parmesan',
   680, 'Sides', 1, 8, 0,
   NOW(), NOW());
SET @tf_id = LAST_INSERT_ID();

-- Scenario 6 · No Tag (Average) ─ Veggie Wrap
INSERT INTO menu_items
  (restaurant_id, name, description, price, category, is_available, preparation_time, review_count, created_at, updated_at)
VALUES
  (1, 'Veggie Wrap',
   'Grilled seasonal vegetables, hummus and rocket in a warm toasted flatbread',
   850, 'Wraps', 1, 10, 0,
   DATE_SUB(NOW(), INTERVAL 90 DAY), DATE_SUB(NOW(), INTERVAL 90 DAY));
SET @vw_id = LAST_INSERT_ID();


-- =============================================================================
-- SCENARIO 1 · 🔥 Best Seller — Margherita Pizza (menu_item_id = 1)
-- Logic:  all-time order count (25) in top 20% of all items AND >= 10 orders.
-- =============================================================================

-- 25 delivered orders for restaurant 1
INSERT INTO orders
  (customer_id, restaurant_id, status, total_amount, delivery_address, created_at, updated_at)
VALUES
  (3, 1, 'delivered', 1200.00, '42 Galle Road, Colombo 3', NOW(), NOW()),
  (3, 1, 'delivered', 1200.00, '42 Galle Road, Colombo 3', NOW(), NOW()),
  (3, 1, 'delivered', 1200.00, '42 Galle Road, Colombo 3', NOW(), NOW()),
  (3, 1, 'delivered', 1200.00, '42 Galle Road, Colombo 3', NOW(), NOW()),
  (3, 1, 'delivered', 1200.00, '42 Galle Road, Colombo 3', NOW(), NOW()),
  (3, 1, 'delivered', 1200.00, '42 Galle Road, Colombo 3', NOW(), NOW()),
  (3, 1, 'delivered', 1200.00, '42 Galle Road, Colombo 3', NOW(), NOW()),
  (3, 1, 'delivered', 1200.00, '42 Galle Road, Colombo 3', NOW(), NOW()),
  (3, 1, 'delivered', 1200.00, '42 Galle Road, Colombo 3', NOW(), NOW()),
  (3, 1, 'delivered', 1200.00, '42 Galle Road, Colombo 3', NOW(), NOW()),
  (3, 1, 'delivered', 1200.00, '42 Galle Road, Colombo 3', NOW(), NOW()),
  (3, 1, 'delivered', 1200.00, '42 Galle Road, Colombo 3', NOW(), NOW()),
  (3, 1, 'delivered', 1200.00, '42 Galle Road, Colombo 3', NOW(), NOW()),
  (3, 1, 'delivered', 1200.00, '42 Galle Road, Colombo 3', NOW(), NOW()),
  (3, 1, 'delivered', 1200.00, '42 Galle Road, Colombo 3', NOW(), NOW()),
  (3, 1, 'delivered', 1200.00, '42 Galle Road, Colombo 3', NOW(), NOW()),
  (3, 1, 'delivered', 1200.00, '42 Galle Road, Colombo 3', NOW(), NOW()),
  (3, 1, 'delivered', 1200.00, '42 Galle Road, Colombo 3', NOW(), NOW()),
  (3, 1, 'delivered', 1200.00, '42 Galle Road, Colombo 3', NOW(), NOW()),
  (3, 1, 'delivered', 1200.00, '42 Galle Road, Colombo 3', NOW(), NOW()),
  (3, 1, 'delivered', 1200.00, '42 Galle Road, Colombo 3', NOW(), NOW()),
  (3, 1, 'delivered', 1200.00, '42 Galle Road, Colombo 3', NOW(), NOW()),
  (3, 1, 'delivered', 1200.00, '42 Galle Road, Colombo 3', NOW(), NOW()),
  (3, 1, 'delivered', 1200.00, '42 Galle Road, Colombo 3', NOW(), NOW()),
  (3, 1, 'delivered', 1200.00, '42 Galle Road, Colombo 3', NOW(), NOW());
-- MySQL LAST_INSERT_ID() after a bulk INSERT returns the ID of the FIRST row.
SET @s1 = LAST_INSERT_ID();

-- 25 order_items — one Margherita per order
INSERT INTO order_items
  (order_id, menu_item_id, quantity, unit_price, subtotal, created_at, updated_at)
VALUES
  (@s1+0,  1, 1, 1200.00, 1200.00, NOW(), NOW()),
  (@s1+1,  1, 1, 1200.00, 1200.00, NOW(), NOW()),
  (@s1+2,  1, 1, 1200.00, 1200.00, NOW(), NOW()),
  (@s1+3,  1, 1, 1200.00, 1200.00, NOW(), NOW()),
  (@s1+4,  1, 1, 1200.00, 1200.00, NOW(), NOW()),
  (@s1+5,  1, 1, 1200.00, 1200.00, NOW(), NOW()),
  (@s1+6,  1, 1, 1200.00, 1200.00, NOW(), NOW()),
  (@s1+7,  1, 1, 1200.00, 1200.00, NOW(), NOW()),
  (@s1+8,  1, 1, 1200.00, 1200.00, NOW(), NOW()),
  (@s1+9,  1, 1, 1200.00, 1200.00, NOW(), NOW()),
  (@s1+10, 1, 1, 1200.00, 1200.00, NOW(), NOW()),
  (@s1+11, 1, 1, 1200.00, 1200.00, NOW(), NOW()),
  (@s1+12, 1, 1, 1200.00, 1200.00, NOW(), NOW()),
  (@s1+13, 1, 1, 1200.00, 1200.00, NOW(), NOW()),
  (@s1+14, 1, 1, 1200.00, 1200.00, NOW(), NOW()),
  (@s1+15, 1, 1, 1200.00, 1200.00, NOW(), NOW()),
  (@s1+16, 1, 1, 1200.00, 1200.00, NOW(), NOW()),
  (@s1+17, 1, 1, 1200.00, 1200.00, NOW(), NOW()),
  (@s1+18, 1, 1, 1200.00, 1200.00, NOW(), NOW()),
  (@s1+19, 1, 1, 1200.00, 1200.00, NOW(), NOW()),
  (@s1+20, 1, 1, 1200.00, 1200.00, NOW(), NOW()),
  (@s1+21, 1, 1, 1200.00, 1200.00, NOW(), NOW()),
  (@s1+22, 1, 1, 1200.00, 1200.00, NOW(), NOW()),
  (@s1+23, 1, 1, 1200.00, 1200.00, NOW(), NOW()),
  (@s1+24, 1, 1, 1200.00, 1200.00, NOW(), NOW());

-- 60 reviews across first 15 orders (4 users × 15 orders), ratings 4–5
-- avg_rating = (30×4 + 30×5) / 60 = 4.5, review_count = 60
INSERT INTO reviews
  (customer_id, menu_item_id, order_id, rating, comment, created_at, updated_at)
VALUES
  -- User 1 (rating 4)
  (1, 1, @s1+0,  4, 'Perfectly balanced flavours, crispy base.',           NOW(), NOW()),
  (1, 1, @s1+1,  4, 'Love the fresh basil topping.',                       NOW(), NOW()),
  (1, 1, @s1+2,  4, 'A solid classic, never disappoints.',                 NOW(), NOW()),
  (1, 1, @s1+3,  4, 'Generous with the mozzarella!',                       NOW(), NOW()),
  (1, 1, @s1+4,  4, 'Quick delivery, pizza was still hot.',                NOW(), NOW()),
  (1, 1, @s1+5,  4, 'Great value for the portion size.',                   NOW(), NOW()),
  (1, 1, @s1+6,  4, 'Will definitely order again.',                        NOW(), NOW()),
  (1, 1, @s1+7,  4, 'Thin crust done right.',                              NOW(), NOW()),
  (1, 1, @s1+8,  4, 'Fresh tomato sauce, not too sweet.',                  NOW(), NOW()),
  (1, 1, @s1+9,  4, 'Consistent quality every time.',                      NOW(), NOW()),
  (1, 1, @s1+10, 4, 'Good size for one person.',                           NOW(), NOW()),
  (1, 1, @s1+11, 4, 'Classic flavour done well.',                          NOW(), NOW()),
  (1, 1, @s1+12, 4, 'Arrived hot and fresh.',                              NOW(), NOW()),
  (1, 1, @s1+13, 4, 'Nice charring on the crust edges.',                   NOW(), NOW()),
  (1, 1, @s1+14, 4, 'Simple and delicious.',                               NOW(), NOW()),
  -- User 2 (rating 5)
  (2, 1, @s1+0,  5, 'Best Margherita I have had in Colombo!',              NOW(), NOW()),
  (2, 1, @s1+1,  5, 'Absolutely restaurant-quality.',                      NOW(), NOW()),
  (2, 1, @s1+2,  5, 'Perfection on a plate.',                              NOW(), NOW()),
  (2, 1, @s1+3,  5, 'Outstanding — ordered three times this month.',       NOW(), NOW()),
  (2, 1, @s1+4,  5, 'Crust is incredible, so light and airy.',             NOW(), NOW()),
  (2, 1, @s1+5,  5, 'Top tier, no notes.',                                 NOW(), NOW()),
  (2, 1, @s1+6,  5, 'Fresh mozzarella makes all the difference.',          NOW(), NOW()),
  (2, 1, @s1+7,  5, 'Could not fault anything about this pizza.',          NOW(), NOW()),
  (2, 1, @s1+8,  5, 'My new go-to order for sure.',                        NOW(), NOW()),
  (2, 1, @s1+9,  5, 'Exceeded expectations, wow.',                         NOW(), NOW()),
  (2, 1, @s1+10, 5, 'Literally flawless.',                                 NOW(), NOW()),
  (2, 1, @s1+11, 5, 'The tomato sauce has the perfect acidity.',           NOW(), NOW()),
  (2, 1, @s1+12, 5, 'Restaurant quality delivered to my door.',            NOW(), NOW()),
  (2, 1, @s1+13, 5, 'Five stars every single time.',                       NOW(), NOW()),
  (2, 1, @s1+14, 5, 'I recommend this to everyone.',                       NOW(), NOW()),
  -- User 3 (rating 4)
  (3, 1, @s1+0,  4, 'Really tasty, would order again.',                    NOW(), NOW()),
  (3, 1, @s1+1,  4, 'Good quality ingredients.',                           NOW(), NOW()),
  (3, 1, @s1+2,  4, 'Arrived on time and in good shape.',                  NOW(), NOW()),
  (3, 1, @s1+3,  4, 'Nice ratio of sauce to cheese.',                      NOW(), NOW()),
  (3, 1, @s1+4,  4, 'Solid 4 out of 5.',                                   NOW(), NOW()),
  (3, 1, @s1+5,  4, 'One of the better pizzas on the platform.',           NOW(), NOW()),
  (3, 1, @s1+6,  4, 'Fresh and tasty.',                                    NOW(), NOW()),
  (3, 1, @s1+7,  4, 'Great portion, decent price.',                        NOW(), NOW()),
  (3, 1, @s1+8,  4, 'Highly recommend to first timers.',                   NOW(), NOW()),
  (3, 1, @s1+9,  4, 'Good but not quite five stars.',                      NOW(), NOW()),
  (3, 1, @s1+10, 4, 'Very enjoyable meal.',                                NOW(), NOW()),
  (3, 1, @s1+11, 4, 'Crust was crisp and not soggy.',                      NOW(), NOW()),
  (3, 1, @s1+12, 4, 'Well packaged, arrived intact.',                      NOW(), NOW()),
  (3, 1, @s1+13, 4, 'Cheese pull was satisfying!',                         NOW(), NOW()),
  (3, 1, @s1+14, 4, 'Definitely ordering again next week.',                NOW(), NOW()),
  -- User 4 (rating 5)
  (4, 1, @s1+0,  5, 'Hands down the best pizza here.',                     NOW(), NOW()),
  (4, 1, @s1+1,  5, 'Absolutely incredible.',                              NOW(), NOW()),
  (4, 1, @s1+2,  5, 'Five stars, no hesitation.',                          NOW(), NOW()),
  (4, 1, @s1+3,  5, 'My family loves this every week.',                    NOW(), NOW()),
  (4, 1, @s1+4,  5, 'Worth every rupee.',                                  NOW(), NOW()),
  (4, 1, @s1+5,  5, 'Insanely good quality.',                              NOW(), NOW()),
  (4, 1, @s1+6,  5, 'Perfect pizza, quick delivery.',                      NOW(), NOW()),
  (4, 1, @s1+7,  5, 'I rate this every time and it never lets me down.',   NOW(), NOW()),
  (4, 1, @s1+8,  5, 'Authentic Italian taste.',                            NOW(), NOW()),
  (4, 1, @s1+9,  5, 'The gold standard.',                                  NOW(), NOW()),
  (4, 1, @s1+10, 5, 'Cannot recommend enough.',                            NOW(), NOW()),
  (4, 1, @s1+11, 5, 'Ordered for my entire office, everyone loved it.',    NOW(), NOW()),
  (4, 1, @s1+12, 5, 'Consistently amazing.',                               NOW(), NOW()),
  (4, 1, @s1+13, 5, 'Hottest delivery I have received.',                   NOW(), NOW()),
  (4, 1, @s1+14, 5, 'This is THE margherita pizza.',                       NOW(), NOW());


-- =============================================================================
-- SCENARIO 2 · ⭐ Top Rated — Butter Chicken
-- Logic:  avg_rating (5.0) >= 4.5 AND review_count (12) >= 3.
--         Only 3 order_items — below the Best Seller threshold of 10.
-- =============================================================================

-- 3 delivered orders for restaurant 1 (Butter Chicken)
INSERT INTO orders
  (customer_id, restaurant_id, status, total_amount, delivery_address, created_at, updated_at)
VALUES
  (3, 1, 'delivered', 1400.00, '18 Duplication Road, Colombo 4', NOW(), NOW()),
  (3, 1, 'delivered', 1400.00, '18 Duplication Road, Colombo 4', NOW(), NOW()),
  (3, 1, 'delivered', 1400.00, '18 Duplication Road, Colombo 4', NOW(), NOW());
SET @s2 = LAST_INSERT_ID();

INSERT INTO order_items
  (order_id, menu_item_id, quantity, unit_price, subtotal, created_at, updated_at)
VALUES
  (@s2+0, @bc_id, 1, 1400.00, 1400.00, NOW(), NOW()),
  (@s2+1, @bc_id, 1, 1400.00, 1400.00, NOW(), NOW()),
  (@s2+2, @bc_id, 1, 1400.00, 1400.00, NOW(), NOW());

-- 12 reviews — all 4 users × 3 orders, all rating 5
-- avg_rating = 5.0, review_count = 12
INSERT INTO reviews
  (customer_id, menu_item_id, order_id, rating, comment, created_at, updated_at)
VALUES
  (1, @bc_id, @s2+0, 5, 'Absolutely divine — silky sauce and perfectly spiced.',   NOW(), NOW()),
  (1, @bc_id, @s2+1, 5, 'The best butter chicken outside a restaurant kitchen.',   NOW(), NOW()),
  (1, @bc_id, @s2+2, 5, 'Creamy, rich and deeply satisfying.',                     NOW(), NOW()),
  (2, @bc_id, @s2+0, 5, 'Wow. Just wow. Perfectly tender chicken.',                NOW(), NOW()),
  (2, @bc_id, @s2+1, 5, 'Smells amazing, tastes even better.',                     NOW(), NOW()),
  (2, @bc_id, @s2+2, 5, 'This is my new favourite dish on HungryHub.',             NOW(), NOW()),
  (3, @bc_id, @s2+0, 5, 'The sauce has incredible depth of flavour.',              NOW(), NOW()),
  (3, @bc_id, @s2+1, 5, 'Restaurant quality — I cannot believe this is delivery.', NOW(), NOW()),
  (3, @bc_id, @s2+2, 5, 'Butter chicken perfection.',                              NOW(), NOW()),
  (4, @bc_id, @s2+0, 5, 'I have ordered this four times and it is always perfect.',NOW(), NOW()),
  (4, @bc_id, @s2+1, 5, 'Genuinely the best I have tasted.',                       NOW(), NOW()),
  (4, @bc_id, @s2+2, 5, 'Five stars is not enough for this dish.',                 NOW(), NOW());


-- =============================================================================
-- SCENARIO 3 · 📈 Trending — Pad Thai
-- Logic:  8 orders in the last 7 days puts it in the top 30% of recent items.
--         10 reviews — avg_rating 4.0 (< 4.5), so Top Rated is not triggered.
--         5 old reviews (3★) from 60 days ago + 5 recent (5★) = avg 4.0.
-- =============================================================================

-- 8 recent orders (created NOW — all within the last 7 days)
INSERT INTO orders
  (customer_id, restaurant_id, status, total_amount, delivery_address, created_at, updated_at)
VALUES
  (3, 1, 'delivered', 1100.00, '7 Station Road, Colombo 5', NOW(), NOW()),
  (3, 1, 'delivered', 1100.00, '7 Station Road, Colombo 5', NOW(), NOW()),
  (3, 1, 'delivered', 1100.00, '7 Station Road, Colombo 5', NOW(), NOW()),
  (3, 1, 'delivered', 1100.00, '7 Station Road, Colombo 5', NOW(), NOW()),
  (3, 1, 'delivered', 1100.00, '7 Station Road, Colombo 5', NOW(), NOW()),
  (3, 1, 'delivered', 1100.00, '7 Station Road, Colombo 5', NOW(), NOW()),
  (3, 1, 'delivered', 1100.00, '7 Station Road, Colombo 5', NOW(), NOW()),
  (3, 1, 'delivered', 1100.00, '7 Station Road, Colombo 5', NOW(), NOW());
SET @s3 = LAST_INSERT_ID();

INSERT INTO order_items
  (order_id, menu_item_id, quantity, unit_price, subtotal, created_at, updated_at)
VALUES
  (@s3+0, @pt_id, 1, 1100.00, 1100.00, NOW(), NOW()),
  (@s3+1, @pt_id, 1, 1100.00, 1100.00, NOW(), NOW()),
  (@s3+2, @pt_id, 1, 1100.00, 1100.00, NOW(), NOW()),
  (@s3+3, @pt_id, 1, 1100.00, 1100.00, NOW(), NOW()),
  (@s3+4, @pt_id, 1, 1100.00, 1100.00, NOW(), NOW()),
  (@s3+5, @pt_id, 1, 1100.00, 1100.00, NOW(), NOW()),
  (@s3+6, @pt_id, 1, 1100.00, 1100.00, NOW(), NOW()),
  (@s3+7, @pt_id, 1, 1100.00, 1100.00, NOW(), NOW());

-- 5 OLD reviews (rating 3★, created 60 days ago) — user 3 in orders 0–4
-- 5 RECENT reviews (rating 5★, created now) — user 4 in orders 0–4
-- avg_rating = (5×3 + 5×5) / 10 = 4.0  →  below 4.5 Top Rated threshold ✓
INSERT INTO reviews
  (customer_id, menu_item_id, order_id, rating, comment, created_at, updated_at)
VALUES
  (3, @pt_id, @s3+0, 3, 'Decent pad thai, noodles were a bit overcooked.',         DATE_SUB(NOW(), INTERVAL 60 DAY), DATE_SUB(NOW(), INTERVAL 60 DAY)),
  (3, @pt_id, @s3+1, 3, 'Okay flavour but nothing special at the time.',           DATE_SUB(NOW(), INTERVAL 60 DAY), DATE_SUB(NOW(), INTERVAL 60 DAY)),
  (3, @pt_id, @s3+2, 3, 'Average. Expected more peanut.',                          DATE_SUB(NOW(), INTERVAL 60 DAY), DATE_SUB(NOW(), INTERVAL 60 DAY)),
  (3, @pt_id, @s3+3, 3, 'Not bad but not great either.',                           DATE_SUB(NOW(), INTERVAL 60 DAY), DATE_SUB(NOW(), INTERVAL 60 DAY)),
  (3, @pt_id, @s3+4, 3, 'Passable — I have had better.',                           DATE_SUB(NOW(), INTERVAL 60 DAY), DATE_SUB(NOW(), INTERVAL 60 DAY)),
  (4, @pt_id, @s3+0, 5, 'They have clearly improved the recipe — incredible now!', NOW(), NOW()),
  (4, @pt_id, @s3+1, 5, 'Perfect balance of sweet, sour and umami.',               NOW(), NOW()),
  (4, @pt_id, @s3+2, 5, 'This is trending for good reason.',                       NOW(), NOW()),
  (4, @pt_id, @s3+3, 5, 'Fresh lime, great wok flavour — highly recommend.',       NOW(), NOW()),
  (4, @pt_id, @s3+4, 5, 'Best pad thai in the city right now.',                    NOW(), NOW());


-- =============================================================================
-- SCENARIO 4 · No Tag (Low Rated) — Dry Fried Rice
-- Logic:  only 3 order_items (< 10 Best Seller threshold).
--         avg_rating 2.8 (< 4.5) → no Top Rated.
--         0 recent orders → no Trending.
--         Result: null tag, description shows the low average rating.
-- =============================================================================

-- 3 old delivered orders (created 45 days ago — outside the 7-day recent window)
INSERT INTO orders
  (customer_id, restaurant_id, status, total_amount, delivery_address, created_at, updated_at)
VALUES
  (3, 1, 'delivered', 750.00, '33 Havelock Road, Colombo 5', DATE_SUB(NOW(), INTERVAL 45 DAY), DATE_SUB(NOW(), INTERVAL 45 DAY)),
  (3, 1, 'delivered', 750.00, '33 Havelock Road, Colombo 5', DATE_SUB(NOW(), INTERVAL 45 DAY), DATE_SUB(NOW(), INTERVAL 45 DAY)),
  (3, 1, 'delivered', 750.00, '33 Havelock Road, Colombo 5', DATE_SUB(NOW(), INTERVAL 45 DAY), DATE_SUB(NOW(), INTERVAL 45 DAY));
SET @s4 = LAST_INSERT_ID();

INSERT INTO order_items
  (order_id, menu_item_id, quantity, unit_price, subtotal, created_at, updated_at)
VALUES
  (@s4+0, @dfr_id, 1, 750.00, 750.00, DATE_SUB(NOW(), INTERVAL 45 DAY), DATE_SUB(NOW(), INTERVAL 45 DAY)),
  (@s4+1, @dfr_id, 1, 750.00, 750.00, DATE_SUB(NOW(), INTERVAL 45 DAY), DATE_SUB(NOW(), INTERVAL 45 DAY)),
  (@s4+2, @dfr_id, 1, 750.00, 750.00, DATE_SUB(NOW(), INTERVAL 45 DAY), DATE_SUB(NOW(), INTERVAL 45 DAY));

-- 5 old reviews (rating 4★) + 5 recent reviews (rating 1–2★)
-- avg_rating = (5×4 + 5×1.6) / 10 = 2.8
INSERT INTO reviews
  (customer_id, menu_item_id, order_id, rating, comment, created_at, updated_at)
VALUES
  -- Old positive reviews (4★, from 45 days ago)
  (1, @dfr_id, @s4+0, 4, 'Was decent back then, rice was fluffy.',               DATE_SUB(NOW(), INTERVAL 45 DAY), DATE_SUB(NOW(), INTERVAL 45 DAY)),
  (2, @dfr_id, @s4+0, 4, 'Pretty good for a quick meal.',                        DATE_SUB(NOW(), INTERVAL 45 DAY), DATE_SUB(NOW(), INTERVAL 45 DAY)),
  (3, @dfr_id, @s4+0, 4, 'Tasted fresh and well-seasoned at the time.',          DATE_SUB(NOW(), INTERVAL 45 DAY), DATE_SUB(NOW(), INTERVAL 45 DAY)),
  (4, @dfr_id, @s4+0, 4, 'Satisfying portion and good flavour.',                 DATE_SUB(NOW(), INTERVAL 45 DAY), DATE_SUB(NOW(), INTERVAL 45 DAY)),
  (1, @dfr_id, @s4+1, 4, 'Nothing fancy but solid comfort food.',                DATE_SUB(NOW(), INTERVAL 45 DAY), DATE_SUB(NOW(), INTERVAL 45 DAY)),
  -- Recent negative reviews (1–2★, now)
  (2, @dfr_id, @s4+1, 2, 'Quality has dropped. Rice was clumpy and underseasoned.', NOW(), NOW()),
  (3, @dfr_id, @s4+1, 1, 'Disappointed — nothing like how it used to taste.',    NOW(), NOW()),
  (4, @dfr_id, @s4+1, 2, 'Mushy texture, barely any flavour.',                   NOW(), NOW()),
  (1, @dfr_id, @s4+2, 1, 'Sadly cannot recommend anymore.',                      NOW(), NOW()),
  (2, @dfr_id, @s4+2, 2, 'Way below expectations. Will not order again.',        NOW(), NOW());


-- =============================================================================
-- SCENARIO 5 · ✨ New — Truffle Fries
-- Logic:  item created_at = TODAY (within 14 days) → New tag takes priority.
--         No reviews, no order_items inserted — exactly as a new menu item.
-- =============================================================================
-- Nothing to insert for this scenario — Truffle Fries was added above with
-- created_at = NOW() and that alone triggers the ✨ New tag.


-- =============================================================================
-- SCENARIO 6 · No Tag (Average) — Veggie Wrap
-- Logic:  4 order_items (< 10 Best Seller threshold).
--         avg_rating 3.0 (< 4.5) → no Top Rated.
--         4 recent orders but recentOrders (4) < p70 (8) → no Trending.
--         Result: null tag, description shows the average rating.
-- =============================================================================

-- 4 recent delivered orders (created NOW)
INSERT INTO orders
  (customer_id, restaurant_id, status, total_amount, delivery_address, created_at, updated_at)
VALUES
  (3, 1, 'delivered', 850.00, '55 Flower Road, Colombo 7', NOW(), NOW()),
  (3, 1, 'delivered', 850.00, '55 Flower Road, Colombo 7', NOW(), NOW()),
  (3, 1, 'delivered', 850.00, '55 Flower Road, Colombo 7', NOW(), NOW()),
  (3, 1, 'delivered', 850.00, '55 Flower Road, Colombo 7', NOW(), NOW());
SET @s6 = LAST_INSERT_ID();

INSERT INTO order_items
  (order_id, menu_item_id, quantity, unit_price, subtotal, created_at, updated_at)
VALUES
  (@s6+0, @vw_id, 1, 850.00, 850.00, NOW(), NOW()),
  (@s6+1, @vw_id, 1, 850.00, 850.00, NOW(), NOW()),
  (@s6+2, @vw_id, 1, 850.00, 850.00, NOW(), NOW()),
  (@s6+3, @vw_id, 1, 850.00, 850.00, NOW(), NOW());

-- 6 reviews with mixed ratings (2,3,3,4,3,3) — avg 3.0
INSERT INTO reviews
  (customer_id, menu_item_id, order_id, rating, comment, created_at, updated_at)
VALUES
  (3, @vw_id, @s6+0, 2, 'The wrap fell apart during delivery, vegetables were cold.', NOW(), NOW()),
  (4, @vw_id, @s6+0, 3, 'Decent option if you want something lighter.',               NOW(), NOW()),
  (3, @vw_id, @s6+1, 3, 'Average. Hummus was a bit bland.',                           NOW(), NOW()),
  (4, @vw_id, @s6+1, 4, 'Fresh vegetables and a nice bite overall.',                  NOW(), NOW()),
  (3, @vw_id, @s6+2, 3, 'Fine, not amazing.',                                         NOW(), NOW()),
  (4, @vw_id, @s6+2, 3, 'Decent but needs more seasoning.',                           NOW(), NOW());


COMMIT;
