from piper.phonemize_espeak import EspeakPhonemizer


def test_phonemize() -> None:
    """Sanity check for phonemizer."""
    phonemizer = EspeakPhonemizer()
    assert phonemizer.phonemize("en-us", "test") == [
        ["t", "ˈ", "ɛ", "s", "t"],
    ]
