# Manifesto di riconciliazione delle migration — 190

Generato il 25/08/2026 confrontando `supabase_migrations.schema_migrations` del
progetto `xcdyhkuyxukaifhhtadr` con `supabase/migrations/` di questo ramo.

**Nessuna riga `exact` si basa sul nome.** I due lati sono confrontati sul
contenuto, normalizzato togliendo le righe di solo commento e gli a capo
iniziali e finali. La regola e' stata stabilita empiricamente e verificata
byte per byte: il file git `20260817090000_finestra_sonno_una_sola_regola.sql`,
normalizzato, da' 2977 caratteri e md5 `2eb93af0b7a21508335068826986cedb`,
identico a quanto il database calcola sui propri `statements`.

Il manifesto remoto e' stato ricopiato e verificato con un checksum calcolato
dal database: `62d369aa0d1829c315c86b0a29117db6` da entrambe le parti.

| versione_remota | nome_remoto | md5_statements_database | file_git | md5_file | stato | decisione |
|---|---|---|---|---|---|---|
| 20260522105841 | mesh_groups_schema | c0d4106942cf | 20260522105841_mesh_groups_schema.sql | c0d4106942cf | exact | nessuna azione |
| 20260522110735 | mesh_groups_rls | abe8c7f73b6e | 20260522110735_mesh_groups_rls.sql | abe8c7f73b6e | exact | nessuna azione |
| 20260522111102 | rpc_group_lifecycle | c851388bdb92 | 20260522111102_rpc_group_lifecycle.sql | c851388bdb92 | exact | nessuna azione |
| 20260522111456 | rpc_group_invites | b25e55c4c773 | 20260522111456_rpc_group_invites.sql | b25e55c4c773 | exact | nessuna azione |
| 20260522111757 | rpc_member_mgmt | 8884be10ced6 | 20260522111757_rpc_member_mgmt.sql | 8884be10ced6 | exact | nessuna azione |
| 20260522112506 | anonymize_left_members_cron | 636deadf7701 | 20260522112506_anonymize_left_members_cron.sql | 636deadf7701 | exact | nessuna azione |
| 20260522124256 | mesh_famiglia_metrics_view | 4846362317b7 | 20260522124256_mesh_famiglia_metrics_view.sql | 4846362317b7 | exact | nessuna azione |
| 20260522205550 | profile_fields | e6ba19f865d2 | 20260522205550_profile_fields.sql | e6ba19f865d2 | exact | nessuna azione |
| 20260522211850 | profile_notifications_flag | 3f19374ce3d3 | 20260522211850_profile_notifications_flag.sql | 3f19374ce3d3 | exact | nessuna azione |
| 20260611173133 | fitness_metrics_stress_avg | d183f2fc7284 | 20260611173133_fitness_metrics_stress_avg.sql | d183f2fc7284 | exact | nessuna azione |
| 20260616154408 | revoke_grant_pro_until_to_email | e65fe5460e37 | 20260616154408_revoke_grant_pro_until_to_email.sql | e65fe5460e37 | exact | nessuna azione |
| 20260622142421 | founder_backfill_lifetime | 3c89ed01795d | 20260622142421_founder_backfill_lifetime.sql | 3c89ed01795d | exact | nessuna azione |
| 20260622143224 | user_roles_review_email_sent | 6ad4d9209ea5 | 20260622143224_user_roles_review_email_sent.sql | 6ad4d9209ea5 | exact | nessuna azione |
| 20260629192306 | fitness_metrics_sleep_apnea | 342fe25efc02 | 20260629192306_fitness_metrics_sleep_apnea.sql | 342fe25efc02 | exact | nessuna azione |
| 20260630144519 | post_stats | 051b254e6a01 | 20260630144519_post_stats.sql | 051b254e6a01 | exact | nessuna azione |
| 20260713064125 | fitness_metrics_hrv_sdnn | 0d20bd633c64 | 20260713064125_fitness_metrics_hrv_sdnn.sql | 0d20bd633c64 | exact | nessuna azione |
| 20260714112434 | first_sync_activation_tracking | 879d859ef811 | 20260714112434_first_sync_activation_tracking.sql | 879d859ef811 | exact | nessuna azione |
| 20260714123833 | first_sync_activation_tracking_revoke_anon | 907aa10a6c11 | 20260714123833_first_sync_activation_tracking_revoke_anon.sql | 907aa10a6c11 | exact | nessuna azione |
| 20260714123911 | first_sync_legacy_activation_backfill | dffc49cab0c8 | 20260714123911_first_sync_legacy_activation_backfill.sql | dffc49cab0c8 | exact | nessuna azione |
| 20260715095915 | handle_new_founder_exclude_invalid_tld | 533461dc2d59 | 20260715095915_handle_new_founder_exclude_invalid_tld.sql | 533461dc2d59 | exact | nessuna azione |
| 20260715183049 | disable_founder_launch_autogrant_trigger | 6b7fe1ed0f69 | 20260715183049_disable_founder_launch_autogrant_trigger.sql | 6b7fe1ed0f69 | exact | nessuna azione |
| 20260720120247 | founder_launch_exclude_review_email_alias | 95a8c246b6e6 | 20260720120247_founder_launch_exclude_review_email_alias.sql | 95a8c246b6e6 | exact | nessuna azione |
| 20260722062946 | fitness_metrics_canonical_upsert | fca125d47bfb | 20260722062946_fitness_metrics_canonical_upsert.sql | fca125d47bfb | exact | nessuna azione |
| 20260722084132 | sleep_lossless_merge_and_helper_schema_move | 4eca904ea37c | 20260722084132_sleep_lossless_merge_and_helper_schema_move.sql | 4eca904ea37c | exact | nessuna azione |
| 20260722084223 | workouts_canonical_upsert | 5dd69b436d1e | 20260722084223_workouts_canonical_upsert.sql | 5dd69b436d1e | exact | nessuna azione |
| 20260722084840 | advisor_fixes_search_path_and_rls_initplan | cc59dd5d21c8 | 20260722084840_advisor_fixes_search_path_and_rls_initplan.sql | cc59dd5d21c8 | exact | nessuna azione |
| 20260722111746 | explicit_revoke_anon_execute_189rc2 | 412b34ebd8fa | 20260722111746_explicit_revoke_anon_execute_189rc2.sql | 412b34ebd8fa | exact | nessuna azione |
| 20260722145516 | workouts_fuzzy_merge_and_race_lock | f3d2a5517d8a | 20260722145516_workouts_fuzzy_merge_and_race_lock.sql | f3d2a5517d8a | exact | nessuna azione |
| 20260729161059 | founder_launch_cutoff_and_window | e4395e56563f | 20260729161059_founder_launch_cutoff_and_window.sql | e4395e56563f | exact | nessuna azione |
| 20260729161132 | harden_legacy_b2c_trial_acl | 05d20dcd9773 | 20260729161132_harden_legacy_b2c_trial_acl.sql | 05d20dcd9773 | exact | nessuna azione |
| 20260729161245 | entitlement_status_contract | b62d68d1af0d | 20260729161245_entitlement_status_contract.sql | b62d68d1af0d | exact | nessuna azione |
| 20260816101622 | entitlement_autorita_sei_casi | 9534aaf95a56 | 20260816101622_entitlement_autorita_sei_casi.sql | 9534aaf95a56 | exact | nessuna azione |
| 20260816103101 | registra_tentativo_acquisto_rpc | 6bb8d600ba50 | 20260816103101_registra_tentativo_acquisto_rpc.sql | 6bb8d600ba50 | exact | nessuna azione |
| 20260816125359 | ring_reward_premio_sano | 1d2c71dc70f7 | 20260816125359_ring_reward_premio_sano.sql | 1d2c71dc70f7 | exact | nessuna azione |
| 20260817073706 | finestra_sonno_una_sola_regola | 2eb93af0b7a2 | 20260817073706_finestra_sonno_una_sola_regola.sql | 2eb93af0b7a2 | exact | nessuna azione |
| 20260817204554 | cessione_ios_niente_500_e_rinnovo | bcf1b24b607c | 20260817204554_cessione_ios_niente_500_e_rinnovo.sql | bcf1b24b607c | exact | nessuna azione |
| 20260522133947 | group_events_webhook_trigger | 14848f28e7b4 | 20260522120009_group_events_webhook_trigger.sql | 00d196e904c9 | drift-contenuto | autorita al remoto sotto la sua versione; il file locale esce dalle attive o diventa forward-only |
| 20260610121037 | user_roles_expiry | aff3abd511f0 | 20260610120001_user_roles_expiry.sql | e0fbdaadff7d | drift-contenuto | autorita al remoto sotto la sua versione; il file locale esce dalle attive o diventa forward-only |
| 20260610123313 | founder_launch_autogrant | 4e62a9214118 | 20260610120002_founder_launch_autogrant.sql | d9934bad6dfd | drift-contenuto | autorita al remoto sotto la sua versione; il file locale esce dalle attive o diventa forward-only |
| 20260612055144 | ring_reward_antifraud | 8091a5e058c0 | 20260612120001_ring_reward_antifraud.sql | 7ce2c1ddc0aa | drift-contenuto | autorita al remoto sotto la sua versione; il file locale esce dalle attive o diventa forward-only |
| 20260720055513 | founder_launch_first_sync_grant | 550f9295a371 | 20260720055513_founder_launch_first_sync_grant.sql | 729082f1b383 | drift-contenuto | stessa versione, contenuto diverso: autorita al remoto |
| 20260729161341 | founder_reserve_cutoff_gate | 06aac48a8c22 | 20260729161341_founder_reserve_cutoff_gate.sql | 32138e2f44d8 | drift-contenuto | stessa versione, contenuto diverso: autorita al remoto |
| 20260816100548 | entitlement_autorita_unica | 33e142dce89b | 20260816140000_entitlement_autorita_unica.sql | ba77d92bb9ee | drift-contenuto | autorita al remoto sotto la sua versione; il file locale esce dalle attive o diventa forward-only |
| 20260816100824 | entitlement_gate_scritture_salute | be62460847b2 | 20260816150000_entitlement_gate_scritture_salute.sql | fa9f9fc430b1 | drift-contenuto | autorita al remoto sotto la sua versione; il file locale esce dalle attive o diventa forward-only |
| 20260816102210 | registro_pagamenti_segnalati | 65276edb3b0c | 20260816170000_registro_pagamenti_segnalati.sql | 6c98944ff8af | drift-contenuto | autorita al remoto sotto la sua versione; il file locale esce dalle attive o diventa forward-only |
| 20260816103021 | registro_tentativi_acquisto | 38b528ece275 | 20260816180000_registro_tentativi_acquisto.sql | ecfe01eb80f6 | drift-contenuto | autorita al remoto sotto la sua versione; il file locale esce dalle attive o diventa forward-only |
| 20260816124508 | entitlement_una_sola_regola | 68167616e732 | 20260816200000_entitlement_una_sola_regola.sql | 88d6ee0f25ea | drift-contenuto | autorita al remoto sotto la sua versione; il file locale esce dalle attive o diventa forward-only |
| 20260817201814 | cessione_ios_ponte_temporaneo | d2fa186089c6 | 20260817204500_cessione_ios_ponte_temporaneo.sql | bcf1b24b607c | drift-contenuto | autorita al remoto sotto la sua versione; il file locale esce dalle attive o diventa forward-only |
| 20260516194546 | 007_rls_insert_policies_mobile | 404ed2edee39 |  |  | remote_only | recuperare da statements con la versione remota |
| 20260516213951 | init_beta_signups | e765574dde66 |  |  | remote_only | recuperare da statements con la versione remota |
| 20260517143818 | fix_device_pairing_codes_regex | 7d89fc753074 |  |  | remote_only | recuperare da statements con la versione remota |
| 20260519081057 | 009_beta_waitlist | 278afae5a41b |  |  | remote_only | recuperare da statements con la versione remota |
| 20260519081638 | 010_system_notifications | 75b7f467f7e7 |  |  | remote_only | recuperare da statements con la versione remota |
| 20260519162257 | 011_devices_fcm_token | 25b396f035b6 |  |  | remote_only | recuperare da statements con la versione remota |
| 20260521121027 | grant_pro_to_email_helper | 9e4e9dd53168 |  |  | remote_only | recuperare da statements con la versione remota |
| 20260521121546 | grant_pro_to_email_fix_type | 4d75a9ebc205 |  |  | remote_only | recuperare da statements con la versione remota |
| 20260521151248 | create_beta_tester_account_helper | adbe90f41403 |  |  | remote_only | recuperare da statements con la versione remota |
| 20260521151540 | drop_create_beta_tester_account_helper | fb5a69fd7630 |  |  | remote_only | recuperare da statements con la versione remota |
| 20260522085007 | add_extra_health_metrics | 93dbe8841967 |  |  | remote_only | recuperare da statements con la versione remota |
| 20260522110516 | mesh_groups_index_fixes | d19b113b9b3c |  |  | remote_only | recuperare da statements con la versione remota |
| 20260522112135 | rls_metrics_group_sharing | 7f2749d74e7a |  |  | remote_only | recuperare da statements con la versione remota |
| 20260523092742 | beta_signups_ip_hash_text | 548b2c435bd2 |  |  | remote_only | recuperare da statements con la versione remota |
| 20260523093723 | beta_signups_welcome_sent_at | fa1043dc4588 |  |  | remote_only | recuperare da statements con la versione remota |
| 20260523094540 | fix_group_members_rls_recursion | 44e257b3aa04 |  |  | remote_only | recuperare da statements con la versione remota |
| 20260523144447 | fix_create_group_invite_pgcrypto_and_encoding | a44282b027eb |  |  | remote_only | recuperare da statements con la versione remota |
| 20260524104251 | founder_grants_v100_opzione_b | e742c9785b6d |  |  | remote_only | recuperare da statements con la versione remota |
| 20260524125136 | fitness_metrics_hr_source_v101 | 9e562df2d155 |  |  | remote_only | recuperare da statements con la versione remota |
| 20260525080147 | harden_is_admin_email_whitelist | 9fe99290ec4a |  |  | remote_only | recuperare da statements con la versione remota |
| 20260526144110 | rate_limit_buckets_and_rpc | e27d20641718 |  |  | remote_only | recuperare da statements con la versione remota |
| 20260615093729 | payload_cms_schema | a09b2378d4c7 |  |  | remote_only | recuperare da statements con la versione remota |
| 20260615131738 | posts_body_richtext_column | cfb2f79a644d |  |  | remote_only | recuperare da statements con la versione remota |
| 20260616065134 | gdpr_process_deletions_function | d1216b1774f6 |  |  | remote_only | recuperare da statements con la versione remota |
| 20260616070752 | schedule_process_deletions_cron | 33cee4b4d2e5 |  |  | remote_only | recuperare da statements con la versione remota |
| 20260616071926 | harden_function_search_path | d57cc673117c |  |  | remote_only | recuperare da statements con la versione remota |
| 20260622142336 | founder_grant_lifetime | 37c034f639b9 |  |  | remote_only | recuperare da statements con la versione remota |
| 20260625101636 | add_delete_current_user_function | 04bed01b4a22 |  |  | remote_only | recuperare da statements con la versione remota |
| 20260718073343 | dashboard_snapshot_rpc | 87944328b7cb |  |  | remote_only | recuperare da statements con la versione remota |
| 20260730173213 | p0_fitness_metrics_rls_perf_hardening | 97e5df95bb40 |  |  | remote_only | recuperare da statements con la versione remota |
| 20260730173649 | p0_fitness_metrics_rls_rollback_role_scope_bug | da4a8c6a3c63 |  |  | remote_only | recuperare da statements con la versione remota |
| 20260730180553 | p0_fitness_metrics_restore_policy_role_scope | 9bd67cb86e53 |  |  | remote_only | recuperare da statements con la versione remota |
| 20260731095701 | p0_fitness_metrics_rls_perf_hardening_v2 | 3083cc84d375 |  |  | remote_only | recuperare da statements con la versione remota |
| 20260805081803 | dashboard_snapshot_revenue | 5dc08972c025 |  |  | remote_only | recuperare da statements con la versione remota |
| 20260807093327 | dashboard_snapshot_fix_apple_billing_source | 59b3c7b65869 |  |  | remote_only | recuperare da statements con la versione remota |
| 20260808144749 | dashboard_snapshot_leading_indicators | 446ca65c4470 |  |  | remote_only | recuperare da statements con la versione remota |
| 20260815074409 | dashboard_snapshot_real_sync | b9f7eff2cee1 |  |  | remote_only | recuperare da statements con la versione remota |
| 20260816080658 | sleep_merge_no_duplicazione | 15ce756ecfc5 |  |  | remote_only | recuperare da statements con la versione remota |
| 20260816092657 | dashboard_snapshot_founder_trial_split | 2c63ab62e0ec |  |  | remote_only | recuperare da statements con la versione remota |
| 20260816093034 | dashboard_snapshot_platform_fallback | 56e0bf5504fe |  |  | remote_only | recuperare da statements con la versione remota |
| 20260818084202 | dashboard_snapshot_payments_history | 36c490a5789a |  |  | remote_only | recuperare da statements con la versione remota |
|  | init_profiles_roles |  | 20260513120001_init_profiles_roles.sql | e16ae50a2470 | local_only | mai applicata: archiviare fuori da migrations/, o riportarne le proprieta in una nuova migration successiva |
|  | init_devices_pairing |  | 20260513120002_init_devices_pairing.sql | 152c0fb3c18f | local_only | mai applicata: archiviare fuori da migrations/, o riportarne le proprieta in una nuova migration successiva |
|  | init_fitness_metrics |  | 20260513120003_init_fitness_metrics.sql | c44c4c419663 | local_only | mai applicata: archiviare fuori da migrations/, o riportarne le proprieta in una nuova migration successiva |
|  | init_events_audit |  | 20260513120004_init_events_audit.sql | 8f85c5acc3eb | local_only | mai applicata: archiviare fuori da migrations/, o riportarne le proprieta in una nuova migration successiva |
|  | init_consents_settings |  | 20260513120005_init_consents_settings.sql | 32759672a637 | local_only | mai applicata: archiviare fuori da migrations/, o riportarne le proprieta in una nuova migration successiva |
|  | admin_aggregates |  | 20260513120006_admin_aggregates.sql | d722181efe18 | local_only | mai applicata: archiviare fuori da migrations/, o riportarne le proprieta in una nuova migration successiva |
|  | pg_cron_jobs |  | 20260513120007_pg_cron_jobs.sql | 8c5b037b08bf | local_only | mai applicata: archiviare fuori da migrations/, o riportarne le proprieta in una nuova migration successiva |
|  | init_gym_core |  | 20260514120001_init_gym_core.sql | 191f40fe5445 | local_only | mai applicata: archiviare fuori da migrations/, o riportarne le proprieta in una nuova migration successiva |
|  | init_challenges |  | 20260514120002_init_challenges.sql | dc7734820d39 | local_only | mai applicata: archiviare fuori da migrations/, o riportarne le proprieta in una nuova migration successiva |
|  | init_anti_cheat |  | 20260514120003_init_anti_cheat.sql | b03580de971c | local_only | mai applicata: archiviare fuori da migrations/, o riportarne le proprieta in una nuova migration successiva |
|  | init_b2c_subs |  | 20260514120004_init_b2c_subs.sql | 1bc625fa7325 | local_only | mai applicata: archiviare fuori da migrations/, o riportarne le proprieta in una nuova migration successiva |
|  | gym_gateway_functions |  | 20260514120005_gym_gateway_functions.sql | 936ecf459f7b | local_only | mai applicata: archiviare fuori da migrations/, o riportarne le proprieta in una nuova migration successiva |
|  | sprint0_fixes |  | 20260514120006_sprint0_fixes.sql | a5dc62bf90a2 | local_only | mai applicata: archiviare fuori da migrations/, o riportarne le proprieta in una nuova migration successiva |
|  | schedule_fcm_sync_trigger_cron |  | 20260520120001_schedule_fcm_sync_trigger_cron.sql | 529fab2cc296 | local_only | mai applicata: archiviare fuori da migrations/, o riportarne le proprieta in una nuova migration successiva |
|  | 20260522120001b_mesh_groups_index_fixes.sql |  | 20260522120001b_mesh_groups_index_fixes.sql | d19b113b9b3c | local_only | mai applicata: archiviare fuori da migrations/, o riportarne le proprieta in una nuova migration successiva |
|  | rls_health_data_group_sharing |  | 20260522120006_rls_health_data_group_sharing.sql | 87ee5973773a | local_only | mai applicata: archiviare fuori da migrations/, o riportarne le proprieta in una nuova migration successiva |
|  | gdpr_deletion_execution |  | 20260616090000_gdpr_deletion_execution.sql | 38edb207673f | local_only | mai applicata: archiviare fuori da migrations/, o riportarne le proprieta in una nuova migration successiva |
|  | fitness_metrics_hrv_historical_correction |  | 20260711120001_fitness_metrics_hrv_historical_correction.sql | 923f58aa0de4 | local_only | mai applicata: archiviare fuori da migrations/, o riportarne le proprieta in una nuova migration successiva |

## Riepilogo

| stato | righe |
|---|---|
| drift-contenuto | 12 |
| exact | 36 |
| local_only | 18 |
| remote_only | 41 |
| **totale** | **107** |
