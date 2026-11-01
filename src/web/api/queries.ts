import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Collab, CollabRequest, RequestWithCollab, User } from '../../shared/api';
import { api } from './client';
import { setPreviewMode } from './preview';

type UsersResponse = { users: User[]; lastResetAt: string | null };
type FeedResponse = { collabs: Collab[] };
type CollabResponse = { collab: Collab; myRequest: CollabRequest | null };
type MyRequestsResponse = { requests: RequestWithCollab[] };
type RequestResponse = { request: RequestWithCollab };
type SavedRequestResponse = { request: CollabRequest };

export const useUsers = () =>
  useQuery({
    queryKey: ['users'],
    queryFn: () => api.getList<UsersResponse>('/users', 'users'),
  });

export const useFeed = () =>
  useQuery({
    queryKey: ['collabs'],
    queryFn: () => api.getList<FeedResponse>('/collabs', 'collabs'),
  });

export const useCollab = (id: string) =>
  useQuery({
    queryKey: ['collabs', id],
    queryFn: () => api.get<CollabResponse>(`/collabs/${id}`),
  });

export const useMyRequests = () =>
  useQuery({
    queryKey: ['requests'],
    queryFn: () => api.getList<MyRequestsResponse>('/me/requests', 'requests'),
  });

export const useRequest = (id: string) =>
  useQuery({
    queryKey: ['requests', id],
    queryFn: () => api.get<RequestResponse>(`/requests/${id}`),
  });

export function useAskToJoin(collabId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pitch: string) =>
      api.post<SavedRequestResponse>(`/collabs/${collabId}/requests`, { pitch }),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['collabs'] }),
        queryClient.invalidateQueries({ queryKey: ['requests'] }),
      ]),
  });
}

export function useSubmitLink(requestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postUrl: string) =>
      api.post<SavedRequestResponse>(`/requests/${requestId}/submission`, { postUrl }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['requests'] }),
  });
}

export function useResetDemo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/demo/reset'),
    onSuccess: () => {
      setPreviewMode('normal');
      return queryClient.invalidateQueries();
    },
  });
}
