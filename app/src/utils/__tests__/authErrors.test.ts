import { friendlyAuthError } from '../authErrors';

describe('friendlyAuthError', () => {
  it('never exposes provider details (#10)', () => {
    const twilio =
      'Error sending confirmation OTP to provider: auth account AC00000000000000000000000000000000 does not exist';
    const message = friendlyAuthError('send', twilio);
    expect(message).toBe("Couldn't send a code. Check the number and try again.");
    expect(message).not.toMatch(/twilio|AC0000|provider/i);
  });

  it('explains a bad or expired code', () => {
    expect(friendlyAuthError('verify', 'Token has expired or is invalid')).toBe(
      "That code didn't work. Check it, or ask for a new one."
    );
  });

  it('explains rate limits', () => {
    expect(friendlyAuthError('send', 'For security purposes, you can only request this after 60 seconds.')).toMatch(
      /Too many attempts/
    );
  });

  it('explains network failures', () => {
    expect(friendlyAuthError('verify', 'TypeError: Network request failed')).toMatch(/Can't reach GinMai/);
  });

  it('falls back per stage when there is no message', () => {
    expect(friendlyAuthError('profile', undefined)).toBe("Couldn't save your name. Please try again.");
  });
});
