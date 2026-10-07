"""N-PX primary-document metadata + EDGAR filing discovery helpers."""
from __future__ import annotations

from pathlib import Path
from xml.etree.ElementTree import parse

from votes_es.domain.models import NpxFilingMeta
from votes_es.normalization.text import parse_npx_date
from votes_es.sources.sec_npx.parser import local


def parse_primary_doc(path: Path, accession: str = "", cik: str = "") -> NpxFilingMeta:
    """Parse primary_doc.xml (edgarSubmission) — registrant type, reporting
    person, period, report type (FUND vs INSTITUTIONAL MANAGER)."""
    root = parse(path).getroot()
    text = {}
    series: list[str] = []
    for elem in root.iter():
        name = local(elem.tag)
        if name in ("submissionType", "registrantType", "periodOfReport",
                    "reportCalendarYear", "reportType", "fileNumber",
                    "leiNumber", "cik", "investmentCompanyType"):
            if elem.text and elem.text.strip():
                text.setdefault(name, elem.text.strip())
        elif name == "seriesId" and elem.text:
            series.append(elem.text.strip())
        elif name == "name" and "reportingPerson" not in text:
            # first <name> under reportingPerson cover-page block
            text["reportingPerson"] = (elem.text or "").strip()
    return NpxFilingMeta(
        accession=accession,
        cik=(text.get("cik") or cik).lstrip("0") or cik,
        submission_type=text.get("submissionType", "N-PX"),
        registrant_type=text.get("registrantType"),
        report_type=text.get("reportType"),
        reporting_person=text.get("reportingPerson"),
        reporting_person_lei=text.get("leiNumber"),
        period_of_report=parse_npx_date(text.get("periodOfReport")),
        report_calendar_year=int(text["reportCalendarYear"]) if text.get("reportCalendarYear", "").isdigit() else None,
        file_number=text.get("fileNumber"),
        series_ids=series,
    )


def is_fund_report(meta: NpxFilingMeta) -> bool:
    rt = (meta.report_type or "").upper()
    return rt.startswith("FUND")


def season_of(meta: NpxFilingMeta) -> int | None:
    """N-PX season = calendar year of the reporting period end (Jul 1–Jun 30)."""
    if meta.period_of_report:
        return meta.period_of_report.year
    return meta.report_calendar_year
