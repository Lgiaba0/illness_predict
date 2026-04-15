from src.domain.probability import mendel_prob


def test_mendel_prob_aa_x_aa() -> None:
    assert mendel_prob("AA", "AA", "AA") == 1.0
    assert mendel_prob("AA", "AA", "Aa") == 0.0
    assert mendel_prob("AA", "AA", "aa") == 0.0


def test_mendel_prob_aa_x_aa_carrier_case() -> None:
    assert mendel_prob("Aa", "Aa", "AA") == 0.25
    assert mendel_prob("Aa", "Aa", "Aa") == 0.5
    assert mendel_prob("Aa", "Aa", "aa") == 0.25
