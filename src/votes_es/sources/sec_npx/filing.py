"""N-PX primary-document metadata + EDGAR filing discovery helpers."""
from __future__ import annotations

from pathlib import Path
from xml.etree.ElementTree import parse

from votes_es.domain.models import NpxFilingMeta
from votes_es.normalization.text import parse_npx_date
from votes_es.sources.sec_npx.parser import local


def parse_primary_doc(path: Path, accession: str = "", cik: str = "") -> NpxFilingMeta:
    """Parse primary_doc.xml (edgarSubmission) — registrant type, reporting
    person, period, report type (FUND vs INSTITUTIONAL MANAGER), N-PX/A
    amendment info, and the summary-page joint-reporting manager list."""
    root = parse(path).getroot()
    text: dict[str, str] = {}
    series: list[str] = []
    series_names: dict[str, str] = {}
    pending_sid: str | None = None
    other_managers: list[dict] = []
    for elem in root.iter():
        name = local(elem.tag)
        if name in ("submissionType", "registrantType", "periodOfReport",
                    "reportCalendarYear", "reportType", "fileNumber",
                    "leiNumber", "cik", "investmentCompanyType",
                    "amendmentNo", "amendmentNumber", "amendmentType",
                    "amendmentTypeCode", "otherIncludedManagersCount",
                    "explanatoryChoice", "isAmendment"):
            if elem.text and elem.text.strip():
                text.setdefault(name, elem.text.strip())
        elif name == "seriesId" and elem.text:
            series.append(elem.text.strip())
        elif name == "idOfSeries" and elem.text:
            pending_sid = elem.text.strip()
            if pending_sid not in series:
                series.append(pending_sid)
        elif name == "nameOfSeries" and elem.text and pending_sid:
            series_names[pending_sid] = elem.text.strip()
            pending_sid = None
        elif name == "name" and "reportingPerson" not in text:
            # first <name> under reportingPerson cover-page block
            text["reportingPerson"] = (elem.text or "").strip()
    # second pass for the manager list (needs scoped children)
    for sp in root.iter():
        if local(sp.tag) in ("summaryPage",):
            for block in sp.iter():
                if local(block.tag) in ("otherManagersManager",):
                    mgr: dict[str, str] = {}
                    for ch in block.iter():
                        n = local(ch.tag)
                        if n in ("otherManagersNumber", "managerNumber") and ch.text:
                            mgr["number"] = ch.text.strip()
                        elif n in ("otherManagersName", "managerName") and ch.text:
                            mgr["name"] = ch.text.strip()
                        elif n in ("otherManagersCik", "cik", "cikNumber") and ch.text:
                            mgr["cik"] = ch.text.strip()
                    if mgr:
                        other_managers.append(mgr)
    amend_no = text.get("amendmentNo") or text.get("amendmentNumber")
    amend_type = (text.get("amendmentType") or text.get("amendmentTypeCode"))
    # Deliberately no default: RESTATEMENT vs NEW PROXY
    # have opposite materialization semantics — an unknown amendment must
    # stay UNKNOWN, not guessed.
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
        series_names=series_names,
        amendment_no=int(amend_no) if amend_no and amend_no.isdigit() else None,
        amendment_type=amend_type,
        other_included_managers=other_managers,
    )


def is_fund_report(meta: NpxFilingMeta) -> bool:
    rt = (meta.report_type or "").upper()
    return rt.startswith("FUND")


def season_of(meta: NpxFilingMeta) -> int | None:
    """N-PX season = calendar year of the reporting period end (Jul 1–Jun 30)."""
    if meta.period_of_report:
        return meta.period_of_report.year
    return meta.report_calendar_year
