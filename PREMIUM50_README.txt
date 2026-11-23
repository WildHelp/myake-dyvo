PREMIUM 5.0 — Installation (Українською)

1. Make a backup of the current GitHub repository before uploading.
2. Supabase Dashboard > Authentication > Users: copy YOUR admin User UID (not email or password).
3. Supabase > SQL Editor: run premium50.sql. Then separately execute:
   insert into public.shop_admins(user_id) values ('YOUR-REAL-UID') on conflict do nothing;
   Replace YOUR-REAL-UID with the UID from step 2.
4. Upload all changed/new website files from this archive to the ROOT of the GitHub repo (do not upload the outer folder).
5. Wait for GitHub Pages deployment, refresh with ?v=50. Log in to admin.html and check "Характеристики 5.0" and review moderation.
6. Test catalog, gallery, cart and checkout, and reviews in an incognito browser.

Security notes:
- Reviews are NOT published automatically; only approved=true is public.
- Public review form accepts an optional HTTPS image URL, NOT a direct photo upload.
- Public submissions need anti-spam/rate limiting/CAPTCHA before production promotion.
- Badge "Хіт продажів" is set manually; do not claim sales figures without evidence.
- SQL does NOT replace existing product RLS rules. Review existing product/storage/order policies separately.
- Only members of shop_admins may moderate reviews under the new policies.
- Existing product update policies may still allow broader access; audit them.
- Product ID is assumed bigint (as in the existing catalog); if products.id uses UUID, adapt toy_reviews.product_id accordingly.
