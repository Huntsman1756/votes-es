"""Source & reporter registry — the known actors, kept close to the code that
needs them. Data-level enrichment (parent groups) lives here, not scattered.
"""
from __future__ import annotations

from dataclasses import dataclass, field

from votes_es.domain.enums import (
    ExtractionTerms,
    PublicationStatus,
    ReporterType,
    ReuseStatus,
    SourceType,
    TechnicalAccess,
    TextReuse,
)


@dataclass(frozen=True)
class SourceDef:
    source_id: str
    source_type: SourceType
    name: str
    base_url: str
    reuse_status: ReuseStatus
    reporter_key: str | None = None      # for VDS: canonical reporter slug
    vds_customer_b64: str | None = None
    # reuse model — four separate questions, never one flag
    technical_access: TechnicalAccess = TechnicalAccess.UNKNOWN
    extraction_terms: ExtractionTerms = ExtractionTerms.UNKNOWN
    publication_status: PublicationStatus = PublicationStatus.UNKNOWN
    text_reuse: TextReuse = TextReuse.UNKNOWN
    aggregation_scope: str | None = None


_VDS_ACCESS = {
    "reuse_status": ReuseStatus.BLOCKED_PENDING_WRITTEN_PERMISSION,
    "technical_access": TechnicalAccess.PUBLIC_WEB_APP,
    # ISS terms prohibit automated extraction software and any reproduction
    # without prior written approval — see docs/findings/VDS-REUSE-GATE.md
    "extraction_terms": ExtractionTerms.PROHIBITED_BY_TERMS,
    "publication_status": PublicationStatus.PERMISSION_REQUIRED,
    "text_reuse": TextReuse.NONE,
}

SOURCES: dict[str, SourceDef] = {
    "sec_npx": SourceDef(
        source_id="sec_npx", source_type=SourceType.SEC_NPX,
        name="SEC EDGAR Form N-PX", base_url="https://www.sec.gov/edgar",
        reuse_status=ReuseStatus.OPEN_REUSE_CONFIRMED,
        technical_access=TechnicalAccess.PUBLIC_DOCUMENT,
        extraction_terms=ExtractionTerms.PERMITTED,
        publication_status=PublicationStatus.OPEN,
        text_reuse=TextReuse.FULL,          # US government work
    ),
    "iss_vds:caixabank-am": SourceDef(
        source_id="iss_vds:caixabank-am", source_type=SourceType.ISS_VDS,
        name="CaixaBank AM — ISS VDS register",
        base_url="https://vds.issgovernance.com/vds/#/MTEwMDY=",
        reporter_key="caixabank-am", vds_customer_b64="MTEwMDY=",
        **_VDS_ACCESS,
    ),
    "iss_vds:bbva-am": SourceDef(
        source_id="iss_vds:bbva-am", source_type=SourceType.ISS_VDS,
        name="BBVA AM — ISS VDS register",
        base_url="https://vds.issgovernance.com/vds/#/NzIxNg==",
        reporter_key="bbva-am", vds_customer_b64="NzIxNg==",
        **_VDS_ACCESS,
    ),
    # VDS registers catalogued by the G8 census — metadata/links only.
    # No automated acquisition: ISS terms prohibit extraction software.
    "iss_vds:santander-am": SourceDef(
        source_id="iss_vds:santander-am", source_type=SourceType.ISS_VDS,
        name="Santander AM (+ Pensiones) — ISS VDS register",
        base_url="https://vds.issgovernance.com/vds/#/MTI3NzI=",
        reporter_key="santander-am", vds_customer_b64="MTI3NzI=",
        **_VDS_ACCESS,
    ),
    "iss_vds:amundi": SourceDef(
        source_id="iss_vds:amundi", source_type=SourceType.ISS_VDS,
        name="Amundi (incl. delegated Sabadell AM) — ISS VDS register",
        base_url="https://vds.issgovernance.com/vds/#/Mjg1OA==/",
        reporter_key="amundi", vds_customer_b64="Mjg1OA==/",
        aggregation_scope="AMUNDI group consolidated (perimeter incl. "
                           "delegated managers; no per-entity label)",
        **_VDS_ACCESS,
    ),
    "mapfre_am": SourceDef(
        source_id="mapfre_am", source_type=SourceType.SGIIC_DIRECT,
        name="MAPFRE AM — annual vote & engagement report (itemized PDF)",
        base_url="https://www.mapfream.com/",
        reuse_status=ReuseStatus.NORMALIZED_FACTS_ALLOWED,
        reporter_key="mapfre-am",
        technical_access=TechnicalAccess.PUBLIC_DOCUMENT,
        # Mandatory disclosure under art. 47ter LIIC: SGIICs must publish
        # how they voted. Facts-only extraction; we never republish the
        # document, its structure or its expressive text. Written
        # confirmation was requested (docs/legal/MAPFRE-PERMISSION-REQUEST)
        # as belt-and-braces, but is not a publication dependency — see
        # docs/legal/NORMALIZED-FACTS-POLICY.md
        extraction_terms=ExtractionTerms.PERMITTED_FACTS_ONLY,
        publication_status=PublicationStatus.NORMALIZED_FACTS_ALLOWED,
        # source wording is kept as provenance in silver/bronze but the
        # public surface shows canonical titles + short factual labels
        text_reuse=TextReuse.SHORT_LABELS,
        aggregation_scope=(
            "Consolidated MAPFRE AM vote execution (investment funds, "
            "pension funds/EPSV and discretionary mandates incl. Grupo)"),
    ),
    "ibercaja": SourceDef(
        source_id="ibercaja", source_type=SourceType.SGIIC_DIRECT,
        name="Ibercaja Gestión — annual implication reports (PDF)",
        base_url="https://www.ibercajagestion.com/",
        reuse_status=ReuseStatus.PUBLIC_ACCESS_REUSE_UNCLEAR,
        reporter_key="ibercaja",
        technical_access=TechnicalAccess.PUBLIC_DOCUMENT,
        publication_status=PublicationStatus.PERMISSION_REQUIRED,
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
    "mapfre-am": ReporterDef(
        "mapfre-am", "MAPFRE Asset Management, S.G.I.I.C., S.A.",
        ReporterType.SGIIC, "ES", parent_group="Grupo MAPFRE"),
    "santander-am": ReporterDef(
        "santander-am", "Santander Asset Management S.A., S.G.I.I.C.",
        ReporterType.SGIIC, "ES", parent_group="Grupo Santander",
        source_identifiers={"vds_customer": "MTI3NzI="}),
    "amundi": ReporterDef(
        "amundi", "Amundi Asset Management (group consolidated)",
        ReporterType.INSTITUTIONAL_MANAGER, "FR",
        source_identifiers={"vds_customer": "Mjg1OA=="}),
}

# Known N-PX filer families → parent group (observed in season 2026).
NPX_PARENT_GROUPS = {
    "ISHARES": "BlackRock", "BLACKROCK": "BlackRock",
    "VANGUARD": "Vanguard", "SPDR": "State Street", "STATE STREET": "State Street",
    "KINGDON": "Kingdon Capital",
}
