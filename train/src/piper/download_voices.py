"""Command-line utility for downloading Piper voices."""

import argparse
import json
import logging
import re
import shutil
from pathlib import Path
from urllib.request import urlopen

URL_FORMAT = "https://huggingface.co/rhasspy/piper-voices/resolve/main/{lang_family}/{lang_code}/{voice_name}/{voice_quality}/{lang_code}-{voice_name}-{voice_quality}{extension}?download=true"
VOICES_JSON = (
    "https://huggingface.co/rhasspy/piper-voices/resolve/main/voices.json?download=true"
)
VOICE_PATTERN = re.compile(
    r"^(?P<lang_family>[^-]+)_(?P<lang_region>[^-]+)-(?P<voice_name>[^-]+)-(?P<voice_quality>.+)$"
)

_LOGGER = logging.getLogger(__name__)


def main() -> None:
    """Download Piper voices."""
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "voice", nargs="*", help="Name of voice like 'en_US-lessac-medium'"
    )
    parser.add_argument(
        "--download-dir",
        "--download_dir",
        "--data-dir",
        "--data_dir",
        help="Directory to download voices into (default: current directory)",
    )
    parser.add_argument(
        "--force-redownload",
        "--force_redownload",
        action="store_true",
        help="Force redownloading of voice files even if they exist already",
    )
    parser.add_argument(
        "--debug", action="store_true", help="Print DEBUG logs to console"
    )
    args = parser.parse_args()

    logging.basicConfig(level=logging.DEBUG if args.debug else logging.INFO)

    if not args.voice:
        list_voices()
        return

    if args.download_dir:
        download_dir = Path(args.download_dir)
    else:
        download_dir = Path.cwd()

    download_dir.mkdir(parents=True, exist_ok=True)

    for voice in args.voice:
        download_voice(voice, download_dir, force_redownload=args.force_redownload)


# -----------------------------------------------------------------------------


def list_voices() -> None:
    """List available voices and exit."""
    _LOGGER.debug("Downloading voices.json file: '%s'", VOICES_JSON)
    with urlopen(VOICES_JSON) as response:
        voices_dict = json.load(response)

    for voice in sorted(voices_dict.keys()):
        print(voice)


def download_voice(
    voice: str, download_dir: Path, force_redownload: bool = False
) -> None:
    """Download a voice model and config file to a directory."""
    voice = voice.strip()
    voice_match = VOICE_PATTERN.match(voice)
    if not voice_match:
        raise ValueError(
            f"Voice '{voice}' did not match pattern: <language>-<name>-<quality> like 'en_US-lessac-medium'",
        )

    lang_family = voice_match.group("lang_family")
    lang_code = lang_family + "_" + voice_match.group("lang_region")
    voice_name = voice_match.group("voice_name")
    voice_quality = voice_match.group("voice_quality")

    voice_code = f"{lang_code}-{voice_name}-{voice_quality}"
    format_args = {
        "lang_family": lang_family,
        "lang_code": lang_code,
        "voice_name": voice_name,
        "voice_quality": voice_quality,
    }

    model_path = download_dir / f"{voice_code}.onnx"
    if force_redownload or _needs_download(model_path):
        model_url = URL_FORMAT.format(extension=".onnx", **format_args)
        _LOGGER.debug("Downloading model from '%s' to '%s'", model_url, model_path)
        with urlopen(model_url) as response:
            with open(model_path, "wb") as model_file:
                shutil.copyfileobj(response, model_file)

        _LOGGER.debug("Downloaded: '%s'", model_path)

    config_path = download_dir / f"{voice_code}.onnx.json"
    if force_redownload or _needs_download(config_path):
        config_url = URL_FORMAT.format(extension=".onnx.json", **format_args)
        _LOGGER.debug("Downloading config from '%s' to '%s'", config_url, config_path)
        with urlopen(config_url) as response:
            with open(config_path, "wb") as config_file:
                shutil.copyfileobj(response, config_file)

        _LOGGER.debug("Downloaded: '%s'", config_path)

    _LOGGER.info("Downloaded: %s", voice)


def _needs_download(path: Path) -> bool:
    """Return True if file needs to be downloaded."""
    if not path.exists():
        return True

    if path.stat().st_size == 0:
        # Empty
        return True

    return False


# -----------------------------------------------------------------------------

if __name__ == "__main__":
    main()
