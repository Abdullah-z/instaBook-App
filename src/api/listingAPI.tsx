import axiosInstance from './axios';

export const createListingAPI = async (listingData: any) => {
  const res = await axiosInstance.post('/listings', listingData);
  return res.data;
};

export const getListingsAPI = async () => {
  const res = await axiosInstance.get('/listings');
  return res.data;
};

export const getMyListingsAPI = async () => {
  const res = await axiosInstance.get('/listings/me');
  return res.data;
};

export const getListingAPI = async (id: string) => {
  const res = await axiosInstance.get(`/listings/${id}`);
  return res.data;
};

export const updateListingAPI = async (id: string, listingData: any) => {
  const res = await axiosInstance.patch(`/listings/${id}`, listingData);
  return res.data;
};

export const deleteListingAPI = async (id: string) => {
  const res = await axiosInstance.delete(`/listings/${id}`);
  return res.data;
};

export const markListingAsSoldAPI = async (id: string, isSold: boolean) => {
  const res = await axiosInstance.patch(`/listings/${id}/sold`, { isSold });
  return res.data;
};
