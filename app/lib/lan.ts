// Serverless LAN transfer: WebRTC DataChannel with manual signaling.
// Both devices on the same Wi-Fi; SDP exchanged by copy-paste or QR.
// Host candidates only — no STUN, no internet, no server.

export type LanCallbacks = {
  onOpen?: () => void;
  onMessage?: (text: string) => void;
  onClose?: () => void;
};

function waitIceComplete(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    const timer = window.setTimeout(resolve, 8000);
    pc.addEventListener(
      "icegatheringstatechange",
      () => {
        if (pc.iceGatheringState === "complete") {
          window.clearTimeout(timer);
          resolve();
        }
      },
      { once: true },
    );
  });
}

function sdpToCode(sdp: string): string {
  return btoa(unescape(encodeURIComponent(sdp)));
}

function codeToSdp(code: string): string {
  return decodeURIComponent(
    [...atob(code.trim())].map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`).join(""),
  );
}

/** Sender side: returns the offer code to show, resolves channel when open. */
export async function lanOffer(cb: LanCallbacks): Promise<{
  code: string;
  pc: RTCPeerConnection;
  send: (t: string) => void;
  close: () => void;
}> {
  const pc = new RTCPeerConnection();
  const dc = pc.createDataChannel("wird");
  dc.onopen = () => cb.onOpen?.();
  dc.onmessage = (e) => cb.onMessage?.(String(e.data));
  dc.onclose = () => cb.onClose?.();
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await waitIceComplete(pc);
  const code = sdpToCode(pc.localDescription?.sdp ?? "");
  const close = () => {
    try {
      dc.close();
    } catch {}
    try {
      pc.close();
    } catch {}
  };
  return {
    code,
    pc,
    send: (t: string) => {
      if (dc.readyState === "open") dc.send(t);
    },
    close,
  };
}

/** Sender side: apply the receiver's answer code. */
export async function lanApplyAnswer(pc: RTCPeerConnection, answerCode: string): Promise<void> {
  await pc.setRemoteDescription({ type: "answer", sdp: codeToSdp(answerCode) });
}

/** Receiver side: takes offer code, returns answer code. Channel opens via cb. */
export async function lanAnswer(
  offerCode: string,
  cb: LanCallbacks,
): Promise<{ code: string; send: (t: string) => void; close: () => void }> {
  const pc = new RTCPeerConnection();
  let dc: RTCDataChannel | null = null;
  pc.ondatachannel = (e) => {
    dc = e.channel;
    dc.onopen = () => cb.onOpen?.();
    dc.onmessage = (ev) => cb.onMessage?.(String(ev.data));
    dc.onclose = () => cb.onClose?.();
  };
  await pc.setRemoteDescription({ type: "offer", sdp: codeToSdp(offerCode) });
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  await waitIceComplete(pc);
  return {
    code: sdpToCode(pc.localDescription?.sdp ?? ""),
    send: (t: string) => {
      if (dc && dc.readyState === "open") dc.send(t);
    },
    close: () => {
      try {
        dc?.close();
      } catch {}
      try {
        pc.close();
      } catch {}
    },
  };
}
