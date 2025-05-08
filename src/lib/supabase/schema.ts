
export const schema = {
  leads: {
    id: 'uuid primary key default uuid_generate_v4()',
    name: 'text not null',
    phone_number: 'text not null',
    phone_id: 'text',
    status: 'text not null',
    disposition: 'text',
    duration: 'float8',
    cost: 'float8',
    created_at: 'timestamp with time zone default now()',
    updated_at: 'timestamp with time zone default now()'
  },
  phone_ids: {
    id: 'text primary key',
    daily_call_count: 'int not null default 0',
    total_calls: 'int not null default 0',
    last_used_at: 'timestamp with time zone',
    last_reset_at: 'timestamp with time zone default now()'
  },
  call_stats: {
    id: 'uuid primary key default uuid_generate_v4()',
    completed_calls: 'int not null default 0',
    in_progress_calls: 'int not null default 0',
    remaining_calls: 'int not null default 0',
    failed_calls: 'int not null default 0',
    total_minutes: 'float8 not null default 0',
    total_cost: 'float8 not null default 0',
    updated_at: 'timestamp with time zone default now()'
  }
};
