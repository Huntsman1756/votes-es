"""Source & reporter registry — the known actors, kept close to the code that
needs them. Data-level enrichment (parent groups) lives here, not scattered.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from votes_es.domain.enums import ReporterType, ReuseStatus, SourceType


@dataclass(frozen=True)
class SourceDef:
    source_id: str
    source_type: SourceType
    name: str
    base_url: str
    reuse_status: ReuseStatus
    reporter_key: str | None = None      # for VDS: canonical reporter slug
    vds_customer_b64: str | None = None


SOURCES: dict[str, SourceDef] = {
    "sec_npx": SourceDef(
        source_id="sec_npx", source_type=SourceType.SEC_NPX,
        name="SEC EDGAR Form N-PX", base_url="https://www.sec.gov/edgar",
        reuse_status=ReuseStatus.OPEN_REUSE_CONFIRMED,
    ),
    "iss_vds:caixabank-am": SourceDef(
        source_id="iss_vds:caixabank-am", source_type=SourceType.ISS_VDS,
        name="CaixaBank AM — ISS VDS register",
        base_url="https://vds.issgovernance.com/vds/#/MTEwMDY=",
        reuse_status=ReuseStatus.PUBLIC_ACCESS_REUSE_UNCLEAR,
        reporter_key="caixabank-am", vds_customer_b64="MTEwMDY=",
    ),
    "iss_vds:bbva-am": SourceDef(
        source_id="iss_vds:bbva-am", source_type=SourceType.ISS_VDS,
        name="BBVA AM — ISS VDS register",
        base_url="https://vds.issgovernance.com/vds/#/NzIxNg==",
        reuse_status=ReuseStatus.PUBLIC_ACCESS_REUSE_UNCLEAR,
        reporter_key="bbva-am", vds_customer_b64="NzIxNg==",
    ),
    "ibercaja": SourceDef(
        source_id="ibercaja", source_type=SourceType.SGIIC_DIRECT,
        name="Ibercaja Gestión — annual implication reports (PDF)",
        base_url="https://www.ibercajagestion.com/",
        reuse_status=ReuseStatus.PUBLIC_ACCESS_REUSE_UNCLEAR,
        reporter_key="ibercaja",
    ),
}


@dataclass(frozen=True)
class ReporterDef:
    reporter_key: str
    canonical_name: str
    reporter_type: ReporterType
    country: str
    parent_group: str | None = None
    lei: str | None = None
    source_identifiers: dict[str, str] = field(default_factory=dict)


REPORTERS: dict[str, ReporterDef] = {
    "caixabank-am": ReporterDef(
        "caixabank-am", "CaixaBank Asset Management SGIIC, S.A.U.",
        ReporterType.SGIIC, "ES", parent_group="Grupo CaixaBank",
        source_identifiers={"vds_customer": "MTEwMDY="}),
    "bbva-am": ReporterDef(
        "bbva-am", "BBVA Asset Management S.A., S.G.I.I.C.",
        ReporterType.SGIIC, "ES", parent_group="Grupo BBVA",
        source_identifiers={"vds_customer": "NzIxNg=="}),
    "ibercaja": ReporterDef(
        "ibercaja", "Ibercaja Gestión, S.G.I.I.C., S.A.U.",
        ReporterType.SGIIC, "ES", parent_group="Grupo Ibercaja"),
}

# Known N-PX filer families → parent group (observed in season 2026).
NPX_PARENT_GROUPS = {
    "ISHARES": "BlackRock", "BLACKROCK": "BlackRock",
    "VANGUARD": "Vanguard", "SPDR": "State Street", "STATE STREET": "State Street",
    "KINGDON": "Kingdon Capital",
}
