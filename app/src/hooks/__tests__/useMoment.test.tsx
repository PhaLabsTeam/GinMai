import { renderHook, waitFor } from '@testing-library/react-native';
import { useMoment } from '../useMoment';
import { useMomentStore } from '../../stores/momentStore';
import type { MomentLocal } from '../../types';

const moment: MomentLocal = {
  id: 'm1',
  host_id: 'host-1',
  host_name: 'Kiss',
  starts_at: '2026-09-29T06:00:00Z',
  duration: 'normal',
  location: { lat: 18.79, lng: 98.97, place_name: 'Khao Soi Mae Sai' },
  seats_total: 2,
  seats_taken: 2,
  status: 'full',
  created_at: '2026-09-29T05:00:00Z',
  expires_at: '2099-01-01T00:00:00Z',
};

describe('useMoment', () => {
  beforeEach(() => {
    useMomentStore.setState({ moments: [], momentsById: {} });
  });

  it('returns a Moment already on the map without fetching', () => {
    const fetchMomentById = jest.fn();
    useMomentStore.setState({ moments: [{ ...moment, status: 'active' }], fetchMomentById });

    const { result } = renderHook(() => useMoment('m1'));

    expect(result.current.moment?.id).toBe('m1');
    expect(result.current.loading).toBe(false);
    expect(fetchMomentById).not.toHaveBeenCalled();
  });

  it('fetches a Moment that is not on the map (e.g. full) instead of "not found"', async () => {
    const fetchMomentById = jest.fn(async (id: string) => {
      useMomentStore.setState({ momentsById: { [id]: moment } });
      return moment;
    });
    useMomentStore.setState({ fetchMomentById });

    const renders: Array<ReturnType<typeof useMoment>> = [];
    const { result } = renderHook(() => {
      const value = useMoment('m1');
      renders.push(value);
      return value;
    });
    // First render must say "loading" so screens show a spinner, not "not found"
    expect(renders[0]).toEqual({ moment: undefined, loading: true });

    await waitFor(() => expect(result.current.moment?.status).toBe('full'));
    expect(result.current.loading).toBe(false);
    expect(fetchMomentById).toHaveBeenCalledWith('m1');
  });

  it('stops loading when the Moment does not exist', async () => {
    useMomentStore.setState({ fetchMomentById: jest.fn(async () => null) });

    const { result } = renderHook(() => useMoment('missing'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.moment).toBeUndefined();
  });
});
