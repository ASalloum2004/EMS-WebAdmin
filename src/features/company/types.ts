export type CompanyApiStatus = "approved" | "pending" | "rejected";

export type CompanyDirectoryView = "company" | "manager";

export type ManagerSearchField = "name" | "email" | "phone";

export type ManagerListApiData = {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  companies_count: number;
  booths_count: number;
};

export type ManagerPaginationApiData = {
  data: ManagerListApiData[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

export type ManagersApiResponse = {
  status: boolean;
  message: string;
  data: ManagerPaginationApiData;
};

export type ManagerDirectoryApiData = {
  total_companies: number;
  total_booths: number;
  total_managers: number;
};

export type ManagerDirectoryApiResponse = {
  status: boolean;
  message: string;
  data: ManagerDirectoryApiData;
};

export type ManagerBoothApiData = {
  id: number;
  number: string;
  hall: string;
  label: string;
};

export type ManagerPortfolioApiData = {
  id: number;
  name: string;
  business_sector: string;
  phone: string;
  status: string;
  logo: string | null;
  booths: ManagerBoothApiData[];
};

export type ManagerDetailsApiData = {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  portfolios: ManagerPortfolioApiData[];
};

export type ManagerDetailsApiResponse = {
  status: boolean;
  message: string;
  data: ManagerDetailsApiData;
};

export type ManagerListItem = {
  internalId: number;
  name: string;
  email: string | null;
  avatar: string | null;
  companiesCount: number | null;
  boothsCount: number | null;
};

export type ManagerBooth = {
  number: string | null;
  hall: string | null;
  label: string | null;
};

export type ManagerPortfolio = {
  name: string;
  businessSector: string | null;
  phone: string | null;
  status: string | null;
  logo: string | null;
  booths: ManagerBooth[];
};

export type ManagerDetails = {
  name: string;
  email: string | null;
  avatar: string | null;
  portfolios: ManagerPortfolio[];
};

export type ManagerDirectory = {
  totalManagers: number;
  managedCompanies: number;
  managedBooths: number;
};

export type ManagerPagination = {
  currentPage: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
};

export type GetManagersParams = {
  page?: number;
  search?: string;
  searchField?: ManagerSearchField;
};

export type GetManagersResult = {
  managers: ManagerListItem[];
  pagination: ManagerPagination;
};

export type ManagerDetailsState = {
  details: ManagerDetails | null;
  error: string;
  isLoading: boolean;
};

export type CompanyListApiData = {
  id: number;
  name: string | null;
  business_sector: string | null;
  phone: string | null;
  status: CompanyApiStatus | null;
  logo: string | null;
  managers_count: number;
  booths_count: number;
};

export type CompanyManagerApiData = {
  id: number;
  name: string | null;
  email: string | null;
  avatar: string | null;
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
  status: CompanyApiStatus | null;
  logo: string | null;
  managers: CompanyManagerApiData[];
  booths: CompanyBoothApiData[];
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
  managersCount: number | null;
  boothsCount: number | null;
  status: string | null;
  logo: string | null;
};

export type CompanyManager = {
  name: string;
  email: string | null;
  avatar: string | null;
};

export type CompanyBooth = {
  number: string | null;
  hall: string | null;
  label: string | null;
};

export type CompanyDetails = Omit<
  CompanyListItem,
  "boothsCount" | "managersCount"
> & {
  managers: CompanyManager[];
  booths: CompanyBooth[];
};

export type CompanyFilters = {
  businessSector: string;
  status: "" | CompanyApiStatus;
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
  status?: CompanyApiStatus;
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
