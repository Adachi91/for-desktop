// Chromium ships the libwebrtc audio processing stack (BSD license) which
// exposes noise suppression, echo cancellation and AGC as media constraints.
// Force-enable those switches for every microphone capture so calls can rely
// on the open-source processing pipeline instead of falling back to raw audio.
const originalGetUserMedia = navigator.mediaDevices?.getUserMedia?.bind(
  navigator.mediaDevices,
);

if (originalGetUserMedia) {
  navigator.mediaDevices.getUserMedia = async (
    constraints?: MediaStreamConstraints,
  ) => {
    const normalisedConstraints: MediaStreamConstraints = constraints
      ? { ...constraints }
      : {};

    const requestedAudio = normalisedConstraints.audio;
    let enhancedAudioConstraints: MediaTrackConstraints | undefined;

    if (requestedAudio) {
      enhancedAudioConstraints =
        typeof requestedAudio === "boolean"
          ? {
              noiseSuppression: true,
              echoCancellation: true,
              autoGainControl: true,
            }
          : { ...requestedAudio };

      if (enhancedAudioConstraints.noiseSuppression === undefined) {
        enhancedAudioConstraints.noiseSuppression = true;
      }

      if (enhancedAudioConstraints.echoCancellation === undefined) {
        enhancedAudioConstraints.echoCancellation = true;
      }

      if (enhancedAudioConstraints.autoGainControl === undefined) {
        enhancedAudioConstraints.autoGainControl = true;
      }

      normalisedConstraints.audio = enhancedAudioConstraints;
    }

    const stream = await originalGetUserMedia(normalisedConstraints);

    if (requestedAudio && enhancedAudioConstraints) {
      const constraintsToApply = enhancedAudioConstraints;

      await Promise.all(
        stream
          .getAudioTracks()
          .map((track) => track.applyConstraints(constraintsToApply)),
      ).catch(() => {
        // applyConstraints() is best-effort – ignore unsupported backends.
      });
    }

    return stream;
  };
}
