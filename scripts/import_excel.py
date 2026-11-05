import json
from pathlib import Path

from openpyxl import load_workbook


ROOT = Path(__file__).resolve().parents[1]
WORKBOOK = ROOT.parent / "麻雀説明.xlsx"
OUTPUT = ROOT / "src" / "data" / "mahjongData.json"


def clean(value):
    if value is None:
        return None
    if isinstance(value, float) and value.is_integer():
        return int(value)
    return value


def read_records(sheet, headers, type_name, id_prefix):
    rows = sheet.iter_rows(values_only=True)
    for index, row in enumerate(rows, 1):
        if tuple(row[1:1 + len(headers)]) == tuple(headers):
            start = index + 1
            break
    else:
        raise ValueError(f"Header not found in sheet {sheet.title}")
    records = []
    for row in sheet.iter_rows(min_row=start, values_only=True):
        values = [clean(value) for value in row[1:1 + len(headers)]]
        if not any(value is not None for value in values):
            continue
        source = dict(zip(headers, values))
        number = source["No"]
        records.append({
            "id": f"{id_prefix}-{number:03d}",
            "type": type_name,
            "source": source,
        })
    return records


def main():
    workbook = load_workbook(WORKBOOK, data_only=True, read_only=True)
    roles = read_records(workbook["役一覧"], ["No", "役名", "読み方", "説明", "翻数（ハンスウ）", "鳴き"], "役", "yaku")
    terms = read_records(workbook["用語一覧"], ["No", "カテゴリ", "用語", "読み方", "説明"], "用語", "term")
    references = [
        {"label": workbook["図"]["B2"].value, "url": workbook["図"]["B1"].value},
        {"label": workbook["図"]["H2"].value, "url": workbook["図"]["H1"].value},
    ]
    data = {
        "provenance": {
            "workbook": WORKBOOK.name,
            "sheets": {"roles": "役一覧", "terms": "用語一覧", "references": "図"},
            "references": references,
        },
        "roles": roles,
        "terms": terms,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"役: {len(roles)}件 / 用語: {len(terms)}件 / 出典URL: {len(references)}件")
    print(f"出力: {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
