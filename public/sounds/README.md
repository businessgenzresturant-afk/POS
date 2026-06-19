# Sound Files for KDS

This directory contains audio files for the Kitchen Display System notifications.

## Required Files:

1. **new-order.mp3** - Standard notification sound for new orders
   - Plays when a new order arrives
   - Repeats every 30 seconds for up to 2 minutes if not acknowledged

2. **urgent.mp3** - Urgent notification sound for running table additions
   - Plays when items are added to an existing order (after 1+ minute of order creation)
   - 2-3 quick beeps pattern
   - Repeats every 30 seconds for up to 2 minutes if not acknowledged

## How to Add Sound Files:

1. Obtain or create .mp3 files for the above sounds
2. Place them in this directory with the exact names listed above
3. Ensure files are browser-compatible (MP3 format recommended)
4. Keep file sizes small for quick loading (< 100KB recommended)

## Free Sound Resources:

- https://freesound.org/
- https://www.zapsplat.com/
- https://mixkit.co/free-sound-effects/

## Browser Compatibility:

The sounds use the HTML5 Audio API which is supported in all modern browsers:
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (may require user interaction first)

Note: Some browsers block autoplay of audio until the user has interacted with the page.
The KDS page handles this gracefully by attempting to play but not throwing errors if blocked.
