export type AdminProfile = {
  id: number;
  name: string;
  email: string;
  type: string;
  avatar: string;
  isVerified: boolean;
};

export type AdminProfileApiData = {
  id: number;
  name: string;
  email: string;
  type: string;
  avatar: string;
  is_verified: boolean;
};

export type AdminProfileResponse = {
  status: boolean;
  message: string;
  data: AdminProfileApiData;
};
