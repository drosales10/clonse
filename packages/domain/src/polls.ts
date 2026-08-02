export const POLL_PAGE_SIZE = 10;
export const POLL_MAX_PAGE = 10_000;

export type PollSort = "created" | "votes" | "views";

export interface PollCatalogQuery {
  page: number;
  sort: PollSort;
}

export interface PollCatalogPagination {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
  start: number;
  end: number;
}

export interface PublicPollOwner {
  username: string;
  displayName: string;
}

export interface PublicPollOptionResult {
  index: number;
  label: string;
  votes: number;
  percent: number;
}

export interface PublicPoll {
  id: string;
  legacyId: number | null;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  closed: boolean;
  totalVotes: number;
  views: number;
  optionCount: number;
  owner: PublicPollOwner;
}

export interface PublicPollDetail extends PublicPoll {
  options: PublicPollOptionResult[];
  viewerHasVoted: boolean;
  viewerOptionIndex: number | null;
  canVote: boolean;
  isOwner: boolean;
}

export interface PollCatalogResult {
  items: PublicPoll[];
  pagination: PollCatalogPagination;
}

export type PollVoteFormState = {
  errors?: { form?: string[]; option?: string[] };
  message?: string;
  success?: boolean;
};

export type PollCreateFormState = {
  errors?: { form?: string[]; title?: string[]; options?: string[] };
  message?: string;
  success?: boolean;
};

export type PollManageFormState = {
  errors?: { form?: string[] };
  message?: string;
  success?: boolean;
};

export function normalizePollQuery(input: Partial<PollCatalogQuery>): PollCatalogQuery {
  const requestedPage = Number.isInteger(input.page) ? Number(input.page) : 1;
  const page = Math.min(Math.max(requestedPage, 1), POLL_MAX_PAGE);
  const sort: PollSort =
    input.sort === "votes" || input.sort === "views" ? input.sort : "created";
  return { page, sort };
}

export function canReadPoll(ownerId: string, catalogVisible: boolean, viewerId: string | null): boolean {
  return viewerId === ownerId || catalogVisible;
}

export function parsePollOptions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0)
    .slice(0, 20);
}

export function pollVoteFromFormData(formData: FormData): {
  pollId: string;
  optionIndex: number | null;
} {
  const pollId = typeof formData.get("pollId") === "string" ? String(formData.get("pollId")).trim() : "";
  const raw = formData.get("optionIndex");
  const optionIndex = typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : null;
  return { pollId, optionIndex };
}

export function validatePollVoteInput(
  pollId: string,
  optionIndex: number | null,
  optionCount: number,
): PollVoteFormState["errors"] | null {
  if (!pollId) return { form: ["No se ha indicado la encuesta."] };
  if (optionIndex === null || !Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= optionCount) {
    return { option: ["Selecciona una opción válida."] };
  }
  return null;
}

export function pollCreateInputFromFormData(formData: FormData): {
  title: string;
  description: string;
  options: string[];
} {
  const title = typeof formData.get("title") === "string" ? String(formData.get("title")).trim() : "";
  const description =
    typeof formData.get("description") === "string" ? String(formData.get("description")).trim() : "";
  const rawOptions = typeof formData.get("options") === "string" ? String(formData.get("options")) : "";
  const options = rawOptions
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 12);
  return { title, description, options };
}

export function validatePollCreateInput(input: {
  title: string;
  description: string;
  options: string[];
}):
  | { success: true; data: { title: string; description: string | null; options: string[] } }
  | { success: false; errors: NonNullable<PollCreateFormState["errors"]> } {
  const errors: NonNullable<PollCreateFormState["errors"]> = {};
  if (!input.title || input.title.length > 120) {
    errors.title = ["El título es obligatorio (máx. 120 caracteres)."];
  }
  if (input.description.length > 500) {
    errors.form = ["La descripción no puede superar 500 caracteres."];
  }
  if (input.options.length < 2) {
    errors.options = ["Añade al menos 2 opciones (una por línea)."];
  }
  if (input.options.some((option) => option.length > 80)) {
    errors.options = ["Cada opción puede tener como máximo 80 caracteres."];
  }
  if (Object.keys(errors).length > 0) return { success: false, errors };
  return {
    success: true,
    data: {
      title: input.title,
      description: input.description || null,
      options: input.options,
    },
  };
}

export function buildPollOptionResults(
  options: string[],
  voteCounts: number[],
  totalVotes: number,
): PublicPollOptionResult[] {
  return options.map((label, index) => {
    const votes = voteCounts[index] ?? 0;
    const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
    return { index, label, votes, percent };
  });
}
