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

    if (requestedAudio) {
      const enhancedAudioConstraints: MediaTrackConstraints = {
        noiseSuppression: true,
        echoCancellation: true,
        autoGainControl: true,
        ...(typeof requestedAudio === "boolean" ? {} : requestedAudio),
      };

      normalisedConstraints.audio = enhancedAudioConstraints;
    }

    const stream = await originalGetUserMedia(normalisedConstraints);

    if (requestedAudio) {
      await Promise.all(
        stream.getAudioTracks().map((track) =>
          track.applyConstraints({
            noiseSuppression: true,
            echoCancellation: true,
            autoGainControl: true,
          }),
        ),
      ).catch(() => {
        // applyConstraints() is best-effort – ignore unsupported backends.
      });
    }

    return stream;
  };
}
