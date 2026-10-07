from votes_es.normalization.text import (
    normalize_issuer_name,
    normalize_proposal_text,
    parse_npx_date,
    parse_number,
    parse_vds_date,
    token_jaccard,
)


def test_proposal_text_normalization():
    a = normalize_proposal_text("Approve Consolidated and Standalone Financial Statements")
    b = normalize_proposal_text("1. Approve Consolidated and Standalone Financial Statements.")
    assert a == b
    assert "elect" in normalize_proposal_text("Item 5: Elect Director X.")


def test_issuer_name_normalization():
    assert normalize_issuer_name("Unicaja Banco, S.A.") == \
        normalize_issuer_name("UNICAJA BANCO S.A.")


def test_token_jaccard():
    assert token_jaccard("approve annual accounts", "approve annual accounts") == 1.0
    assert token_jaccard("approve accounts", "reject accounts") < 0.7
    assert token_jaccard("", "x") == 0.0


def test_parse_number():
    from decimal import Decimal
    assert parse_number("1841541.0") == Decimal("1841541.0")
    assert parse_number("") is None
    assert parse_number(None) is None
    assert parse_number("not-a-number") is None


def test_dates():
    from datetime import date
    assert parse_npx_date("06/09/2026") == date(2026, 6, 9)
    assert parse_npx_date("garbage") is None
    assert parse_vds_date("2026-05-29 00:00:00.0") == date(2026, 5, 29)
