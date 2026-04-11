from __future__ import annotations

from dataclasses import dataclass
import json
import logging
from pathlib import Path
from typing import Any, Protocol

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError

from app.core.settings import Settings

logger = logging.getLogger("stockxpert.snapshot_storage")


@dataclass(frozen=True)
class SnapshotRecord:
    payload: dict[str, Any]
    storage_key: str


class SnapshotStorage(Protocol):
    def read_for_date(self, date_key: str) -> SnapshotRecord | None: ...

    def read_latest(self) -> SnapshotRecord | None: ...

    def write_snapshot(self, *, date_key: str, payload: dict[str, Any]) -> str: ...


class LocalSnapshotStorage:
    def __init__(self, root_dir: Path) -> None:
        self.root_dir = root_dir

    def _path_for_date(self, date_key: str) -> Path:
        return self.root_dir / f"recommendations_{date_key}.json"

    def _read_path(self, path: Path) -> SnapshotRecord | None:
        if not path.exists():
            return None
        payload = json.loads(path.read_text(encoding="utf-8"))
        return SnapshotRecord(payload=payload, storage_key=str(path))

    def read_for_date(self, date_key: str) -> SnapshotRecord | None:
        return self._read_path(self._path_for_date(date_key))

    def read_latest(self) -> SnapshotRecord | None:
        if not self.root_dir.exists():
            return None
        matches = sorted(self.root_dir.glob("recommendations_*.json"))
        if not matches:
            return None
        return self._read_path(matches[-1])

    def write_snapshot(self, *, date_key: str, payload: dict[str, Any]) -> str:
        self.root_dir.mkdir(parents=True, exist_ok=True)
        path = self._path_for_date(date_key)
        temp_path = path.with_suffix(".tmp")
        temp_path.write_text(json.dumps(payload, ensure_ascii=True, indent=2), encoding="utf-8")
        temp_path.replace(path)
        return str(path)


class R2SnapshotStorage:
    def __init__(
        self,
        *,
        bucket: str | None,
        endpoint: str | None,
        access_key_id: str | None,
        secret_access_key: str | None,
        region: str,
        prefix: str,
    ) -> None:
        self.bucket = bucket.strip() if bucket else None
        self.endpoint = endpoint.strip() if endpoint else None
        self.access_key_id = access_key_id.strip() if access_key_id else None
        self.secret_access_key = secret_access_key.strip() if secret_access_key else None
        self.region = region
        self.prefix = prefix.strip("/")
        self._configured = all(
            [
                self.bucket,
                self.endpoint,
                self.access_key_id,
                self.secret_access_key,
            ]
        )
        self.client = None
        if self._configured:
            self.client = boto3.client(
                "s3",
                endpoint_url=self.endpoint,
                region_name=self.region,
                aws_access_key_id=self.access_key_id,
                aws_secret_access_key=self.secret_access_key,
                config=Config(signature_version="s3v4"),
            )

    def _key_for_date(self, date_key: str) -> str:
        base = f"{self.prefix}/{date_key}/all_horizons.json" if self.prefix else f"{date_key}/all_horizons.json"
        return base.lstrip("/")

    def _latest_key(self) -> str:
        base = f"{self.prefix}/latest.json" if self.prefix else "latest.json"
        return base.lstrip("/")

    def _load_json(self, key: str) -> dict[str, Any] | None:
        if not self._configured or self.client is None or self.bucket is None:
            logger.warning("R2 snapshot storage is not fully configured; skipping read for key=%s", key)
            return None
        try:
            response = self.client.get_object(Bucket=self.bucket, Key=key)
        except ClientError as exc:
            error_code = exc.response.get("Error", {}).get("Code", "")
            if error_code in {"404", "NoSuchKey", "NotFound"}:
                return None
            logger.warning("R2 snapshot read failed for key=%s: %s", key, exc)
            return None
        except BotoCoreError as exc:
            logger.warning("R2 snapshot read failed for key=%s: %s", key, exc)
            return None

        body = response["Body"].read().decode("utf-8")
        return json.loads(body)

    def read_for_date(self, date_key: str) -> SnapshotRecord | None:
        key = self._key_for_date(date_key)
        payload = self._load_json(key)
        if payload is None:
            return None
        return SnapshotRecord(payload=payload, storage_key=key)

    def read_latest(self) -> SnapshotRecord | None:
        pointer = self._load_json(self._latest_key())
        if pointer is None:
            return None
        storage_key = str(pointer.get("storage_key", "")).strip()
        if not storage_key:
            return None
        payload = self._load_json(storage_key)
        if payload is None:
            return None
        return SnapshotRecord(payload=payload, storage_key=storage_key)

    def write_snapshot(self, *, date_key: str, payload: dict[str, Any]) -> str:
        if not self._configured or self.client is None or self.bucket is None:
            raise RuntimeError("R2 snapshot storage is not configured.")

        dated_key = self._key_for_date(date_key)
        latest_key = self._latest_key()
        body = json.dumps(payload, ensure_ascii=True, indent=2).encode("utf-8")

        self.client.put_object(
            Bucket=self.bucket,
            Key=dated_key,
            Body=body,
            ContentType="application/json",
        )

        pointer_payload = {
            "storage_key": dated_key,
            "market_date": payload.get("market_date"),
            "generated_at": payload.get("generated_at"),
            "model_version": payload.get("model_version"),
        }
        self.client.put_object(
            Bucket=self.bucket,
            Key=latest_key,
            Body=json.dumps(pointer_payload, ensure_ascii=True, indent=2).encode("utf-8"),
            ContentType="application/json",
        )
        return dated_key


def build_snapshot_storage(settings: Settings) -> SnapshotStorage:
    backend = settings.snapshot_backend.strip().lower()
    if backend == "r2":
        return R2SnapshotStorage(
            bucket=settings.r2_bucket,
            endpoint=settings.r2_endpoint,
            access_key_id=settings.r2_access_key_id,
            secret_access_key=settings.r2_secret_access_key,
            region=settings.r2_region,
            prefix=settings.r2_prefix,
        )
    return LocalSnapshotStorage(settings.recommendations_snapshot_dir)
