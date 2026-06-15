import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useIncidentChat } from '@/hooks/use-incident-chat';
import { getMessages, sendMessage } from '@/services/messages';
import { getValidToken } from '@/storage/tokens';
import type { MessageResponse } from '@/types/messages';

jest.mock('@/services/messages');
jest.mock('@/storage/tokens');

// ── SignalR mock ─────────────────────────────────────────────────────────────
// Variables prefixed with "mock" are allowed to be referenced inside jest.mock factories.

const mockHubOn           = jest.fn();
const mockHubStart        = jest.fn().mockResolvedValue(undefined);
const mockHubStop         = jest.fn().mockResolvedValue(undefined);
const mockHubInvoke       = jest.fn().mockResolvedValue(undefined);
const mockHubOnreconnected   = jest.fn();
const mockHubOnreconnecting  = jest.fn();
const mockHubOnclose         = jest.fn();

const mockHubConnection = {
  on:             mockHubOn,
  start:          mockHubStart,
  stop:           mockHubStop,
  invoke:         mockHubInvoke,
  onreconnected:  mockHubOnreconnected,
  onreconnecting: mockHubOnreconnecting,
  onclose:        mockHubOnclose,
  state:          'Connected',
};

jest.mock('@microsoft/signalr', () => ({
  HubConnectionBuilder: jest.fn().mockImplementation(() => ({
    withUrl:               jest.fn().mockReturnThis(),
    withAutomaticReconnect: jest.fn().mockReturnThis(),
    build:                 jest.fn().mockReturnValue(mockHubConnection),
  })),
  HttpTransportType:    { WebSockets: 4 },
  HubConnectionState:   { Connected: 'Connected', Disconnected: 'Disconnected' },
}));

// ── Fixtures ─────────────────────────────────────────────────────────────────

const mockGetMessages = getMessages as jest.Mock;
const mockSendMessage = sendMessage as jest.Mock;
const mockGetToken    = getValidToken as jest.Mock;

const msg1: MessageResponse = {
  id: 'm1', incident_id: 'inc-1', content: 'Hello',
  author_user_id: 'u1', author_name: 'Alice', author_role: 'Citizen',
  created_at: '2025-01-01T00:00:00Z',
};
const msg2: MessageResponse = {
  id: 'm2', incident_id: 'inc-1', content: 'World',
  author_user_id: 'u2', author_name: 'Bob', author_role: 'Agent',
  created_at: '2025-01-02T00:00:00Z',
};

// ── Helper to grab the ReceiveMessage callback ────────────────────────────────

function getReceiveHandler(): (msg: MessageResponse) => void {
  const call = mockHubOn.mock.calls.find(([event]: [string]) => event === 'ReceiveMessage');
  return call?.[1];
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useIncidentChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHubStart.mockResolvedValue(undefined);
    mockHubStop.mockResolvedValue(undefined);
    mockHubInvoke.mockResolvedValue(undefined);
    mockHubConnection.state = 'Connected';
    mockGetToken.mockResolvedValue('token-abc');
    mockGetMessages.mockResolvedValue([msg1, msg2]);
    mockSendMessage.mockResolvedValue(undefined);
  });

  it('returns empty state when incidentId is null', () => {
    const { result } = renderHook(() => useIncidentChat(null));
    expect(result.current.messages).toHaveLength(0);
    expect(result.current.connected).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('does not create a SignalR connection when incidentId is null', () => {
    const { HubConnectionBuilder } = jest.requireMock('@microsoft/signalr');
    renderHook(() => useIncidentChat(null));
    expect(HubConnectionBuilder).not.toHaveBeenCalled();
  });

  it('starts connection and loads history when incidentId is provided', async () => {
    const { result } = renderHook(() => useIncidentChat('inc-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockHubStart).toHaveBeenCalled();
    expect(mockHubInvoke).toHaveBeenCalledWith('JoinIncident', 'inc-1');
    expect(result.current.connected).toBe(true);
    expect(result.current.messages).toHaveLength(2);
  });

  it('registers ReceiveMessage handler on the connection', async () => {
    renderHook(() => useIncidentChat('inc-1'));
    await waitFor(() => expect(mockHubOn).toHaveBeenCalled());
    expect(mockHubOn).toHaveBeenCalledWith('ReceiveMessage', expect.any(Function));
  });

  it('appends a new message when ReceiveMessage fires', async () => {
    mockGetMessages.mockResolvedValue([msg1]);
    const { result } = renderHook(() => useIncidentChat('inc-1'));
    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    act(() => getReceiveHandler()(msg2));
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1].id).toBe('m2');
  });

  it('deduplicates messages with the same id on ReceiveMessage', async () => {
    mockGetMessages.mockResolvedValue([msg1]);
    const { result } = renderHook(() => useIncidentChat('inc-1'));
    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    act(() => getReceiveHandler()(msg1));
    expect(result.current.messages).toHaveLength(1);
  });

  it('sets connected to false on reconnecting', async () => {
    const { result } = renderHook(() => useIncidentChat('inc-1'));
    await waitFor(() => expect(result.current.connected).toBe(true));
    const reconnectingCb = mockHubOnreconnecting.mock.calls[0][0];
    act(() => reconnectingCb());
    expect(result.current.connected).toBe(false);
  });

  it('sets connected to true on reconnected', async () => {
    const { result } = renderHook(() => useIncidentChat('inc-1'));
    await waitFor(() => expect(result.current.connected).toBe(true));
    act(() => (mockHubOnreconnecting.mock.calls[0][0])());
    expect(result.current.connected).toBe(false);
    act(() => (mockHubOnreconnected.mock.calls[0][0])());
    expect(result.current.connected).toBe(true);
  });

  it('stays silent when connection fails', async () => {
    mockHubStart.mockRejectedValue(new Error('Connection refused'));
    const { result } = renderHook(() => useIncidentChat('inc-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.connected).toBe(false);
    expect(result.current.messages).toHaveLength(0);
  });

  it('resets messages and disconnects when incidentId changes to null', async () => {
    const { result, rerender } = renderHook(({ id }) => useIncidentChat(id), {
      initialProps: { id: 'inc-1' as string | null },
    });
    await waitFor(() => expect(result.current.messages).toHaveLength(2));
    rerender({ id: null });
    expect(result.current.messages).toHaveLength(0);
    expect(result.current.connected).toBe(false);
  });

  it('stops the connection on unmount', async () => {
    const { unmount } = renderHook(() => useIncidentChat('inc-1'));
    await waitFor(() => expect(mockHubStart).toHaveBeenCalled());
    unmount();
    await waitFor(() => expect(mockHubStop).toHaveBeenCalled());
  });

  it('send calls sendMessage with trimmed content and token', async () => {
    const { result } = renderHook(() => useIncidentChat('inc-1'));
    await waitFor(() => expect(result.current.connected).toBe(true));
    await act(() => result.current.send('  Hello  '));
    expect(mockSendMessage).toHaveBeenCalledWith('inc-1', 'Hello', 'token-abc');
  });

  it('send does nothing when content is blank', async () => {
    const { result } = renderHook(() => useIncidentChat('inc-1'));
    await waitFor(() => expect(result.current.connected).toBe(true));
    await act(() => result.current.send('   '));
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('send does nothing when no valid token', async () => {
    mockGetToken.mockResolvedValue(null);
    const { result } = renderHook(() => useIncidentChat('inc-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(() => result.current.send('Hello'));
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('send does nothing when incidentId is null', async () => {
    const { result } = renderHook(() => useIncidentChat(null));
    await act(() => result.current.send('Hello'));
    expect(mockSendMessage).not.toHaveBeenCalled();
  });
});
