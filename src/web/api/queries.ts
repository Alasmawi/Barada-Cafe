import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Collab,
  CollabRequest,
  InboxRequest,
  RequestWithCollab,
  User,
} from '../../shared/api';
import type { CollabInput } from '../../shared/schemas';
import { api } from './client';
import { setPreviewMode } from './preview';

type UsersResponse = { users: User[]; lastResetAt: string | null };
type FeedResponse = { collabs: Collab[] };
type CollabResponse = { collab: Collab; myRequest: CollabRequest | null };
type MyRequestsResponse = { requests: RequestWithCollab[] };
type RequestResponse = { request: RequestWithCollab };
type SavedRequestResponse = { request: CollabRequest };
type InboxResponse = { requests: InboxRequest[] };
type SavedCollabResponse = { collab: Collab };

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

export const useCafeCollabs = () =>
  useQuery({
    queryKey: ['collabs', 'mine'],
    queryFn: () => api.getList<FeedResponse>('/cafe/collabs', 'collabs'),
  });

export const useInbox = (collabId: string) =>
  useQuery({
    queryKey: ['collabs', collabId, 'requests'],
    queryFn: () => api.getList<InboxResponse>(`/collabs/${collabId}/requests`, 'requests'),
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

/** Create when `collabId` is missing, otherwise edit. */
export function useSaveCollab(collabId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CollabInput) =>
      collabId
        ? api.put<SavedCollabResponse>(`/collabs/${collabId}`, input)
        : api.post<SavedCollabResponse>('/collabs', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['collabs'] }),
  });
}

function withAccepted(collab: CollabResponse): CollabResponse {
  const spotsTaken = collab.collab.spotsTaken + 1;
  const spotsLeft = Math.max(collab.collab.spots - spotsTaken, 0);
  const state = spotsLeft === 0 ? 'full' : collab.collab.state;
  return { ...collab, collab: { ...collab.collab, spotsTaken, spotsLeft, state } };
}

/**
 * Moves the cup the moment staff tap Accept, and rolls back if the server says no.
 * `onFailed` is a hook option, not a `mutate` one: it must fire for every tap, and it has
 * to report above the card, which has already moved to another tab by then.
 */
export function useAcceptRequest(collabId: string, onFailed: (error: Error) => void) {
  const queryClient = useQueryClient();
  const collabKey = ['collabs', collabId];
  const inboxKey = ['collabs', collabId, 'requests'];

  return useMutation({
    mutationFn: (requestId: string) => api.post(`/requests/${requestId}/accept`),
    onMutate: async (requestId) => {
      await queryClient.cancelQueries({ queryKey: collabKey });
      const previousCollab = queryClient.getQueryData<CollabResponse>(collabKey);
      const previousInbox = queryClient.getQueryData<InboxResponse>(inboxKey);

      if (previousCollab) queryClient.setQueryData(collabKey, withAccepted(previousCollab));
      if (previousInbox) {
        queryClient.setQueryData<InboxResponse>(inboxKey, {
          requests: previousInbox.requests.map((request) =>
            request.id === requestId ? { ...request, status: 'accepted' } : request,
          ),
        });
      }
      return { previousCollab, previousInbox };
    },
    onError: (error, _requestId, context) => {
      queryClient.setQueryData(collabKey, context?.previousCollab);
      queryClient.setQueryData(inboxKey, context?.previousInbox);
      onFailed(error);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['collabs'] }),
  });
}

export function useRequestAction(requestId: string, action: 'decline' | 'complete') {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/requests/${requestId}/${action}`),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['collabs'] }),
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
