import { useCallback } from 'react';
import { useBlocker } from './useBlocker';

/**
 * Prompts the user with an Alert before they leave the current screen.
 *
 * @param  message
 * @param  when
 */
export function usePrompt(message, when = true) {
  const blocker = useCallback(
    (tx) => {
      // eslint-disable-next-line no-alert
      if (window.confirm(message)) tx.retry();
    },
    [ message ]
  );

  useBlocker(blocker, when);
}
