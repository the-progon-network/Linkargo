const delay = (ms = 400) => new Promise(r => setTimeout(r, ms));

let currentUser = null;
let jobs = [];
let quotes = [];
let jobIdCounter = 1;
let quoteIdCounter = 1;

export const auth = {
  login: async ({ email, password }) => {
    await delay();
    const user = { id: 1, name: 'Ahmed Khan', email, role: 'shipper', phone: '0311-1234567', company_name: 'Khan Traders' };
    currentUser = user;
    return { user, token: 'mock-token' };
  },
  register: async (form) => {
    await delay();
    const user = { id: 1, name: form.name, email: form.email, role: form.role, phone: form.phone, company_name: form.company_name, vehicle_type: form.vehicle_type, license_plate: form.license_plate };
    currentUser = user;
    return { user, token: 'mock-token' };
  },
};

export const jobsApi = {
  list: async () => { await delay(); return { jobs }; },
  myJobs: async () => { await delay(); return { jobs }; },
  create: async (form) => {
    await delay();
    const job = { id: jobIdCounter++, ...form, created_at: new Date().toISOString(), quote_count: 0 };
    jobs.unshift(job);
    return { job };
  },
};

export const quotesApi = {
  submit: async (jobId, form) => {
    await delay();
    const quote = { id: quoteIdCounter++, job_id: jobId, ...form, status: 'pending', created_at: new Date().toISOString() };
    quotes.unshift(quote);
    const job = jobs.find(j => j.id === jobId);
    if (job) job.quote_count = (job.quote_count || 0) + 1;
    return { quote };
  },
  forJob: async (jobId) => {
    await delay();
    return { quotes: quotes.filter(q => q.job_id === jobId).map(q => ({ ...q, job: jobs.find(j => j.id === q.job_id) })) };
  },
  myQuotes: async () => {
    await delay();
    return { quotes: quotes.map(q => ({ ...q, job: jobs.find(j => j.id === q.job_id) })) };
  },
  accept: async (quoteId) => {
    await delay();
    quotes = quotes.map(q => q.id === quoteId ? { ...q, status: 'accepted' } : { ...q, status: q.status === 'pending' ? 'rejected' : q.status });
    return { success: true };
  },
};

export const stats = {
  shipper: async () => {
    await delay();
    return { total_jobs: jobs.length, active_jobs: jobs.length, pending_quotes: quotes.filter(q => q.status === 'pending').length, completed_jobs: 0, total_spent: 0 };
  },
  carrier: async () => {
    await delay();
    return { total_revenue: 0, completed_jobs: 0, acceptance_rate: 0 };
  },
};

export const profiles = {
  update: async (form) => { await delay(); return { success: true }; },
};