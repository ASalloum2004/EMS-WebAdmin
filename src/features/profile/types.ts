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
  avatar: string | null;
  is_verified: boolean;
};

export type AdminProfileResponse = {
  status: boolean;
  message: string;
  data: AdminProfileApiData;
};

export type AdminProfileUpdatePayload = {
  name?: string;
  avatar?: File | null;
};

export type AdminProfileUpdateResponse = {
  status: boolean;
  message: string;
  data: AdminProfileApiData;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirmation: string;
};

export type ChangePasswordApiPayload = {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
};

export type ChangePasswordResponse = {
  status: boolean;
  message: string;
  data: null;
};
