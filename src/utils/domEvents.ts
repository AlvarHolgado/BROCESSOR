/**
 * Chrome/Edge change a focused <input type="number">'s value when the
 * mouse wheel scrolls over it, instead of scrolling the page — a
 * well-known browser quirk that's easy to trigger by accident while
 * scrolling down a form. Blurring the input on wheel lets the wheel event
 * fall through to normal page scrolling instead.
 */
import type { WheelEvent } from 'react';

export function blurNumberInputOnWheel(event: WheelEvent<HTMLInputElement>): void {
  event.currentTarget.blur();
}
