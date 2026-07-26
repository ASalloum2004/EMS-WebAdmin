export type CompanySocialLinksApiData = {
  linkedin?: string | null;
  website?: string | null;
};

export type CompanyListApiData = {
  id: number;
  name: string | null;
  business_sector: string | null;
  phone: string | null;
  status: string | null;
  logo: string | null;
  managers_count: number;
  booths_count: number;
};

export type CompanyManagerApiData = {
  id: number;
  name: string | null;
  email: string | null;
  avatar: string | null;
  phone?: string | null;
};

export type CompanyBoothApiData = {
  id: number;
  number: string | null;
  hall: string | null;
  label: string | null;
};

export type CompanyDetailsApiData = {
  id: number;
  name: string | null;
  business_sector: string | null;
  phone: string | null;
  status: string | null;
  logo: string | null;
  managers: CompanyManagerApiData[];
  booths: CompanyBoothApiData[];
  description?: string | null;
  social_links?: CompanySocialLinksApiData | null;
  headquarters_lat?: number | string | null;
  headquarters_lng?: number | string | null;
  gallery?: unknown;
};

export type CompaniesApiResponse = {
  status: boolean;
  message: string;
  data: {
    data: CompanyListApiData[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};

export type CompanyDetailsApiResponse = {
  status: boolean;
  message: string;
  data: CompanyDetailsApiData;
};

export type CompanyListItem = {
  id: number;
  name: string;
  businessSector: string;
  phone: string | null;
  status: string | null;
  logo: string | null;
};

export type CompanyManager = {
  name: string;
  email: string | null;
  avatar: string | null;
  phone: string | null;
};

export type CompanyBooth = {
  number: string | null;
  hall: string | null;
  label: string | null;
};

export type CompanySocialLinks = {
  linkedin: string | null;
  website: string | null;
};

export type CompanyDetails = CompanyListItem & {
  description: string | null;
  socialLinks: CompanySocialLinks | null;
  headquartersLat: number | string | null;
  headquartersLng: number | string | null;
  gallery: string[];
  managers: CompanyManager[];
  booths: CompanyBooth[];
};

export type CompanyFilters = {
  businessSector: string;
};

export type CompanyPagination = {
  currentPage: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
};

export type GetCompaniesParams = {
  businessSector?: string;
  name?: string;
  page?: number;
  perPage?: number;
};

export type GetCompaniesResult = {
  companies: CompanyListItem[];
  pagination: CompanyPagination;
};

export type CompanyDetailsState = {
  details: CompanyDetails | null;
  error: string;
  isLoading: boolean;
};
