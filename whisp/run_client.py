import sys

from whisper_live.client import TranscriptionClient


def make_print_callback(stream=None, *, include_partials=True):
    """
    Returns a `transcription_callback(text, segments)` that prints transcription as it arrives.

    - Prints each *completed* segment on its own line (good for piping to other tools).
    - Optionally prints the current *partial* segment in-place (carriage return).
    """
    stream = stream or sys.stdout
    emitted = (
        set()
    )  # (start, end, text) for completed segments we've already printed
    last_partial = {"text": ""}

    def on_transcription(_text, segments):
        if not segments:
            return

        # Emit newly-completed segments once.
        for seg in segments:
            if not seg.get("completed", False):
                continue
            key = (seg.get("start"), seg.get("end"), seg.get("text"))
            if key in emitted:
                continue
            emitted.add(key)
            print((seg.get("text") or "").strip(), file=stream, flush=True)

        if not include_partials:
            return

        # Show the latest partial segment in-place (useful while speaking).
        last = segments[-1]
        if last.get("completed", False):
            last_partial["text"] = ""
            return

        partial = (last.get("text") or "").strip()
        if partial and partial != last_partial["text"]:
            print(partial, end="\r", file=stream, flush=True)
            last_partial["text"] = partial

    return on_transcription


if __name__ == "__main__":
    client = TranscriptionClient(
        "localhost",
        9090,
        transcription_callback=make_print_callback(),
        log_transcription=False,
    )
    client()
