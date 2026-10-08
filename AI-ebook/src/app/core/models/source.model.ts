export interface Source {
  id: string;
  title: string;
  publisher: string;
  domain: string;
  url: string;
  relevance?: number;
  excerpt?: string;
  locked?: boolean;
  accessDate: string;
  selected: boolean;
}
