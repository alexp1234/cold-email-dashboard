export interface WarmupAdvancedSettings {
    warm_ctd: boolean;
    open_rate: number;
    important_rate: number;
    read_emulation: boolean;
    spam_save_rate: number;
    weekday_only: boolean;
  }
  
  export interface AccountStatusMessage {
    code: string;
    command: string;
    response: string;
    e_message: string;
    responseCode: number;
  }
  
  export interface AccountWarmupSettings {
    limit: number;
    advanced: WarmupAdvancedSettings;
    warmup_custom_ftag: string;
    increment: string;
    reply_rate: number;
  }
  
  export interface ListAccountApiResponse {
    items: Array<{
    email: string;
    timestamp_created: string;
    timestamp_updated: string;
    first_name: string;
    last_name: string;
    warmup: AccountWarmupSettings;
    added_by: string;
    daily_limit: number;
    modified_by: string;
    tracking_domain_name: string;
    tracking_domain_status: string;
    status: number;
    enable_slow_ramp: boolean;
    inbox_placement_test_limit: number;
    organization: string;
    timestamp_last_used: string;
    warmup_status: number;
    status_message?: AccountStatusMessage;
    timestamp_warmup_start: string;
    provider_code: number;
    setup_pending: boolean;
    warmup_pool_id: string;
    is_managed_account: boolean;
    dfy_password_changed: boolean;
    stat_warmup_score: number;
    sending_gap: number;
    }>
    next_starting_after: string;
  }
  
  export interface ListAccountsApiResponse {
    items: ListAccountApiResponse[];
    next_starting_after: string;
  }